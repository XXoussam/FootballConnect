import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SuggestedConnections from "@/components/network/SuggestedConnections";
import { User } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, supabase } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

// Extended UserConnection type with created_at field
interface ExtendedUserConnection {
  id: number;
  user: {
    id: number;
    username: string;
    full_name: string;
    position?: string;
    club?: string;
    avatar_url?: string;
  };
  created_at: string;
}

// Network service class to organize data access methods
class NetworkService {
  // Fetch current user data
  static async getCurrentUser(): Promise<User | null> {
    try {
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        console.error("No authentication token available");
        return null;
      }
      
      // Make API request with proper auth header
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Error fetching user data:', response.statusText);
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  // Get all accepted connections for a user using server API
  static async getConnections(userId: string): Promise<ExtendedUserConnection[]> {
    try {
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error("No authentication token available");
      }
      
      const response = await fetch(`/api/connections?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error("Failed to fetch connections");
      return await response.json();
    } catch (error) {
      console.error("Error fetching connections:", error);
      return [];
    }
  }

  // Get pending connection requests for a user using server API
  static async getPendingConnections(userId: string): Promise<ExtendedUserConnection[]> {
    try {
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error("No authentication token available");
      }
      
      const response = await fetch(`/api/connections/pending?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error("Failed to fetch pending connections");
      return await response.json();
    } catch (error) {
      console.error("Error fetching pending connections:", error);
      return [];
    }
  }

  // Get suggested connections for a user using server API
  static async getSuggestedConnections(userId: string): Promise<ExtendedUserConnection[]> {
    try {
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error("No authentication token available");
      }
      
      const response = await fetch(`/api/connections/suggested/${userId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error("Failed to fetch suggested connections");
      return await response.json();
    } catch (error) {
      console.error("Error fetching suggested connections:", error);
      return [];
    }
  }

  // Update connection status (accept/decline) using server API
  static async updateConnectionStatus(connectionId: number, status: string): Promise<any> {
    try {
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error("No authentication token available");
      }
      
      const response = await fetch(`/api/connections/${connectionId}/${status}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error(`Failed to ${status} connection`);
      return await response.json();
    } catch (error) {
      console.error(`Error ${status}ing connection:`, error);
      throw error;
    }
  }
  
  // Connect with user using server API
  static async sendConnectionRequest(userId: number): Promise<any> {
    try {
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error("No authentication token available");
      }
      
      const response = await fetch(`/api/connections/connect`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) throw new Error("Failed to send connection request");
      return await response.json();
    } catch (error) {
      console.error("Error sending connection request:", error);
      throw error;
    }
  }
}

