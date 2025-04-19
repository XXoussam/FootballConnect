import { 
  users, type User, type InsertUser, 
  posts, type Post, type InsertPost, 
  comments, type Comment, type InsertComment,
  likes, type Like, type InsertLike,
  connections, type Connection, type InsertConnection, type UserConnection,
  opportunities, type Opportunity, type InsertOpportunity,
  events, type Event, type InsertEvent,
  messages, type Message, type InsertMessage,
  ScoutingData
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Post methods
  getPosts(filter?: string): Promise<Post[]>;
  getPostById(id: number): Promise<Post | undefined>;
  getPostsByUser(userId: number): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  likePost(postId: number, userId: number): Promise<void>;
  unlikePost(postId: number, userId: number): Promise<void>;
  hasUserLikedPost(postId: number, userId: number): Promise<boolean>;
  
  // Comment methods
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Connection methods
  getConnections(userId: number): Promise<UserConnection[]>;
  getPendingConnections(userId: number): Promise<UserConnection[]>;
  getSuggestedConnections(userId: number): Promise<UserConnection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnectionStatus(id: number, status: string): Promise<Connection | undefined>;
  
  // Opportunity methods
  getOpportunities(): Promise<Opportunity[]>;
  getOpportunityById(id: number): Promise<Opportunity | undefined>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  
  // Event methods
  getEvents(): Promise<Event[]>;
  getEventById(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  
  // Message methods
  getMessages(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<void>;
  
  // Scouting insights
  getScoutingInsights(userId: number): Promise<ScoutingData>;
}

// We're now importing the SupabaseStorage implementation
import { SupabaseStorage } from './supabase-storage';

// Use the SupabaseStorage implementation
export const storage = new SupabaseStorage();
