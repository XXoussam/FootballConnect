import { User } from "@shared/schema";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import EditProfileDialog from "./EditProfileDialog";
// Helper function to access properties that might be in different formats
const getProperty = (obj: any, camelCase: string, snakeCase: string) => {
  return obj[camelCase] !== undefined ? obj[camelCase] : obj[snakeCase];
};

// Get initials from name
const getInitials = (name: string) => {
  if (!name) return "";
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('');
};

interface ProfileCardProps {
  user: User | any; // Allow any to handle database response format
  isCurrentUser?: boolean;
  currentUser?: User | null; // Current logged-in user
}

const ProfileCard = ({ user, isCurrentUser = false, currentUser }: ProfileCardProps) => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isPendingFromUs, setIsPendingFromUs] = useState<boolean | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract properties safely with fallbacks to different formats
  const avatarUrl = getProperty(user, 'avatarUrl', 'avatar_url');
  const fullName = getProperty(user, 'fullName', 'full_name');
  const coverUrl = getProperty(user, 'coverUrl', 'cover_url');
  const isPro = getProperty(user, 'isPro', 'is_pro');
  const username = user.username;
  const position = user.position;
  const club = user.club;
  const location = user.location;
  const bio = user.bio;
  const verified = user.verified;

  // Check the connection status between the current user and profile user
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (isCurrentUser || !currentUser || !user?.id || !currentUser?.id) {
        return;
      }
      
      try {
        // Check if there's a connection request in either direction
        const { data, error } = await supabase
          .from('connections')
          .select('*')
          .or(`requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
        
        if (error) {
          console.error("Error checking connection status:", error);
          return;
        }
        
        // Find the connection between these two users
        const connection = data?.find(conn => 
          (conn.requester_id === currentUser.id && conn.receiver_id === user.id) || 
          (conn.requester_id === user.id && conn.receiver_id === currentUser.id)
        );
        
        if (connection) {
          setConnectionStatus(connection.status);
          
          // Check if current user is the requester (for pending connections)
          if (connection.status === 'pending') {
            setIsPendingFromUs(connection.requester_id === currentUser.id);
          }
        }
        
      } catch (error) {
        console.error("Failed to check connection status:", error);
      }
    };
    
    checkConnectionStatus();
  }, [currentUser, user, isCurrentUser]);

  // Send connection request mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !user?.id) {
        throw new Error("Unable to send connection request");
      }
      
      const { data, error } = await supabase
        .from('connections')
        .insert({
          requester_id: currentUser.id,
          receiver_id: user.id,
          status: 'pending',
        })
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Connection requested",
        description: `You've sent a connection request to ${fullName || username}`,
      });
      setConnectionStatus('pending');
      setIsPendingFromUs(true);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: (error) => {
      console.error("Failed to send connection request:", error);
      toast({
        title: "Error",
        description: "Failed to send connection request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel connection request mutation
  const cancelRequestMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !user?.id) {
        throw new Error("Unable to cancel connection request");
      }
      
      const { data: connectionData, error: fetchError } = await supabase
        .from('connections')
        .select('*')
        .eq('requester_id', currentUser.id)
        .eq('receiver_id', user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error: deleteError } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionData.id);
      
      if (deleteError) throw deleteError;
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Request cancelled",
        description: "Your connection request has been cancelled",
      });
      setConnectionStatus(null);
      setIsPendingFromUs(null);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: (error) => {
      console.error("Failed to cancel connection request:", error);
      toast({
        title: "Error",
        description: "Failed to cancel request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Accept connection request mutation
  const acceptConnectionMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser || !user?.id) {
        throw new Error("Unable to accept connection request");
      }
      
      const { data: connectionData, error: fetchError } = await supabase
        .from('connections')
        .select('*')
        .eq('requester_id', user.id)
        .eq('receiver_id', currentUser.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error: updateError } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionData.id);
      
      if (updateError) throw updateError;
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Connected",
        description: `You're now connected with ${fullName || username}`,
      });
      setConnectionStatus('accepted');
      setIsPendingFromUs(null);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: (error) => {
      console.error("Failed to accept connection request:", error);
      toast({
        title: "Error",
        description: "Failed to accept connection. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Determine appropriate connection button state
  const renderConnectionButton = () => {
    if (isCurrentUser) {
      return (
        <button 
          className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-lg text-neutral-700 hover:bg-gray-50"
          onClick={() => setIsEditProfileOpen(true)}
        >
          Edit Profile
        </button>
      );
    }

    // Not logged in
    if (!currentUser) {
      return (
        <button 
          className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-lg text-neutral-700 opacity-50 cursor-not-allowed"
          disabled
        >
          Sign in to connect
        </button>
      );
    }

    // Already connected
    if (connectionStatus === 'accepted') {
      return (
        <button 
          className="mt-4 w-full py-2 px-4 border border-green-500 bg-green-50 text-green-700 rounded-lg flex items-center justify-center gap-2"
          disabled
        >
          <Check size={18} />
          Connected
        </button>
      );
    }

    // Pending connection
    if (connectionStatus === 'pending') {
      // We sent the request
      if (isPendingFromUs === true) {
        return (
          <button 
            className="mt-4 w-full py-2 px-4 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50"
            onClick={() => cancelRequestMutation.mutate()}
            disabled={cancelRequestMutation.isPending}
          >
            {cancelRequestMutation.isPending ? "Cancelling..." : "Cancel Request"}
          </button>
        );
      } 
      // They sent the request
      else if (isPendingFromUs === false) {
        return (
          <button 
            className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => acceptConnectionMutation.mutate()}
            disabled={acceptConnectionMutation.isPending}
          >
            {acceptConnectionMutation.isPending ? "Accepting..." : "Accept Request"}
          </button>
        );
      }
    }

    // No connection yet, show connect button
    return (
      <button 
        className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        onClick={() => connectMutation.mutate()}
        disabled={connectMutation.isPending}
      >
        {connectMutation.isPending ? "Connecting..." : "Connect"}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden relative">
      {/* Cover image */}
      <div className="h-32 bg-blue-900">
        {coverUrl && (
          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
        )}
        {isCurrentUser && (
          <button className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </button>
        )}
      </div>

      {/* Avatar positioned absolutely to overlap the cover */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
        <Avatar className="w-24 h-24 border-4 border-white">
          {avatarUrl ? (
            <AvatarImage 
              src={avatarUrl} 
              alt={fullName || username} 
              className="object-cover"
              onError={() => {
                console.error("Error loading avatar image");
              }}
            />
          ) : null}
          <AvatarFallback className="text-xl font-semibold">
            {getInitials(fullName || username)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Add spacing to account for the avatar */}
      <div className="h-12"></div>
      
      {/* Profile content */}
      <div className="px-4 pb-4 flex flex-col items-center pt-14">        
        <div className="flex items-center mb-1">
          <h2 className="text-xl font-semibold">{fullName || username}</h2>
          {verified && (
            <span className="ml-2 bg-green-100 text-green-600 p-1 rounded-full">
              <Check size={14} />
            </span>
          )}
        </div>
        
        <div className="text-sm text-neutral-600 mb-1">
          {position && <span>{position}</span>}
          {position && club && <span> · </span>}
          {club && <span>{club}</span>}
        </div>
        
        <div className="text-sm text-neutral-500 mb-4">
          {location}
        </div>
        
        {/* Bio section */}
        {bio && (
          <div className="text-sm text-neutral-600 text-center mb-4 max-w-xs">
            {bio}
          </div>
        )}
        
        {/* Player positions/specialties */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {position && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md">
              {position}
            </span>
          )}
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md">
            Center Midfield
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md">
            Free Kick Specialist
          </span>
        </div>
        
        {/* Profile completion - only show on own profile */}
        {isCurrentUser && (
          <div className="w-full mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Profile completion</span>
              <span className="text-right">85%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-800 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        )}
        
        {/* Stats */}
        <div className="flex w-full justify-between mt-2 text-center border-t border-gray-100 pt-4">
          <div className="flex-1">
            <div className="text-lg font-semibold">821</div>
            <div className="text-xs text-neutral-500">Connections</div>
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold">32</div>
            <div className="text-xs text-neutral-500">Profile views</div>
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold">8</div>
            <div className="text-xs text-neutral-500">Opportunities</div>
          </div>
        </div>
        
        {/* Pro badge for premium users */}
        {isPro && (
          <div className="mt-4 w-full">
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-md flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"></path>
              </svg>
              Pro Member
            </span>
          </div>
        )}
        
        {/* Conditional Action Button */}
        {renderConnectionButton()}
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        user={user}
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
      />
    </div>
  );
};

export default ProfileCard;
