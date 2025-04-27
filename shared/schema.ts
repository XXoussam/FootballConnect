import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  full_name: text("full_name"),
  position: text("position"),
  club: text("club"),
  location: text("location"),
  bio: text("bio"),
  avatar_url: text("avatar_url"),
  cover_url: text("cover_url"),
  verified: boolean("verified").default(false),
  is_pro: boolean("is_pro").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  full_name: true,
});

// Posts table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  author_id: integer("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").default("text"), // text, video, achievement, stats
  media_url: text("media_url"),
  views: integer("views").default(0),
  achievement_title: text("achievement_title"),
  achievement_subtitle: text("achievement_subtitle"),
  stats_data: jsonb("stats_data"),
  likes: integer("likes").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertPostSchema = createInsertSchema(posts).pick({
  author_id: true,
  content: true,
  type: true,
  media_url: true,
  achievement_title: true,
  achievement_subtitle: true,
  stats_data: true,
});

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  post_id: integer("post_id").notNull().references(() => posts.id),
  author_id: integer("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  post_id: true,
  author_id: true,
  content: true,
});

// Likes table
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  post_id: integer("post_id").notNull().references(() => posts.id),
  user_id: integer("user_id").notNull().references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  post_id: true,
  user_id: true,
});

// Connections table
export const connections = pgTable("connections", {
  id: serial("id").primaryKey(),
  requester_id: integer("requester_id").notNull().references(() => users.id),
  receiver_id: integer("receiver_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  created_at: timestamp("created_at").defaultNow(),
});

export const insertConnectionSchema = createInsertSchema(connections).pick({
  requester_id: true,
  receiver_id: true,
});

// Opportunities table
export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  club: text("club").notNull(),
  location: text("location").notNull(),
  category: text("category").notNull(),
  position: text("position"),
  description: text("description"),
  salary: text("salary"),
  type: text("type"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertOpportunitySchema = createInsertSchema(opportunities).pick({
  title: true,
  club: true,
  location: true,
  category: true,
  position: true,
  description: true,
  salary: true,
  type: true,
});

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  type: text("type").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  date: true,
  location: true,
  type: true,
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sender_id: integer("sender_id").notNull().references(() => users.id),
  receiver_id: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  sender_id: true,
  receiver_id: true,
  content: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Post = typeof posts.$inferSelect & {
  author: User;
  comments: Array<Comment & { author: User }>;
  hasLiked?: boolean;
};
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type UserConnection = {
  id: number;
  user: {
    id: number;
    username: string;
    full_name: string;
    position?: string;
    club?: string;
    avatar_url?: string;
  };
};

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type ScoutingData = {
  profileViews: number;
  highlightViews: number,
  opportunityMatches: number;
};
