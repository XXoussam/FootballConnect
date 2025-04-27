import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { insertPostSchema, insertCommentSchema, insertConnectionSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import supabase from './supabase';

// Import services instead of directly importing storage
import {
  userService,
  postService,
  commentService,
  connectionService,
  opportunityService,
  eventService
} from './services';

// Middleware to extract the user from Supabase auth
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the auth token from the cookies or auth header
    const token = req.headers.authorization?.split(' ')[1] || '';
    
    if (!token) {
      // No token, continue as unauthenticated user
      // DO NOT redirect to login - client handles that
      (req as any).user = null;
      next();
      return;
    }
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      // Invalid token or user not found, but don't redirect
      console.log('Invalid token or user not found');
      (req as any).user = null;
      next();
      return;
    }
    
    // Add the user to the request for other routes to use
    (req as any).user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    // Continue as unauthenticated even on error, don't block the request
    (req as any).user = null;
    next();
  }
};

// Helper to get the current user ID from the request
function getCurrentUserId(req: Request): string | null {
  const user = (req as any).user;
  return user?.id || null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Add authentication middleware to all routes
  app.use(authenticateUser);
  
  // Error handling middleware
  const handleError = (err: Error, res: Response) => {
    console.error(err);
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    res.status(500).json({ message: err.message || "Internal server error" });
  };

  // Authentication status route
  app.get("/api/auth/status", (req: Request, res: Response) => {
    const user = (req as any).user;
    if (user) {
      res.json({ authenticated: true, user });
    } else {
      res.json({ authenticated: false });
    }
  });

  // User routes
  app.get("/api/users/me", async (req: Request, res: Response) => {
    try {
      const userId = getCurrentUserId(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await userService.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  // Add PATCH route for updating user profiles
  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const currentUserId = getCurrentUserId(req);
      const targetUserId = req.params.id;
      
      console.log('🔄 Profile update request received:', {
        currentUserId,
        targetUserId,
        body: req.body
      });
      
      if (!currentUserId) {
        console.log('❌ Profile update rejected: Not authenticated');
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Only allow users to update their own profile
      if (currentUserId !== targetUserId) {
        console.log('❌ Profile update rejected: User tried to update someone else\'s profile');
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      // Define schema for profile update
      const updateProfileSchema = z.object({
        full_name: z.string().min(2).optional(),
        position: z.string().optional(),
        club: z.string().optional(),
        location: z.string().optional(),
        bio: z.string().optional(),
        avatar_url: z.string().url().optional().or(z.literal("")),
        cover_url: z.string().url().optional().or(z.literal("")),
      });
      
      // Validate the incoming data
      console.log('🔍 Validating profile data');
      const validatedData = updateProfileSchema.parse(req.body);
      console.log('✅ Data validation successful:', validatedData);
      
      // Update the user in the database using the userService
      console.log('💾 Calling userService.updateUser');
      const updatedUser = await userService.updateUser(targetUserId, validatedData);
      
      if (!updatedUser) {
        console.log('❌ Profile update failed: User not found');
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive fields before returning
      const { password, ...userWithoutPassword } = updatedUser;
      console.log('✅ Profile update completed successfully');
      res.json(userWithoutPassword);
    } catch (err) {
      console.log('❌ Profile update error:', err);
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
      // Here we'll filter the in-memory users - this would be a good place for a userService method!
      const allUsers = [];
      for (let i = 1; i <= 10; i++) {
        const user = await userService.getUser(i.toString());
        if (user) allUsers.push(user);
      }
      
      const filteredUsers = allUsers.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(query.toLowerCase())) ||
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
      const posts = await postService.getPosts(filter);
      
      // Add hasLiked field to each post (for current user)
      const currentUserId = getCurrentUserId(req);
      const postsWithLikeStatus = await Promise.all(posts.map(async post => {
        const hasLiked = currentUserId ? await postService.hasUserLikedPost(post.id, currentUserId) : false;
        return { ...post, hasLiked };
      }));
      
      res.json(postsWithLikeStatus);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.post("/api/posts", async (req: Request, res: Response) => {
    try {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const postData = { ...req.body, authorId: currentUserId };
      const validatedData = insertPostSchema.parse(postData);
      
      const post = await postService.createPost(validatedData);
      res.status(201).json(post);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.get("/api/posts/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const posts = await postService.getPostsByUser(userId);
      
      // Add hasLiked field to each post (for current user)
      const currentUserId = getCurrentUserId(req);
      const postsWithLikeStatus = await Promise.all(posts.map(async post => {
        const hasLiked = currentUserId ? await postService.hasUserLikedPost(post.id, currentUserId) : false;
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
      
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      await postService.likePost(postId, currentUserId);
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
      
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const commentData = {
        postId,
        authorId: currentUserId,
        content: req.body.content
      };
      
      const validatedData = insertCommentSchema.parse(commentData);
      const comment = await commentService.createComment(validatedData);
      
      // Get the author to include in response
      const author = await userService.getUser(currentUserId);
      const commentWithAuthor = {
        ...comment,
        author: {
          id: author?.id,
          username: author?.username,
          fullName: author?.full_name,
          avatarUrl: author?.avatar_url
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
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const connections = await connectionService.getConnections(currentUserId);
      res.json(connections);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.get("/api/connections/pending", async (req: Request, res: Response) => {
    try {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const pendingConnections = await connectionService.getPendingConnections(currentUserId);
      res.json(pendingConnections);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.get("/api/connections/suggested", async (req: Request, res: Response) => {
    try {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const suggestedConnections = await connectionService.getSuggestedConnections(currentUserId);
      res.json(suggestedConnections);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.get("/api/connections/suggested/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const suggestedConnections = await connectionService.getSuggestedConnections(userId);
      res.json(suggestedConnections);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.post("/api/connections/connect", async (req: Request, res: Response) => {
    try {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const connectionData = {
        requesterId: currentUserId,
        receiverId: req.body.userId
      };
      
      const validatedData = insertConnectionSchema.parse(connectionData);
      
      // Validate that target user exists
      const targetUser = await userService.getUser(validatedData.receiver_id.toString());
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }
      
      const connection = await connectionService.createConnection(validatedData);
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
      
      const connection = await connectionService.updateConnectionStatus(connectionId, 'accepted');
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
      
      const connection = await connectionService.updateConnectionStatus(connectionId, 'declined');
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
      const opportunities = await opportunityService.getOpportunities();
      res.json(opportunities);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  // Event routes
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const events = await eventService.getEvents();
      res.json(events);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  // Scouting insights route
  app.get("/api/scouting-insights/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const insights = await userService.getScoutingInsights(userId);
      res.json(insights);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  return httpServer;
}
