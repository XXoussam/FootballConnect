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
  async getUser(id: string): Promise<User | undefined> {
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
  
  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    console.log('📝 Attempting to update user profile in Supabase:', { id, userData });
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase update error:', error);
        throw error;
      }
      
      console.log('✅ User profile updated successfully:', data);
      return data || undefined;
    } catch (err) {
      console.error('❌ Exception during profile update:', err);
      throw err;
    }
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
  
  async getPostsByUser(userId: string): Promise<Post[]> {
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
      author_id: post.author_id,
      content: post.content,
      type: post.type || 'text',
      media_url: post.media_url,
      achievement_title: post.achievement_title,
      achievement_subtitle: post.achievement_subtitle,
      stats_data: post.stats_data,
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
  
  async likePost(postId: number, userId: string): Promise<void> {
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
  
  async unlikePost(postId: number, userId: string): Promise<void> {
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
  
  async hasUserLikedPost(postId: number, userId: string): Promise<boolean> {
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
      post_id: comment.post_id,
      author_id: comment.author_id,
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
  async getConnections(userId: string): Promise<UserConnection[]> {
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
      const isRequester = connection.requester_id === userId;
      const otherUser = isRequester ? connection.receiver : connection.requester;
      
      return {
        id: connection.id,
        user: {
          id: otherUser.id,
          username: otherUser.username,
          full_name: otherUser.full_name || otherUser.username,
          position: otherUser.position,
          club: otherUser.club,
          avatar_url: otherUser.avatar_url
        }
      };
    });
  }
  
  async getPendingConnections(userId: string): Promise<UserConnection[]> {
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
    return data.map(connection => ({
      id: connection.id,
      user: {
        id: connection.requester.id,
        username: connection.requester.username,
        full_name: connection.requester.full_name || connection.requester.username,
        position: connection.requester.position,
        club: connection.requester.club,
        avatar_url: connection.requester.avatar_url
      }
    }));
  }
  
  async getSuggestedConnections(userId: string): Promise<UserConnection[]> {
    try {
      // Get existing connections to exclude them from suggestions
      const { data: existingConnections, error: connectionsError } = await supabase
        .from('connections')
        .select('requester_id, receiver_id')
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
      
      if (connectionsError) {
        console.error('Error fetching existing connections:', connectionsError);
        return [];
      }
      
      // Create a set of user IDs who are already connected
      const connectedIds = new Set<string>();
      connectedIds.add(userId); // Add the current user

      if (existingConnections && existingConnections.length > 0) {
        existingConnections.forEach(connection => {
          connectedIds.add(connection.requester_id);
          connectedIds.add(connection.receiver_id);
        });
      }
      
      // Fetch users who are not in the connected set
      let query = supabase.from('users').select('*');
      
      // Filter out the connected users
      if (connectedIds.size > 1) { // More than just the current user
        const idArray = Array.from(connectedIds);
        
        // Using .neq for a single ID or proper array format for multiple IDs
        if (idArray.length === 1) {
          query = query.neq('id', idArray[0]);
        } else {
          // For multiple IDs, use filter with correct PostgreSQL syntax
          // Remove the quotes around UUIDs to fix the syntax error
          query = query.filter('id', 'not.in', `(${idArray.join(',')})`);
        }
      } else {
        // If no connections yet, just exclude the current user
        query = query.neq('id', userId);
      }
      
      // Limit to 5 suggested users and order by recent sign ups
      const { data: suggestedUsers, error: suggestedError } = await query
        .limit(5)
        .order('created_at', { ascending: false });
      
      if (suggestedError) {
        console.error('Error fetching suggested users:', suggestedError);
        return [];
      }
      
      if (!suggestedUsers || suggestedUsers.length === 0) {
        console.log('No suggested users found for user:', userId);
        return [];
      }
      
      console.log(`Found ${suggestedUsers.length} suggested users for user: ${userId}`);
      
      // Map to UserConnection format
      return suggestedUsers.map(user => ({
        id: parseInt(user.id, 10) || Math.floor(Math.random() * 10000), // Convert to number or use random ID
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name || user.username,
          position: user.position || 'Player',
          club: user.club || 'Not specified',
          avatar_url: user.avatar_url
        }
      }));
    } catch (error) {
      console.error('Error in getSuggestedConnections:', error);
      return [];
    }
  }
  
  async createConnection(connection: InsertConnection): Promise<Connection> {
    // Convert to snake_case
    const supabaseConnection = {
      requester_id: connection.requester_id,
      receiver_id: connection.receiver_id,
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
  async getMessages(userId: string): Promise<Message[]> {
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
      sender_id: message.sender_id,
      receiver_id: message.receiver_id,
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
  async getScoutingInsights(userId: string): Promise<ScoutingData> {
    // In a real app, this would calculate metrics based on database queries
    // For now, return mock data
    return {
      profileViews: 20 + Math.floor(Math.random() * 15),
      highlightViews: 143 + Math.floor(Math.random() * 50),
      opportunityMatches: 5 + Math.floor(Math.random() * 5)
    };
  }
}