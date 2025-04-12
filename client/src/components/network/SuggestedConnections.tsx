import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UserConnection } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface SuggestedConnectionsProps {
  limit?: number;
}

const SuggestedConnections = ({ limit = 2 }: SuggestedConnectionsProps) => {
  const { toast } = useToast();
  
  const { data: suggestedConnections, isLoading } = useQuery<UserConnection[]>({
    queryKey: ["/api/connections/suggested"],
  });

  const connectMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest("POST", `/api/connections/connect`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/suggested"] });
      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send connection request: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Sample data for UI display
  const sampleConnections: UserConnection[] = [
    {
      id: 1,
      user: {
        id: 101,
        username: "pepguardiola",
        fullName: "Pep Guardiola",
        position: "Manager",
        club: "Manchester City FC",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
      }
    },
    {
      id: 2,
      user: {
        id: 102,
        username: "jklopp",
        fullName: "Jürgen Klopp",
        position: "Manager",
        club: "Liverpool FC",
        avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
      }
    }
  ];

  const displayConnections = suggestedConnections || sampleConnections;
  const limitedConnections = displayConnections.slice(0, limit);

  const handleConnect = (userId: number) => {
    connectMutation.mutate(userId);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
        <div className="p-4 border-b border-neutral-100">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
        
        {[1, 2].map((i) => (
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

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-neutral-100">
        <h3 className="font-bold text-lg">Suggested Connections</h3>
      </div>
      
      <div className="divide-y">
        {limitedConnections.map((connection) => (
          <div key={connection.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                <Avatar className="w-full h-full">
                  <AvatarImage src={connection.user.avatarUrl || ""} alt={connection.user.fullName} />
                  <AvatarFallback>{connection.user.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-medium text-sm truncate">{connection.user.fullName}</h4>
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
      </div>
    </div>
  );
};

export default SuggestedConnections;
