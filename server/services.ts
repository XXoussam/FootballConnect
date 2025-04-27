import { IStorage, storage } from './storage';
import { 
  User, InsertUser,
  Post, InsertPost,
  Comment, InsertComment,
  Connection, InsertConnection, UserConnection,
  Opportunity, InsertOpportunity,
  Event, InsertEvent,
  Message, InsertMessage,
  ScoutingData
} from '@shared/schema';

// Base service class that all services will extend
abstract class BaseService {
  protected storage: IStorage;
  
  constructor(storageImpl: IStorage = storage) {
    this.storage = storageImpl;
  }
}

// User related services
export class UserService extends BaseService {
  async getUser(id: string): Promise<User | undefined> {
    return this.storage.getUser(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.storage.getUserByUsername(username);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    return this.storage.createUser(user);
  }
  
  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    // Here we could add business logic if needed before updating the user
    // For example, validation, logging, etc.
    console.log(`[UserService] Updating user ${id}`);
    return this.storage.updateUser(id, userData);
  }

  async getScoutingInsights(userId: string): Promise<ScoutingData> {
    return this.storage.getScoutingInsights(userId);
  }
}

// Post related services
export class PostService extends BaseService {
  async getPosts(filter?: string): Promise<Post[]> {
    return this.storage.getPosts(filter);
  }
  
  async getPostById(id: number): Promise<Post | undefined> {
    return this.storage.getPostById(id);
  }
  
  async getPostsByUser(userId: string): Promise<Post[]> {
    return this.storage.getPostsByUser(userId);
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    // Here we could add business logic
    // For example, content filtering, validation, etc.
    return this.storage.createPost(post);
  }
  
  async likePost(postId: number, userId: string): Promise<void> {
    return this.storage.likePost(postId, userId);
  }
  
  async unlikePost(postId: number, userId: string): Promise<void> {
    return this.storage.unlikePost(postId, userId);
  }
  
  async hasUserLikedPost(postId: number, userId: string): Promise<boolean> {
    return this.storage.hasUserLikedPost(postId, userId);
  }
}

// Comment related services
export class CommentService extends BaseService {
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return this.storage.getCommentsByPostId(postId);
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    // Here we could add business logic
    // For example, content moderation, notification triggers, etc.
    return this.storage.createComment(comment);
  }
}

// Connection related services
export class ConnectionService extends BaseService {
  async getConnections(userId: string): Promise<UserConnection[]> {
    return this.storage.getConnections(userId);
  }
  
  async getPendingConnections(userId: string): Promise<UserConnection[]> {
    return this.storage.getPendingConnections(userId);
  }
  
  async getSuggestedConnections(userId: string): Promise<UserConnection[]> {
    return this.storage.getSuggestedConnections(userId);
  }
  
  async createConnection(connection: InsertConnection): Promise<Connection> {
    // Here we could add business logic
    // For example, checking if a connection already exists
    return this.storage.createConnection(connection);
  }
  
  async updateConnectionStatus(id: number, status: string): Promise<Connection | undefined> {
    // Here we could add business logic
    // For example, sending notifications when a connection is accepted
    return this.storage.updateConnectionStatus(id, status);
  }
}

// Opportunity related services
export class OpportunityService extends BaseService {
  async getOpportunities(): Promise<Opportunity[]> {
    return this.storage.getOpportunities();
  }
  
  async getOpportunityById(id: number): Promise<Opportunity | undefined> {
    return this.storage.getOpportunityById(id);
  }
  
  async createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
    return this.storage.createOpportunity(opportunity);
  }
}

// Event related services
export class EventService extends BaseService {
  async getEvents(): Promise<Event[]> {
    return this.storage.getEvents();
  }
  
  async getEventById(id: number): Promise<Event | undefined> {
    return this.storage.getEventById(id);
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    return this.storage.createEvent(event);
  }
}

// Message related services
export class MessageService extends BaseService {
  async getMessages(userId: string): Promise<Message[]> {
    return this.storage.getMessages(userId);
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    return this.storage.createMessage(message);
  }
  
  async markMessageAsRead(id: number): Promise<void> {
    return this.storage.markMessageAsRead(id);
  }
}

// Create instances of each service
export const userService = new UserService();
export const postService = new PostService();
export const commentService = new CommentService();
export const connectionService = new ConnectionService();
export const opportunityService = new OpportunityService();
export const eventService = new EventService();
export const messageService = new MessageService();