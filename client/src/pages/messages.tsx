import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getCurrentUser, supabase } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";

// Helper function to access properties that might be in different formats
const getProperty = (obj: any, camelCase: string, snakeCase: string) => {
  return obj && (obj[camelCase] !== undefined ? obj[camelCase] : obj[snakeCase]);
};

// Get initials from name
const getInitials = (name: string) => {
  if (!name) return "";
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('');
};

// Message service to organize data access methods
class MessageService {
  // Fetch conversations for the current user
  static async getConversations(userId: string): Promise<any[]> {
    try {
      // Get all unique conversations by finding distinct sender/receiver pairs
      const { data: sentMessages, error: sentError } = await supabase
        .from('messages')
        .select(`
          id,
          receiver:receiver_id(*),
          content,
          created_at,
          read
        `)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false });

      const { data: receivedMessages, error: receivedError } = await supabase
        .from('messages')
        .select(`
          id,
          sender:sender_id(*),
          content,
          created_at,
          read
        `)
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false });

      if (sentError || receivedError) {
        console.error("Error fetching messages:", sentError || receivedError);
        return [];
      }

      // Create a map of conversations by the other user's ID
      const conversationsMap = new Map();

      // Process sent messages
      (sentMessages || []).forEach(message => {
        const otherUserId = message.receiver.id;
        
        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            user: message.receiver,
            lastMessage: message.content,
            lastMessageDate: message.created_at,
            unread: 0,
            messages: []
          });
        }
        
        // Add this message to the conversation
        const conversation = conversationsMap.get(otherUserId);
        conversation.messages.push({
          id: message.id,
          content: message.content,
          created_at: message.created_at,
          is_sent_by_me: true,
          read: message.read
        });
        
        // Update last message if this is newer
        if (new Date(message.created_at) > new Date(conversation.lastMessageDate)) {
          conversation.lastMessage = message.content;
          conversation.lastMessageDate = message.created_at;
        }
      });

      // Process received messages
      (receivedMessages || []).forEach(message => {
        const otherUserId = message.sender.id;
        
        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            user: message.sender,
            lastMessage: message.content,
            lastMessageDate: message.created_at,
            unread: message.read ? 0 : 1,
            messages: []
          });
        } else {
          // Increment unread count if this message is unread
          if (!message.read) {
            conversationsMap.get(otherUserId).unread += 1;
          }
        }
        
        // Add this message to the conversation
        const conversation = conversationsMap.get(otherUserId);
        conversation.messages.push({
          id: message.id,
          content: message.content,
          created_at: message.created_at,
          is_sent_by_me: false,
          read: message.read
        });
        
        // Update last message if this is newer
        if (new Date(message.created_at) > new Date(conversation.lastMessageDate)) {
          conversation.lastMessage = message.content;
          conversation.lastMessageDate = message.created_at;
        }
      });

      // Convert map to array and sort by last message date (newest first)
      return Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime());
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      return [];
    }
  }

  // Get messages between current user and another user
  static async getMessageThread(currentUserId: string, otherUserId: string): Promise<any[]> {
    try {
      // Get messages where current user is either sender or receiver and the other user is the counterpart
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          read
        `)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching message thread:", error);
        return [];
      }

      // Mark all received messages as read
      const messagesToMark = data
        .filter(msg => msg.receiver_id === currentUserId && !msg.read)
        .map(msg => msg.id);

      if (messagesToMark.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', messagesToMark);
      }

      // Format the messages with is_sent_by_me flag
      return data.map(msg => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        is_sent_by_me: msg.sender_id === currentUserId,
        read: msg.read
      }));
    } catch (error) {
      console.error("Failed to fetch message thread:", error);
      return [];
    }
  }

  // Send a new message
  static async sendMessage(senderId: string, receiverId: string, content: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          read: false
        })
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }
}

// Format date helper
const formatMessageDate = (date: string) => {
  if (!date) return "";
  
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (error) {
    return "recently";
  }
};

const MessageThread = ({ currentUser, otherUser, onBack }: { currentUser: User, otherUser: any, onBack: () => void }) => {
  const [messageContent, setMessageContent] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch message thread
  const { data: messages = [], refetch } = useQuery({
    queryKey: ["messageThread", currentUser.id, otherUser.id],
    queryFn: () => MessageService.getMessageThread(currentUser.id, otherUser.id),
    enabled: !!(currentUser?.id && otherUser?.id),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => 
      MessageService.sendMessage(currentUser.id, otherUser.id, content),
    onSuccess: () => {
      setMessageContent("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["conversations", currentUser.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle sending a message
  const handleSendMessage = () => {
    if (messageContent.trim()) {
      sendMessageMutation.mutate(messageContent);
    }
  };

  // Extract properties safely
  const otherUserAvatar = getProperty(otherUser, 'avatarUrl', 'avatar_url');
  const otherUserFullName = getProperty(otherUser, 'fullName', 'full_name') || otherUser.username;

  return (
    <div className="flex flex-col h-full">
      {/* Mobile-friendly back button and header */}
      <div className="bg-white p-4 flex items-center gap-3 border-b sticky top-0 z-10">
        <button 
          className="md:hidden p-2 hover:bg-neutral-100 rounded-full"
          onClick={onBack}
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <Avatar className="w-10 h-10">
          {otherUserAvatar ? (
            <AvatarImage src={otherUserAvatar} alt={otherUserFullName} />
          ) : null}
          <AvatarFallback>{getInitials(otherUserFullName)}</AvatarFallback>
        </Avatar>
        <div>
          <Link href={`/profile/${otherUser.id}`}>
            <a className="font-medium hover:text-primary">{otherUserFullName}</a>
          </Link>
          <p className="text-xs text-neutral-500">
            {otherUser.position || "Player"} • {otherUser.club || "Unknown club"}
          </p>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-grow p-4 overflow-y-auto bg-neutral-50">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center text-neutral-400 py-8">
              <i className="fas fa-comments text-4xl mb-3"></i>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message: any) => (
              <div 
                key={message.id} 
                className={`flex ${message.is_sent_by_me ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    message.is_sent_by_me 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white border rounded-tl-none'
                  }`}
                >
                  <p>{message.content}</p>
                  <p 
                    className={`text-xs mt-1 ${
                      message.is_sent_by_me ? 'text-primary-foreground/70' : 'text-neutral-400'
                    }`}
                  >
                    {formatMessageDate(message.created_at)}
                    {message.is_sent_by_me && (
                      <span className="ml-1">
                        {message.read ? (
                          <i className="fas fa-check-double"></i>
                        ) : (
                          <i className="fas fa-check"></i>
                        )}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!messageContent.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-paper-plane"></i>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const Messages = () => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);
  const { toast } = useToast();
  
  // Query to get current user
  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });

  // Query to get conversations
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", currentUser?.id],
    queryFn: () => MessageService.getConversations(currentUser?.id?.toString() || ""),
    enabled: !!currentUser?.id,
  });

  // When a conversation is selected
  const handleSelectConversation = (conversation: any) => {
    setSelectedUser(conversation.user);
    setShowThreadOnMobile(true);
  };

  // Handle going back to conversation list on mobile
  const handleBackToConversations = () => {
    setShowThreadOnMobile(false);
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Please log in to view your messages.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-3 h-[70vh]">
          {/* Conversation List - Hide on mobile when thread is shown */}
          <div 
            className={`border-r md:col-span-1 ${showThreadOnMobile ? 'hidden md:block' : 'block'}`}
          >
            <div className="p-4 border-b">
              <Input placeholder="Search messages..." className="w-full" />
            </div>
            
            <div className="overflow-y-auto h-[calc(70vh-65px)]">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                      <div className="flex-grow">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center p-8 text-neutral-500">
                  <i className="fas fa-inbox text-4xl text-neutral-300 mb-3"></i>
                  <p className="mb-2">No messages yet</p>
                  <p className="text-sm">
                    Connect with other professionals and start a conversation
                  </p>
                </div>
              ) : (
                <div>
                  {conversations.map((conversation) => {
                    const user = conversation.user;
                    const avatarUrl = getProperty(user, 'avatarUrl', 'avatar_url');
                    const fullName = getProperty(user, 'fullName', 'full_name') || user.username;
                    
                    return (
                      <div 
                        key={user.id}
                        className={`p-4 hover:bg-neutral-50 cursor-pointer border-b ${
                          selectedUser?.id === user.id ? 'bg-neutral-50' : ''
                        }`}
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              {avatarUrl ? (
                                <AvatarImage src={avatarUrl} alt={fullName} />
                              ) : null}
                              <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                            </Avatar>
                            {/* Online status indicator would go here */}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-center">
                              <div className="font-medium truncate">{fullName}</div>
                              <div className="text-xs text-neutral-400">
                                {formatMessageDate(conversation.lastMessageDate)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-neutral-500 truncate">
                                {conversation.lastMessage}
                              </p>
                              {conversation.unread > 0 && (
                                <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {conversation.unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Message Thread - Show on mobile only when a conversation is selected */}
          <div 
            className={`md:col-span-2 h-full ${showThreadOnMobile ? 'block' : 'hidden md:block'}`}
          >
            {selectedUser ? (
              <MessageThread 
                currentUser={currentUser} 
                otherUser={selectedUser} 
                onBack={handleBackToConversations} 
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-500">
                <i className="fas fa-comments text-6xl mb-4 text-neutral-300"></i>
                <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
                <p>Choose a conversation from the list to see messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;