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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private likes: Map<number, Like>;
  private connections: Map<number, Connection>;
  private opportunities: Map<number, Opportunity>;
  private events: Map<number, Event>;
  private messages: Map<number, Message>;
  
  private userIdCounter: number;
  private postIdCounter: number;
  private commentIdCounter: number;
  private likeIdCounter: number;
  private connectionIdCounter: number;
  private opportunityIdCounter: number;
  private eventIdCounter: number;
  private messageIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.connections = new Map();
    this.opportunities = new Map();
    this.events = new Map();
    this.messages = new Map();
    
    this.userIdCounter = 1;
    this.postIdCounter = 1;
    this.commentIdCounter = 1;
    this.likeIdCounter = 1;
    this.connectionIdCounter = 1;
    this.opportunityIdCounter = 1;
    this.eventIdCounter = 1;
    this.messageIdCounter = 1;
    
    // Add some sample data
    this.seedData();
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date().toISOString();
    const user: User = { 
      ...insertUser, 
      id, 
      fullName: insertUser.fullName || '',
      verified: false,
      isPro: false,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Post methods
  async getPosts(filter?: string): Promise<Post[]> {
    let result = Array.from(this.posts.values());
    
    if (filter && filter !== 'all') {
      result = result.filter(post => post.type === filter);
    }
    
    // Sort by created date (newest first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Populate each post with author and comments
    return await Promise.all(result.map(async post => {
      const author = await this.getUser(post.authorId);
      const postComments = await this.getCommentsByPostId(post.id);
      
      // Populate comment authors
      const populatedComments = await Promise.all(postComments.map(async comment => {
        const commentAuthor = await this.getUser(comment.authorId);
        return {
          ...comment,
          author: commentAuthor!
        };
      }));
      
      return {
        ...post,
        author: author!,
        comments: populatedComments
      };
    }));
  }
  
  async getPostById(id: number): Promise<Post | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    
    const author = await this.getUser(post.authorId);
    const comments = await this.getCommentsByPostId(id);
    
    // Populate comment authors
    const populatedComments = await Promise.all(comments.map(async comment => {
      const commentAuthor = await this.getUser(comment.authorId);
      return {
        ...comment,
        author: commentAuthor!
      };
    }));
    
    return {
      ...post,
      author: author!,
      comments: populatedComments
    };
  }
  
  async getPostsByUser(userId: number): Promise<Post[]> {
    const userPosts = Array.from(this.posts.values())
      .filter(post => post.authorId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Populate each post with author and comments
    return await Promise.all(userPosts.map(async post => {
      const author = await this.getUser(post.authorId);
      const postComments = await this.getCommentsByPostId(post.id);
      
      // Populate comment authors
      const populatedComments = await Promise.all(postComments.map(async comment => {
        const commentAuthor = await this.getUser(comment.authorId);
        return {
          ...comment,
          author: commentAuthor!
        };
      }));
      
      return {
        ...post,
        author: author!,
        comments: populatedComments
      };
    }));
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    const id = this.postIdCounter++;
    const now = new Date().toISOString();
    const newPost: Post = {
      ...post,
      id,
      likes: 0,
      views: 0,
      createdAt: now,
      author: {} as User,
      comments: [],
    };
    
    this.posts.set(id, newPost);
    
    // Return the complete post with author and comments
    return this.getPostById(id) as Promise<Post>;
  }
  
  async likePost(postId: number, userId: number): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) throw new Error("Post not found");
    
    // Check if user already liked the post
    const existingLike = Array.from(this.likes.values()).find(
      like => like.postId === postId && like.userId === userId
    );
    
    if (!existingLike) {
      const id = this.likeIdCounter++;
      const now = new Date().toISOString();
      const like: Like = {
        id,
        postId,
        userId,
        createdAt: now
      };
      
      this.likes.set(id, like);
      
      // Increment post likes count
      post.likes += 1;
      this.posts.set(postId, post);
    }
  }
  
  async unlikePost(postId: number, userId: number): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) throw new Error("Post not found");
    
    // Find and remove the like
    const like = Array.from(this.likes.values()).find(
      like => like.postId === postId && like.userId === userId
    );
    
    if (like) {
      this.likes.delete(like.id);
      
      // Decrement post likes count if > 0
      if (post.likes > 0) {
        post.likes -= 1;
        this.posts.set(postId, post);
      }
    }
  }
  
  async hasUserLikedPost(postId: number, userId: number): Promise<boolean> {
    return Array.from(this.likes.values()).some(
      like => like.postId === postId && like.userId === userId
    );
  }
  
  // Comment methods
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date().toISOString();
    const newComment: Comment = {
      ...comment,
      id,
      createdAt: now
    };
    
    this.comments.set(id, newComment);
    return newComment;
  }
  
  // Connection methods
  async getConnections(userId: number): Promise<UserConnection[]> {
    // Get all accepted connections where userId is either requester or receiver
    const userConnections = Array.from(this.connections.values())
      .filter(connection => 
        connection.status === 'accepted' && 
        (connection.requesterId === userId || connection.receiverId === userId)
      );
    
    // Return user connection objects with the other user's info
    return await Promise.all(userConnections.map(async connection => {
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
    const pendingConnections = Array.from(this.connections.values())
      .filter(connection => 
        connection.status === 'pending' && connection.receiverId === userId
      );
    
    // Return user connection objects with the requester's info
    return await Promise.all(pendingConnections.map(async connection => {
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
    // Get IDs of users already connected to or with pending connections
    const existingConnections = Array.from(this.connections.values())
      .filter(connection => 
        connection.requesterId === userId || connection.receiverId === userId
      );
    
    const connectedIds = new Set<number>();
    existingConnections.forEach(connection => {
      if (connection.requesterId === userId) {
        connectedIds.add(connection.receiverId);
      } else {
        connectedIds.add(connection.requesterId);
      }
    });
    
    // Add the current user's ID to exclude from suggestions
    connectedIds.add(userId);
    
    // Find users not yet connected
    const suggestedUsers = Array.from(this.users.values())
      .filter(user => !connectedIds.has(user.id))
      .slice(0, 5); // Limit to 5 suggestions
    
    // Map to UserConnection format
    return suggestedUsers.map(user => ({
      id: this.connectionIdCounter + user.id, // Temporary ID for frontend
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
    const id = this.connectionIdCounter++;
    const now = new Date().toISOString();
    const newConnection: Connection = {
      ...connection,
      id,
      status: 'pending',
      createdAt: now
    };
    
    this.connections.set(id, newConnection);
    return newConnection;
  }
  
  async updateConnectionStatus(id: number, status: string): Promise<Connection | undefined> {
    const connection = this.connections.get(id);
    if (!connection) return undefined;
    
    const updatedConnection = { ...connection, status };
    this.connections.set(id, updatedConnection);
    return updatedConnection;
  }
  
  // Opportunity methods
  async getOpportunities(): Promise<Opportunity[]> {
    return Array.from(this.opportunities.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getOpportunityById(id: number): Promise<Opportunity | undefined> {
    return this.opportunities.get(id);
  }
  
  async createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
    const id = this.opportunityIdCounter++;
    const now = new Date().toISOString();
    const newOpportunity: Opportunity = {
      ...opportunity,
      id,
      createdAt: now
    };
    
    this.opportunities.set(id, newOpportunity);
    return newOpportunity;
  }
  
  // Event methods
  async getEvents(): Promise<Event[]> {
    return Array.from(this.events.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async getEventById(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const now = new Date().toISOString();
    const newEvent: Event = {
      ...event,
      id,
      createdAt: now
    };
    
    this.events.set(id, newEvent);
    return newEvent;
  }
  
  // Message methods
  async getMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => 
        message.senderId === userId || message.receiverId === userId
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date().toISOString();
    const newMessage: Message = {
      ...message,
      id,
      read: false,
      createdAt: now
    };
    
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<void> {
    const message = this.messages.get(id);
    if (!message) return;
    
    message.read = true;
    this.messages.set(id, message);
  }
  
  // Scouting insights
  async getScoutingInsights(userId: number): Promise<ScoutingData> {
    // In a real application, this would calculate actual metrics
    return {
      profileViews: 20 + Math.floor(Math.random() * 15),
      highlightViews: 143 + Math.floor(Math.random() * 50),
      opportunityMatches: 8 + Math.floor(Math.random() * 5)
    };
  }
  
  // Seed some sample data
  private seedData() {
    // Sample users
    const users: InsertUser[] = [
      { username: "davidbeckham", password: "password123", fullName: "David Beckham" },
      { username: "waynerooney", password: "password123", fullName: "Wayne Rooney" },
      { username: "gneville", password: "password123", fullName: "Gary Neville" },
      { username: "rioferdinand", password: "password123", fullName: "Rio Ferdinand" },
      { username: "pepguardiola", password: "password123", fullName: "Pep Guardiola" },
      { username: "jklopp", password: "password123", fullName: "Jürgen Klopp" }
    ];
    
    users.forEach(user => {
      const id = this.userIdCounter++;
      const now = new Date().toISOString();
      const position = ["Midfielder", "Forward", "Defender", "Manager"][Math.floor(Math.random() * 4)];
      const club = ["Manchester United FC", "Liverpool FC", "Manchester City FC", "Bayern Munich"][Math.floor(Math.random() * 4)];
      const location = ["Manchester, UK", "Liverpool, UK", "Munich, Germany", "Barcelona, Spain"][Math.floor(Math.random() * 4)];
      const avatarUrl = `https://images.unsplash.com/photo-1${Math.floor(Math.random() * 1000000)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80`;
      
      this.users.set(id, {
        ...user,
        id,
        position,
        club,
        location,
        avatarUrl,
        verified: Math.random() > 0.5,
        isPro: Math.random() > 0.7,
        createdAt: now
      });
    });
    
    // Sample posts
    const postContents = [
      "Proud to share my free kick goal from yesterday's match against Liverpool. Thanks to the team for the great setup! 🔥⚽ #MUFC #Derby",
      "Honored to be named in the Premier League Team of the Month for September! Hard work pays off. 🏆",
      "My performance stats from the last 5 matches. Working on improving that pass completion percentage! 📊",
      "Great training session today. Working on those crosses and free kicks! ⚽",
      "Excited to announce I've been called up for the national team! 🌟 Dreams come true with hard work."
    ];
    
    const postTypes = ["text", "video", "achievement", "stats", "text"];
    
    for (let i = 0; i < 5; i++) {
      const id = this.postIdCounter++;
      const authorId = (i % users.length) + 1;
      const now = new Date();
      now.setDate(now.getDate() - Math.floor(Math.random() * 14)); // Random date within last 2 weeks
      
      const post: Post = {
        id,
        authorId,
        content: postContents[i],
        type: postTypes[i],
        likes: Math.floor(Math.random() * 1000),
        views: Math.floor(Math.random() * 10000),
        createdAt: now.toISOString(),
        author: {} as User,
        comments: []
      };
      
      if (post.type === "achievement") {
        post.achievementTitle = "Premier League Team of the Month";
        post.achievementSubtitle = "September 2023";
      }
      
      if (post.type === "video") {
        post.mediaUrl = "https://images.unsplash.com/photo-1517466787929-bc90951d0974?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
      }
      
      this.posts.set(id, post);
    }
    
    // Sample comments
    const commentContents = [
      "Great goal! 🔥",
      "Congrats on the award! Well deserved. 👏",
      "Amazing stats, keep up the good work!",
      "Looking forward to the next match!",
      "Proud of you, mate!"
    ];
    
    for (let i = 0; i < 10; i++) {
      const id = this.commentIdCounter++;
      const postId = (i % 5) + 1;
      const authorId = ((i + 2) % users.length) + 1; // Different from post author
      const now = new Date();
      now.setDate(now.getDate() - Math.floor(Math.random() * 7)); // Random date within last week
      
      const comment: Comment = {
        id,
        postId,
        authorId,
        content: commentContents[i % commentContents.length],
        createdAt: now.toISOString()
      };
      
      this.comments.set(id, comment);
    }
    
    // Sample opportunities
    const opportunitiesData: InsertOpportunity[] = [
      {
        title: "Midfielder Needed",
        club: "Liverpool FC",
        location: "Liverpool, UK",
        category: "football",
        position: "Midfielder",
        description: "Looking for an experienced midfielder with strong passing skills and field vision.",
        salary: "$50k-$80k"
      },
      {
        title: "Scouting Event - Forwards",
        club: "Juventus FC",
        location: "Turin, Italy",
        category: "training",
        position: "Forward",
        description: "Scouting event for talented forwards. Showcase your skills to Juventus scouts.",
        type: "Tryout"
      },
      {
        title: "Center-Back Position Open",
        club: "Bayern Munich",
        location: "Munich, Germany",
        category: "defense",
        position: "Defender",
        description: "Bayern Munich is seeking a strong center-back with exceptional defensive skills.",
        salary: "$70k-$90k"
      }
    ];
    
    opportunitiesData.forEach(opportunity => {
      const id = this.opportunityIdCounter++;
      const now = new Date();
      now.setDate(now.getDate() - Math.floor(Math.random() * 10)); // Random date within last 10 days
      
      this.opportunities.set(id, {
        ...opportunity,
        id,
        createdAt: now.toISOString()
      });
    });
    
    // Sample events
    const eventsData: InsertEvent[] = [
      {
        title: "Man Utd vs. Liverpool",
        description: "Premier League Match",
        date: new Date(2023, 9, 15).toISOString(),
        location: "Old Trafford, Manchester",
        type: "match"
      },
      {
        title: "Premier Skills Training",
        description: "Skills Development Program",
        date: new Date(2023, 9, 22).toISOString(),
        location: "Carrington Training Ground",
        type: "training"
      }
    ];
    
    eventsData.forEach(event => {
      const id = this.eventIdCounter++;
      const now = new Date();
      now.setDate(now.getDate() - Math.floor(Math.random() * 30)); // Random date within last month
      
      this.events.set(id, {
        ...event,
        id,
        createdAt: now.toISOString()
      });
    });
    
    // Setup some connections
    for (let i = 1; i <= 3; i++) {
      for (let j = i + 1; j <= 4; j++) {
        const id = this.connectionIdCounter++;
        const now = new Date();
        now.setDate(now.getDate() - Math.floor(Math.random() * 90)); // Random date within last 3 months
        
        this.connections.set(id, {
          id,
          requesterId: i,
          receiverId: j,
          status: 'accepted',
          createdAt: now.toISOString()
        });
      }
    }
    
    // Add a pending connection request
    const pendingId = this.connectionIdCounter++;
    this.connections.set(pendingId, {
      id: pendingId,
      requesterId: 5, // Pep Guardiola
      receiverId: 1, // David Beckham
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  }
}

export const storage = new MemStorage();
