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
import { IStorage } from "./storage";
import { db } from "./db";
import { and, eq, desc, asc, or, ne, sql } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Post methods
  async getPosts(filter?: string): Promise<Post[]> {
    let postsQuery = db.select().from(posts);
    
    if (filter && filter !== 'all') {
      postsQuery = postsQuery.where(eq(posts.type, filter));
    }
    
    const postsList = await postsQuery.orderBy(desc(posts.createdAt));
    
    // Populate authors and comments for each post
    return await Promise.all(postsList.map(async (post) => {
      const author = await this.getUser(post.authorId);
      const postComments = await this.getCommentsByPostId(post.id);
      
      // Populate comment authors
      const populatedComments = await Promise.all(
        postComments.map(async (comment) => {
          const commentAuthor = await this.getUser(comment.authorId);
          return {
            ...comment,
            author: commentAuthor!
          };
        })
      );
      
      return {
        ...post,
        author: author!,
        comments: populatedComments
      };
    }));
  }

  async getPostById(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    
    if (!post) return undefined;
    
    const author = await this.getUser(post.authorId);
    const postComments = await this.getCommentsByPostId(post.id);
    
    // Populate comment authors
    const populatedComments = await Promise.all(
      postComments.map(async (comment) => {
        const commentAuthor = await this.getUser(comment.authorId);
        return {
          ...comment,
          author: commentAuthor!
        };
      })
    );
    
    return {
      ...post,
      author: author!,
      comments: populatedComments
    };
  }

  async getPostsByUser(userId: number): Promise<Post[]> {
    const userPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.authorId, userId))
      .orderBy(desc(posts.createdAt));
    
    // Populate authors and comments for each post
    return await Promise.all(userPosts.map(async (post) => {
      const author = await this.getUser(post.authorId);
      const postComments = await this.getCommentsByPostId(post.id);
      
      // Populate comment authors
      const populatedComments = await Promise.all(
        postComments.map(async (comment) => {
          const commentAuthor = await this.getUser(comment.authorId);
          return {
            ...comment,
            author: commentAuthor!
          };
        })
      );
      
      return {
        ...post,
        author: author!,
        comments: populatedComments
      };
    }));
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db
      .insert(posts)
      .values(post)
      .returning();
    
    // Return the complete post with author and comments
    const fullPost = await this.getPostById(newPost.id);
    return fullPost!;
  }

  async likePost(postId: number, userId: number): Promise<void> {
    // Check if user already liked the post
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    
    if (!existingLike) {
      // Create a new like
      await db.insert(likes).values({
        postId,
        userId
      });
      
      // Increment the post like count
      await db
        .update(posts)
        .set({
          likes: sql`${posts.likes} + 1`
        })
        .where(eq(posts.id, postId));
    }
  }

  async unlikePost(postId: number, userId: number): Promise<void> {
    // Find and delete the like
    const deleted = await db
      .delete(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
      .returning();
    
    if (deleted.length > 0) {
      // Decrement the post like count
      await db
        .update(posts)
        .set({
          likes: sql`${posts.likes} - 1`
        })
        .where(eq(posts.id, postId));
    }
  }

  async hasUserLikedPost(postId: number, userId: number): Promise<boolean> {
    const [existingLike] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    
    return !!existingLike;
  }

  // Comment methods
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    
    return newComment;
  }

  // Connection methods
  async getConnections(userId: number): Promise<UserConnection[]> {
    // Get all accepted connections where userId is either requester or receiver
    const userConnections = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.status, 'accepted'),
          or(
            eq(connections.requesterId, userId),
            eq(connections.receiverId, userId)
          )
        )
      );
    
    // Return user connection objects with the other user's info
    return await Promise.all(userConnections.map(async (connection) => {
      const otherUserId = connection.requesterId === userId
        ? connection.receiverId
        : connection.requesterId;
      
      const user = await this.getUser(otherUserId);
      if (!user) throw new Error(`User with ID ${otherUserId} not found`);
      
      return {
        id: connection.id,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName || user.username,
          position: user.position,
          club: user.club,
          avatarUrl: user.avatarUrl
        }
      };
    }));
  }

  async getPendingConnections(userId: number): Promise<UserConnection[]> {
    // Get all pending connections where userId is the receiver
    const pendingConnections = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.status, 'pending'),
          eq(connections.receiverId, userId)
        )
      );
    
    // Return user connection objects with the requester's info
    return await Promise.all(pendingConnections.map(async (connection) => {
      const user = await this.getUser(connection.requesterId);
      if (!user) throw new Error(`User with ID ${connection.requesterId} not found`);
      
      return {
        id: connection.id,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName || user.username,
          position: user.position,
          club: user.club,
          avatarUrl: user.avatarUrl
        }
      };
    }));
  }

  async getSuggestedConnections(userId: number): Promise<UserConnection[]> {
    // Find users that the current user is already connected to or has pending connections with
    const connectedUsers = await db
      .select()
      .from(connections)
      .where(
        or(
          eq(connections.requesterId, userId),
          eq(connections.receiverId, userId)
        )
      );
    
    // Create a set of user IDs that we don't want to suggest
    const connectedIds = new Set<number>();
    connectedUsers.forEach(connection => {
      if (connection.requesterId === userId) {
        connectedIds.add(connection.receiverId);
      } else {
        connectedIds.add(connection.requesterId);
      }
    });
    
    // Add the current user's ID to exclude from suggestions
    connectedIds.add(userId);
    
    // Get the array of IDs to exclude
    const excludeIds = Array.from(connectedIds);
    
    // Find users not yet connected (limit to 5)
    const suggestedUsers = await db
      .select()
      .from(users)
      .where(
        excludeIds.length > 0
          ? sql`${users.id} NOT IN (${sql.join(excludeIds.map(id => sql`${id}`), sql`, `)})`
          : sql`${users.id} != ${userId}`
      )
      .limit(5);
    
    // Map to UserConnection format
    return suggestedUsers.map(user => ({
      id: Number.MAX_SAFE_INTEGER - user.id, // Temporary ID for frontend
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName || user.username,
        position: user.position,
        club: user.club,
        avatarUrl: user.avatarUrl
      }
    }));
  }

  async createConnection(connection: InsertConnection): Promise<Connection> {
    const [newConnection] = await db
      .insert(connections)
      .values({
        ...connection,
        status: 'pending'
      })
      .returning();
    
    return newConnection;
  }

  async updateConnectionStatus(id: number, status: string): Promise<Connection | undefined> {
    const [updatedConnection] = await db
      .update(connections)
      .set({ status })
      .where(eq(connections.id, id))
      .returning();
    
    return updatedConnection;
  }

  // Opportunity methods
  async getOpportunities(): Promise<Opportunity[]> {
    return db
      .select()
      .from(opportunities)
      .orderBy(desc(opportunities.createdAt));
  }

  async getOpportunityById(id: number): Promise<Opportunity | undefined> {
    const [opportunity] = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, id));
    
    return opportunity;
  }

  async createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
    const [newOpportunity] = await db
      .insert(opportunities)
      .values(opportunity)
      .returning();
    
    return newOpportunity;
  }

  // Event methods
  async getEvents(): Promise<Event[]> {
    return db
      .select()
      .from(events)
      .orderBy(asc(events.date));
  }

  async getEventById(id: number): Promise<Event | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, id));
    
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db
      .insert(events)
      .values(event)
      .returning();
    
    return newEvent;
  }

  // Message methods
  async getMessages(userId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        read: false
      })
      .returning();
    
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, id));
  }

  // Scouting insights
  async getScoutingInsights(userId: number): Promise<ScoutingData> {
    // In a real app, this would calculate metrics based on database queries
    // For now, we're returning mock data
    return {
      profileViews: 20 + Math.floor(Math.random() * 15),
      highlightViews: 143 + Math.floor(Math.random() * 50),
      opportunityMatches: 5 + Math.floor(Math.random() * 5)
    };
  }
}