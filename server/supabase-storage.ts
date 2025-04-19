import supabase from './supabase';
import { 
  User, InsertUser, 
  Post, InsertPost, 
  Comment, InsertComment,
  Like, InsertLike,
  Connection, InsertConnection, UserConnection,
  Opportunity, InsertOpportunity,
  Event, InsertEvent,
  Message, InsertMessage,
  ScoutingData
} from "@shared/schema";
import { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const { data } = await supabase
      .from('users')
      .select()
      .eq('id', id)
      .single();
    
    return data || undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data } = await supabase
      .from('users')
      .select()
      .eq('username', username)
      .single();
    
    return data || undefined;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const { data } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    return data || undefined;
  }
  
  // Post methods
  async getPosts(filter?: string): Promise<Post[]> {
    let query = supabase.from('posts').select(`
      *,
      author:users(*),
      comments:comments(*)
    `);
    
    if (filter && filter !== 'all') {
      query = query.eq('type', filter);
    }
    
    const { data } = await query.order('created_at', { ascending: false });
    
    if (!data) return [];
    
    // Transform data to match the expected Post format
    return data.map((post: any) => ({
      ...post,
      authorId: post.author_id,
      comments: post.comments.map((comment: any) => ({
        ...comment,
        postId: comment.post_id,
        authorId: comment.author_id,
      })),
    }));
  }
  
  async getPostById(id: number): Promise<Post | undefined> {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:users(*),
        comments:comments(*, author:users(*))
      `)
      .eq('id', id)
      .single();
    
    if (!data) return undefined;
    
    // Transform data to match the expected Post format
    return {
      ...data,
      authorId: data.author_id,
      comments: data.comments.map((comment: any) => ({
        ...comment,
        postId: comment.post_id,
        authorId: comment.author_id,
      })),
    };
  }
  
  async getPostsByUser(userId: number): Promise<Post[]> {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:users(*),
        comments:comments(*, author:users(*))
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });
    
    if (!data) return [];
    
    // Transform data to match the expected Post format
    return data.map((post: any) => ({
      ...post,
      authorId: post.author_id,
      comments: post.comments.map((comment: any) => ({
        ...comment,
        postId: comment.post_id,
        authorId: comment.author_id,
      })),
    }));
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    // Convert Drizzle-style camelCase to Supabase snake_case
    const supabasePost = {
      author_id: post.authorId,
      content: post.content,
      type: post.type || 'text',
      media_url: post.mediaUrl,
      achievement_title: post.achievementTitle,
      achievement_subtitle: post.achievementSubtitle,
      stats_data: post.statsData,
      likes: 0
    };
    
    const { data, error } = await supabase
      .from('posts')
      .insert(supabasePost)
      .select()
      .single();
    
    if (error) throw error;
    
    // Fetch the complete post with author and comments
    return this.getPostById(data.id) as Promise<Post>;
  }
  
  async likePost(postId: number, userId: number): Promise<void> {
    // Check if user already liked the post
    const { data: existingLike } = await supabase
      .from('likes')
      .select()
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();
    
    if (!existingLike) {
      // Create a new like
      await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: userId
        });
      
      // Increment post like count
      await supabase
        .from('posts')
        .update({ likes: supabase.rpc('increment_likes', { row_id: postId }) })
        .eq('id', postId);
    }
  }
  
  async unlikePost(postId: number, userId: number): Promise<void> {
    // Delete the like
    const { data } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    
    if (data) {
      // Decrement post like count
      await supabase
        .from('posts')
        .update({ likes: supabase.rpc('decrement_likes', { row_id: postId }) })
        .eq('id', postId);
    }
  }
  
  async hasUserLikedPost(postId: number, userId: number): Promise<boolean> {
    const { data } = await supabase
      .from('likes')
      .select()
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();
    
    return !!data;
  }
  
  // Comment methods
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    const { data } = await supabase
      .from('comments')
      .select()
      .eq('post_id', postId)
      .order('created_at');
    
    return data || [];
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    // Convert to snake_case
    const supabaseComment = {
      post_id: comment.postId,
      author_id: comment.authorId,
      content: comment.content
    };
    
    const { data, error } = await supabase
      .from('comments')
      .insert(supabaseComment)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Connection methods
  async getConnections(userId: number): Promise<UserConnection[]> {
    // Get all accepted connections where userId is either requester or receiver
    const { data } = await supabase
      .from('connections')
      .select(`
        *,
        requester:users!requester_id(*),
        receiver:users!receiver_id(*)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
    
    if (!data) return [];
    
    // Return user connection objects with the other user's info
    return data.map(connection => {
      const otherUser = connection.requester_id === userId 
        ? connection.receiver 
        : connection.requester;
      
      return {
        id: connection.id,
        user: {
          id: otherUser.id,
          username: otherUser.username,
          fullName: otherUser.full_name || otherUser.username,
          position: otherUser.position,
          club: otherUser.club,
          avatarUrl: otherUser.avatar_url
        }
      };
    });
  }
  
  async getPendingConnections(userId: number): Promise<UserConnection[]> {
    // Get all pending connections where userId is the receiver
    const { data } = await supabase
      .from('connections')
      .select(`
        *,
        requester:users!requester_id(*)
      `)
      .eq('status', 'pending')
      .eq('receiver_id', userId);
    
    if (!data) return [];
    
    // Return user connection objects with the requester's info
    return data.map(connection => {
      return {
        id: connection.id,
        user: {
          id: connection.requester.id,
          username: connection.requester.username,
          fullName: connection.requester.full_name || connection.requester.username,
          position: connection.requester.position,
          club: connection.requester.club,
          avatarUrl: connection.requester.avatar_url
        }
      };
    });
  }
  
  async getSuggestedConnections(userId: number): Promise<UserConnection[]> {
    // This is more complex with Supabase, may require a custom function
    // Simple approach: fetch some users who are not already connected
    const { data: existingConnections } = await supabase
      .from('connections')
      .select('requester_id, receiver_id')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
    
    // Create a set of user IDs who are already connected
    const connectedIds = new Set<number>();
    connectedIds.add(userId); // Add the current user

    if (existingConnections) {
      existingConnections.forEach(connection => {
        connectedIds.add(connection.requester_id);
        connectedIds.add(connection.receiver_id);
      });
    }
    
    // Fetch users who are not in the connected set
    const { data: suggestedUsers } = await supabase
      .from('users')
      .select()
      .not('id', 'in', `(${Array.from(connectedIds).join(',')})`)
      .limit(5);
    
    if (!suggestedUsers) return [];
    
    // Map to UserConnection format
    return suggestedUsers.map(user => ({
      id: -user.id, // Temporary negative ID for frontend
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name || user.username,
        position: user.position,
        club: user.club,
        avatarUrl: user.avatar_url
      }
    }));
  }
  
  async createConnection(connection: InsertConnection): Promise<Connection> {
    // Convert to snake_case
    const supabaseConnection = {
      requester_id: connection.requesterId,
      receiver_id: connection.receiverId,
      status: 'pending'
    };
    
    const { data, error } = await supabase
      .from('connections')
      .insert(supabaseConnection)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async updateConnectionStatus(id: number, status: string): Promise<Connection | undefined> {
    const { data } = await supabase
      .from('connections')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    return data || undefined;
  }
  
  // Opportunity methods
  async getOpportunities(): Promise<Opportunity[]> {
    const { data } = await supabase
      .from('opportunities')
      .select()
      .order('created_at', { ascending: false });
    
    return data || [];
  }
  
  async getOpportunityById(id: number): Promise<Opportunity | undefined> {
    const { data } = await supabase
      .from('opportunities')
      .select()
      .eq('id', id)
      .single();
    
    return data || undefined;
  }
  
  async createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
    // Convert to snake_case
    const supabaseOpportunity = {
      title: opportunity.title,
      club: opportunity.club,
      location: opportunity.location,
      category: opportunity.category,
      position: opportunity.position || null,
      description: opportunity.description || null,
      salary: opportunity.salary || null,
      type: opportunity.type || null
    };
    
    const { data, error } = await supabase
      .from('opportunities')
      .insert(supabaseOpportunity)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Event methods
  async getEvents(): Promise<Event[]> {
    const { data } = await supabase
      .from('events')
      .select()
      .order('date');
    
    return data || [];
  }
  
  async getEventById(id: number): Promise<Event | undefined> {
    const { data } = await supabase
      .from('events')
      .select()
      .eq('id', id)
      .single();
    
    return data || undefined;
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Message methods
  async getMessages(userId: number): Promise<Message[]> {
    const { data } = await supabase
      .from('messages')
      .select()
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at');
    
    return data || [];
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    // Convert to snake_case
    const supabaseMessage = {
      sender_id: message.senderId,
      receiver_id: message.receiverId,
      content: message.content,
      read: false
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert(supabaseMessage)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async markMessageAsRead(id: number): Promise<void> {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', id);
  }
  
  // Scouting insights
  async getScoutingInsights(userId: number): Promise<ScoutingData> {
    // In a real app, this would calculate metrics based on database queries
    // For now, return mock data
    return {
      profileViews: 20 + Math.floor(Math.random() * 15),
      highlightViews: 143 + Math.floor(Math.random() * 50),
      opportunityMatches: 5 + Math.floor(Math.random() * 5)
    };
  }
}