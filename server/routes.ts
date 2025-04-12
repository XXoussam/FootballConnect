import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertPostSchema, insertCommentSchema, insertConnectionSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Error handling middleware
  const handleError = (err: Error, res: Response) => {
    console.error(err);
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    res.status(500).json({ message: err.message || "Internal server error" });
  };

  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { confirmPassword, ...userData } = req.body;
      const validatedData = insertUserSchema.parse(userData);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const user = await storage.createUser(validatedData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const loginSchema = z.object({
        username: z.string().min(1),
        password: z.string().min(1)
      });
      
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  // User routes
  app.get("/api/users/me", async (req: Request, res: Response) => {
    try {
      // In a real app, this would get the user from the session
      // For now, we'll return a mock logged-in user for testing
      const user = await storage.getUser(1); // David Beckham
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.get("/api/users/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string || '';
      if (query.length < 3) {
        return res.json([]);
      }
      
      // In a real app, this would search the database
      // Here we'll filter the in-memory users
      const allUsers = [];
      for (let i = 1; i <= 10; i++) {
        const user = await storage.getUser(i);
        if (user) allUsers.push(user);
      }
      
      const filteredUsers = allUsers.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        (user.fullName && user.fullName.toLowerCase().includes(query.toLowerCase())) ||
        (user.club && user.club.toLowerCase().includes(query.toLowerCase()))
      );
      
      const usersWithoutPasswords = filteredUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  // Post routes
  app.get("/api/posts", async (req: Request, res: Response) => {
    try {
      const filter = req.query.filter as string || 'all';
      const posts = await storage.getPosts(filter);
      
      // Add hasLiked field to each post (for current user)
      const currentUserId = 1; // Assuming user 1 is logged in
      const postsWithLikeStatus = await Promise.all(posts.map(async post => {
        const hasLiked = await storage.hasUserLikedPost(post.id, currentUserId);
        return { ...post, hasLiked };
      }));
      
      res.json(postsWithLikeStatus);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.post("/api/posts", async (req: Request, res: Response) => {
    try {
      // In a real app, get the current user ID from the session
      const currentUserId = 1; // Assuming user 1 is logged in
      
      const postData = { ...req.body, authorId: currentUserId };
      const validatedData = insertPostSchema.parse(postData);
      
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.get("/api/posts/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const posts = await storage.getPostsByUser(userId);
      
      // Add hasLiked field to each post (for current user)
      const currentUserId = 1; // Assuming user 1 is logged in
      const postsWithLikeStatus = await Promise.all(posts.map(async post => {
        const hasLiked = await storage.hasUserLikedPost(post.id, currentUserId);
        return { ...post, hasLiked };
      }));
      
      res.json(postsWithLikeStatus);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.post("/api/posts/:id/like", async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // In a real app, get the current user ID from the session
      const currentUserId = 1; // Assuming user 1 is logged in
      
      await storage.likePost(postId, currentUserId);
      res.json({ success: true });
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.post("/api/posts/:id/comments", async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // In a real app, get the current user ID from the session
      const currentUserId = 1; // Assuming user 1 is logged in
      
      const commentData = {
        postId,
        authorId: currentUserId,
        content: req.body.content
      };
      
      const validatedData = insertCommentSchema.parse(commentData);
      const comment = await storage.createComment(validatedData);
      
      // Get the author to include in response
      const author = await storage.getUser(currentUserId);
      const commentWithAuthor = {
        ...comment,
        author: {
          id: author?.id,
          username: author?.username,
          fullName: author?.fullName,
          avatarUrl: author?.avatarUrl
        }
      };
      
      res.status(201).json(commentWithAuthor);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  // Connection routes
  app.get("/api/connections", async (req: Request, res: Response) => {
    try {
      // In a real app, get the current user ID from the session
      const currentUserId = 1; // Assuming user 1 is logged in
      
      const connections = await storage.getConnections(currentUserId);
      res.json(connections);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.get("/api/connections/pending", async (req: Request, res: Response) => {
    try {
      // In a real app, get the current user ID from the session
      const currentUserId = 1; // Assuming user 1 is logged in
      
      const pendingConnections = await storage.getPendingConnections(currentUserId);
      res.json(pendingConnections);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.get("/api/connections/suggested", async (req: Request, res: Response) => {
    try {
      // In a real app, get the current user ID from the session
      const currentUserId = 1; // Assuming user 1 is logged in
      
      const suggestedConnections = await storage.getSuggestedConnections(currentUserId);
      res.json(suggestedConnections);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.post("/api/connections/connect", async (req: Request, res: Response) => {
    try {
      // In a real app, get the current user ID from the session
      const currentUserId = 1; // Assuming user 1 is logged in
      
      const connectionData = {
        requesterId: currentUserId,
        receiverId: req.body.userId
      };
      
      const validatedData = insertConnectionSchema.parse(connectionData);
      
      // Validate that target user exists
      const targetUser = await storage.getUser(validatedData.receiverId);
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }
      
      const connection = await storage.createConnection(validatedData);
      res.status(201).json(connection);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.post("/api/connections/:id/accept", async (req: Request, res: Response) => {
    try {
      const connectionId = parseInt(req.params.id);
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.updateConnectionStatus(connectionId, 'accepted');
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      res.json(connection);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.post("/api/connections/:id/decline", async (req: Request, res: Response) => {
    try {
      const connectionId = parseInt(req.params.id);
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const connection = await storage.updateConnectionStatus(connectionId, 'declined');
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      res.json(connection);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  // Opportunity routes
  app.get("/api/opportunities", async (req: Request, res: Response) => {
    try {
      const opportunities = await storage.getOpportunities();
      res.json(opportunities);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  // Event routes
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  // Scouting insights route
  app.get("/api/scouting-insights/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const insights = await storage.getScoutingInsights(userId);
      res.json(insights);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  return httpServer;
}
