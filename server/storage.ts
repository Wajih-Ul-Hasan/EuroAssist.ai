import {
  users,
  chats,
  messages,
  type User,
  type UpsertUser,
  type Chat,
  type Message,
  type InsertChat,
  type InsertMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Chat operations
  getUserChats(userId: string): Promise<Chat[]>;
  getChat(chatId: string, userId: string): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  updateChatTitle(chatId: string, title: string, userId: string): Promise<void>;
  deleteChat(chatId: string, userId: string): Promise<void>;
  
  // Message operations
  getChatMessages(chatId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Chat operations
  async getUserChats(userId: string): Promise<Chat[]> {
    return await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));
  }

  async getChat(chatId: string, userId: string): Promise<Chat | undefined> {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId) && eq(chats.userId, userId));
    return chat;
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db
      .insert(chats)
      .values(chat)
      .returning();
    return newChat;
  }

  async updateChatTitle(chatId: string, title: string, userId: string): Promise<void> {
    await db
      .update(chats)
      .set({ title, updatedAt: new Date() })
      .where(eq(chats.id, chatId) && eq(chats.userId, userId));
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    await db
      .delete(chats)
      .where(eq(chats.id, chatId) && eq(chats.userId, userId));
  }

  // Message operations
  async getChatMessages(chatId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