// Helper function to get initials from name
const getInitials = (name: string) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const Network = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const user = await NetworkService.getCurrentUser();
      setCurrentUser(user);
    };

    fetchUser();
  }, []);

  // Fetch established connections
  const { data: connections, isLoading: isLoadingConnections } = useQuery({
    queryKey: ["connections", currentUser?.id],
    queryFn: () => NetworkService.getConnections(currentUser?.id?.toString() || ""),
    enabled: !!currentUser?.id,
  });

  // Fetch pending connection requests
  const { data: pendingConnections, isLoading: isLoadingPending } = useQuery({
    queryKey: ["pendingConnections", currentUser?.id],
    queryFn: () => NetworkService.getPendingConnections(currentUser?.id?.toString() || ""),
    enabled: !!currentUser?.id,
  });

  const acceptConnectionMutation = useMutation({
    mutationFn: (connectionId: number) =>
      NetworkService.updateConnectionStatus(connectionId, "accepted"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["pendingConnections"] });
      toast({
        title: "Connection Accepted",
        description: "You are now connected",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to accept connection: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });

  const declineConnectionMutation = useMutation({
    mutationFn: (connectionId: number) =>
      NetworkService.updateConnectionStatus(connectionId, "declined"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingConnections"] });
      toast({
        title: "Connection Declined",
        description: "Connection request has been declined",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to decline connection: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });

  // Format a date relative to now (e.g., "3 days ago")
  const formatConnectionDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "recently";
    }
  };

  // Filter connections based on search query
  const filteredConnections =
    connections?.filter(
      (connection) =>
        !searchQuery ||
        connection.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        connection.user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        connection.user.club?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Network</h1>
        <p className="text-neutral-600">Manage your professional football connections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="p-4">
              <div className="relative">
                <Input
                  placeholder="Search your connections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10"
                />
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
          </div>

          <Tabs defaultValue="connections" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="connections">My Connections ({connections?.length || 0})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingConnections?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="connections">
              {isLoadingConnections ? (
                // Loading state
                <div className="bg-white rounded-xl shadow-sm p-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 mb-6 animate-pulse">
                      <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                      <div className="flex-grow">
                        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConnections.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <i className="fas fa-users text-4xl text-neutral-300 mb-3"></i>
                  <h3 className="text-lg font-medium mb-1">No connections found</h3>
                  <p className="text-neutral-500">
                    {searchQuery
                      ? "Try a different search term"
                      : "Start building your network by connecting with players, scouts, and clubs"}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm divide-y">
                  {filteredConnections.map((connection) => (
                    <div key={connection.id} className="p-4 flex items-center gap-4">
                      <Link href={`/profile/${connection.user.id}`}>
                        <Avatar className="w-16 h-16 cursor-pointer">
                          <AvatarImage src={connection.user.avatar_url} alt={connection.user.full_name} />
                          <AvatarFallback>{getInitials(connection.user.full_name || connection.user.username)}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-grow">
                        <Link href={`/profile/${connection.user.id}`}>
                          <h3 className="font-medium text-lg hover:text-primary cursor-pointer">
                            {connection.user.full_name || connection.user.username}
                          </h3>
                        </Link>
                        <p className="text-neutral-500">
                          {connection.user.position || "Player"} • {connection.user.club || "Unknown club"}
                        </p>
                        <div className="mt-1 text-sm text-neutral-500">
                          Connected {formatConnectionDate(connection.created_at)}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <i className="fas fa-comment mr-1"></i> Message
                        </Button>
                        <Button variant="ghost" size="sm">
                          <i className="fas fa-ellipsis-h"></i>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending">
              {isLoadingPending ? (
                // Loading state
                <div className="bg-white rounded-xl shadow-sm p-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4 mb-6 animate-pulse">
                      <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                      <div className="flex-grow">
                        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-20 h-8 bg-gray-200 rounded"></div>
                        <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !pendingConnections || pendingConnections.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <i className="fas fa-user-clock text-4xl text-neutral-300 mb-3"></i>
                  <h3 className="text-lg font-medium mb-1">No pending requests</h3>
                  <p className="text-neutral-500">
                    You don't have any pending connection requests at the moment
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm divide-y">
                  {pendingConnections.map((connection) => (
                    <div key={connection.id} className="p-4 flex items-center gap-4">
                      <Link href={`/profile/${connection.user.id}`}>
                        <Avatar className="w-16 h-16 cursor-pointer">
                          <AvatarImage src={connection.user.avatar_url} alt={connection.user.full_name} />
                          <AvatarFallback>{getInitials(connection.user.full_name || connection.user.username)}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-grow">
                        <Link href={`/profile/${connection.user.id}`}>
                          <h3 className="font-medium text-lg hover:text-primary cursor-pointer">
                            {connection.user.full_name || connection.user.username}
                          </h3>
                        </Link>
                        <p className="text-neutral-500">
                          {connection.user.position || "Player"} • {connection.user.club || "Unknown club"}
                        </p>
                        <div className="mt-1 text-sm text-neutral-500">
                          Sent connection request {formatConnectionDate(connection.created_at)}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          className="bg-primary"
                          size="sm"
                          onClick={() => acceptConnectionMutation.mutate(connection.id)}
                          disabled={acceptConnectionMutation.isPending}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => declineConnectionMutation.mutate(connection.id)}
                          disabled={declineConnectionMutation.isPending}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <SuggestedConnections limit={5} />

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4">Grow Your Network</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Connect with scouts, coaches, and players to expand your opportunities in football.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                <span>Get discovered by top football clubs</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                <span>Access exclusive opportunities and trials</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                <span>Receive endorsements from respected professionals</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Network;
