import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SuggestedConnections from "@/components/network/SuggestedConnections";
import { User, UserConnection } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const Network = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["/api/users/me"],
  });
  
  const { data: connections, isLoading: isLoadingConnections } = useQuery<UserConnection[]>({
    queryKey: ["/api/connections"],
  });
  
  const { data: pendingConnections, isLoading: isLoadingPending } = useQuery<UserConnection[]>({
    queryKey: ["/api/connections/pending"],
  });
  
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery<User[]>({
    queryKey: ["/api/users/search", searchQuery],
    enabled: searchQuery.length > 2,
  });

  const connectMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest("POST", `/api/connections/connect`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/suggested"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent successfully",
      });
    },
  });

  const acceptConnectionMutation = useMutation({
    mutationFn: (connectionId: number) => 
      apiRequest("POST", `/api/connections/${connectionId}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      toast({
        title: "Connection Accepted",
        description: "You are now connected",
      });
    },
  });

  const declineConnectionMutation = useMutation({
    mutationFn: (connectionId: number) => 
      apiRequest("POST", `/api/connections/${connectionId}/decline`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/pending"] });
      toast({
        title: "Connection Declined",
        description: "Connection request has been declined",
      });
    },
  });

  // Sample data for UI display
  const sampleConnections: UserConnection[] = [
    {
      id: 1,
      user: {
        id: 101,
        username: "waynerooney",
        fullName: "Wayne Rooney",
        position: "Forward",
        club: "Manchester United FC",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
      }
    },
    {
      id: 2,
      user: {
        id: 102,
        username: "gneville",
        fullName: "Gary Neville",
        position: "Defender",
        club: "Manchester United FC",
        avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
      }
    },
    {
      id: 3,
      user: {
        id: 103,
        username: "rioferdinand",
        fullName: "Rio Ferdinand",
        position: "Defender",
        club: "Manchester United FC",
        avatarUrl: "https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
      }
    }
  ];
  
  const samplePendingConnections: UserConnection[] = [
    {
      id: 4,
      user: {
        id: 104,
        username: "lmessi",
        fullName: "Lionel Messi",
        position: "Forward",
        club: "Inter Miami CF",
        avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
      }
    }
  ];

  const displayConnections = connections || sampleConnections;
  const displayPendingConnections = pendingConnections || samplePendingConnections;

  // Filter connections based on search query
  const filteredConnections = displayConnections.filter(connection => 
    !searchQuery || 
    connection.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.user.club?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <Input
                placeholder="Search your connections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                icon={<i className="fas fa-search"></i>}
              />
            </div>
          </div>

          <Tabs defaultValue="connections" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="connections">My Connections ({displayConnections.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({displayPendingConnections.length})</TabsTrigger>
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
                    {searchQuery ? "Try a different search term" : "Start building your network by connecting with players, scouts, and clubs"}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm divide-y">
                  {filteredConnections.map((connection) => (
                    <div key={connection.id} className="p-4 flex items-center gap-4">
                      <Link href={`/profile/${connection.user.id}`}>
                        <Avatar className="w-16 h-16 cursor-pointer">
                          <AvatarImage src={connection.user.avatarUrl} alt={connection.user.fullName} />
                          <AvatarFallback>{connection.user.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-grow">
                        <Link href={`/profile/${connection.user.id}`}>
                          <h3 className="font-medium text-lg hover:text-primary cursor-pointer">{connection.user.fullName}</h3>
                        </Link>
                        <p className="text-neutral-500">{connection.user.position} • {connection.user.club}</p>
                        <div className="mt-1 text-sm text-neutral-500">Connected since May 2023</div>
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
              ) : displayPendingConnections.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <i className="fas fa-user-clock text-4xl text-neutral-300 mb-3"></i>
                  <h3 className="text-lg font-medium mb-1">No pending requests</h3>
                  <p className="text-neutral-500">
                    You don't have any pending connection requests at the moment
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm divide-y">
                  {displayPendingConnections.map((connection) => (
                    <div key={connection.id} className="p-4 flex items-center gap-4">
                      <Link href={`/profile/${connection.user.id}`}>
                        <Avatar className="w-16 h-16 cursor-pointer">
                          <AvatarImage src={connection.user.avatarUrl} alt={connection.user.fullName} />
                          <AvatarFallback>{connection.user.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-grow">
                        <Link href={`/profile/${connection.user.id}`}>
                          <h3 className="font-medium text-lg hover:text-primary cursor-pointer">{connection.user.fullName}</h3>
                        </Link>
                        <p className="text-neutral-500">{connection.user.position} • {connection.user.club}</p>
                        <div className="mt-1 text-sm text-neutral-500">Sent connection request 2 days ago</div>
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
