import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { generateUniversityResponse, generateChatTitle } from "./openai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Chat routes
  app.get("/api/chats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const chats = await storage.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.get("/api/chats/:chatId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  // Create chat - validate only title from the request body (userId from session)
  app.post("/api/chats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Validate only the request-provided fields (title)
      const bodySchema = z.object({
        title: z.string().min(1),
      });
      const { title } = bodySchema.parse(req.body);

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
      const userId = req.user.id;
      const { chatId } = req.params;

      await storage.deleteChat(chatId, userId);
      res.json({ message: "Chat deleted successfully" });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ message: "Failed to delete chat" });
    }
  });

  // Message routes - validate only content and role in body; chatId comes from URL param
  app.post(
    "/api/chats/:chatId/messages",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.id;
        const { chatId } = req.params;

        const bodySchema = z.object({
          content: z.string().min(1),
          role: z.enum(["user", "assistant"]),
        });
        const { content, role } = bodySchema.parse(req.body);

        // Verify chat belongs to user
        const chat = await storage.getChat(chatId, userId);
        if (!chat) {
          return res.status(404).json({ message: "Chat not found" });
        }

        // Create user message
        const userMessage = await storage.createMessage({
          chatId,
          content,
          role: "user",
        });

        // Generate AI response for user messages
        if (role === "user") {
          try {
            const aiResponse = await generateUniversityResponse(content);
            const assistantMessage = await storage.createMessage({
              chatId,
              content: aiResponse,
              role: "assistant",
            });

            // If this is the first message, update chat title
            const messages = await storage.getChatMessages(chatId);
            if (messages.length === 2) {
              // user message + assistant response
              const title = await generateChatTitle(content);
              await storage.updateChatTitle(chatId, title, userId);
            }

            res.json({ userMessage, assistantMessage });
          } catch (aiError) {
            console.error("AI response error:", aiError);
            // Return user message even if AI fails
            res.json({
              userMessage,
              error: "Failed to generate AI response. Please try again.",
            });
          }
        } else {
          res.json({ userMessage });
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid message data", errors: error.errors });
        }
        console.error("Error creating message:", error);
        res.status(500).json({ message: "Failed to create message" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
