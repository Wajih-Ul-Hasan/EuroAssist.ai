import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { generateUniversityResponse, generateChatTitle } from "./openai";
import { insertChatSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Chat routes
  app.get("/api/chats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const chats = await storage.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.get("/api/chats/:chatId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const { chatId } = req.params;

      const chat = await storage.getChat(chatId, userId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      const messages = await storage.getChatMessages(chatId);
      res.json({ chat, messages });
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  });

  app.post("/api/chats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const { title } = insertChatSchema.pick({ title: true }).parse(req.body);

      const chat = await storage.createChat({ userId, title });
      res.json(chat);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid chat data", errors: error.errors });
      }
      console.error("Error creating chat:", error);
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  app.delete("/api/chats/:chatId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const { chatId } = req.params;

      await storage.deleteChat(chatId, userId);
      res.json({ message: "Chat deleted successfully" });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ message: "Failed to delete chat" });
    }
  });

  // Message routes
  // Message routes (streaming)
app.post(
  "/api/chats/:chatId/messages",
  isAuthenticated,
  async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const { chatId } = req.params;
      const { content } = insertMessageSchema.pick({ content: true }).parse(req.body);

      // verify chat ownership
      const chat = await storage.getChat(chatId, userId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      // create user message in DB
      const userMessage = await storage.createMessage(chatId, {
        content,
        role: "user",
        chatId,
      });

      // set headers for streaming
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      try {
        // start Gemini streaming
        const { stream } = await generateUniversityResponse(content, true);

        let assistantContent = "";

        for await (const chunk of stream) {
          const text =
            chunk.candidates?.[0]?.content?.parts
              ?.map((p: any) => p.text)
              .join("") || "";

          if (text) {
            assistantContent += text;
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }

        // persist assistant message
        const assistantMessage = await storage.createMessage(chatId, {
          content: assistantContent,
          role: "assistant",
          chatId,
        });

        // update title if first exchange
        const messages = await storage.getChatMessages(chatId);
        if (messages.length === 2) {
          const title = await generateChatTitle(content);
          await storage.updateChatTitle(chatId, title, userId);
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } catch (aiError) {
        console.error("AI streaming error:", aiError);
        res.write(`data: ${JSON.stringify({ error: "Failed to stream AI response" })}\n\n`);
        res.end();
      }
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  },
);


// Stream assistant responses with SSE
app.get(
  "/api/chats/:chatId/messages/stream",
  isAuthenticated,
  async (req: any, res) => {
    try {
      const userId = req.session.user.id;
      const { chatId } = req.params;
      const { q } = req.query;

      if (!q) {
        res.status(400).json({ error: "Missing query parameter q" });
        return;
      }

      // Verify chat ownership
      const chat = await storage.getChat(chatId, userId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      // Save user message
      const userMessage = await storage.createMessage(chatId, {
        content: q.toString(),
        role: "user",
        chatId,
      });

      // SSE headers
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      // Call Gemini in streaming mode
      const { stream } = await generateUniversityResponse(q.toString(), true);

      let assistantContent = "";

      for await (const chunk of stream) {
        const text =
          chunk.candidates?.[0]?.content?.parts
            ?.map((p: any) => p.text)
            .join("") || "";
        if (text) {
          assistantContent += text;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      // Save assistant reply
      await storage.createMessage(chatId, {
        content: assistantContent,
        role: "assistant",
        chatId,
      });

      // Generate title only for first user message
      const messages = await storage.getChatMessages(chatId);
      if (messages.length === 2) {
        const title = await generateChatTitle(q.toString());
        await storage.updateChatTitle(chatId, title, userId);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      console.error("Streaming error:", err);
      res.write(`data: ${JSON.stringify({ error: "Failed to stream" })}\n\n`);
      res.end();
    }
  }
);


  const httpServer = createServer(app);
  return httpServer;
}
