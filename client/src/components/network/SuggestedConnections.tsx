import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { UserConnection, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter"; // Import Link from wouter

interface SuggestedConnectionsProps {
  limit?: number;
}

const SuggestedConnections = ({ limit = 3 }: SuggestedConnectionsProps) => {
  const { toast } = useToast();
  
  // Get the current user with proper typing
  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["currentUser"],
  });
  
  // Fetch suggested connections using the server API
  const { data: suggestedConnections = [], isLoading } = useQuery<UserConnection[]>({
    queryKey: ["suggestedConnections", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      try {
        const response = await fetch(`/api/connections/suggested/${currentUser.id}`);
        if (!response.ok) throw new Error("Failed to fetch suggested connections");
        return await response.json();
      } catch (error) {
        console.error("Error fetching suggested connections:", error);
        return [];
      }
    },
    enabled: !!currentUser?.id,
  });

  const connectMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch('/api/connections/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send connection request");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestedConnections"] });
      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send connection request: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  });
    
  // Now suggestedConnections is guaranteed to be an array
  const limitedConnections = suggestedConnections.slice(0, limit);

  const handleConnect = (userId: number) => {
    connectMutation.mutate(userId);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
        <div className="p-4 border-b border-neutral-100">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
        
        {Array(limit).fill(0).map((_, i) => (
          <div key={i} className="p-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200"></div>
              <div className="flex-grow">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-20 mt-2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Display empty state if no suggestions
  if (!suggestedConnections || suggestedConnections.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <h3 className="font-bold text-lg">Suggested Connections</h3>
        </div>
        <div className="p-6 text-center">
          <i className="fas fa-users text-3xl text-neutral-300 mb-3"></i>
          <h4 className="font-medium mb-1">Looking for connections</h4>
          <p className="text-sm text-neutral-500">
            We're finding people you might want to connect with
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-neutral-100">
        <h3 className="font-bold text-lg">Suggested Connections</h3>
      </div>
      
      <div className="divide-y">
        {limitedConnections.map((connection) => (
          <div key={connection.id} className="p-4">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${connection.user.id}`}>
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 cursor-pointer">
                  <Avatar className="w-full h-full">
                    <AvatarFallback>{(connection.user.full_name || '').substring(0, 2).toUpperCase()}</AvatarFallback>
                    {connection.user.avatar_url && <AvatarImage src={connection.user.avatar_url} alt={connection.user.full_name} />}
                  </Avatar>
                </div>
              </Link>
              <div className="flex-grow min-w-0">
                <Link href={`/profile/${connection.user.id}`}>
                  <h4 className="font-medium text-sm truncate cursor-pointer hover:text-primary">{connection.user.full_name}</h4>
                </Link>
                <p className="text-neutral-500 text-xs truncate">
                  {connection.user.position} • {connection.user.club}
                </p>
                <div className="mt-1.5">
                  <Button
                    className="px-3 py-1 bg-primary text-white text-xs rounded-full hover:bg-primary-dark"
                    onClick={() => handleConnect(connection.user.id)}
                    disabled={connectMutation.isPending}
                    size="sm"
                  >
                    Connect
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {limitedConnections.length > 0 && limit < 5 && (
          <div className="p-4 text-center">
            <Link href="/network">
              <Button 
                variant="link" 
                className="text-primary text-sm"
              >
                View more suggestions
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestedConnections;
