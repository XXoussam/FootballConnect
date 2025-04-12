import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface Connection {
  id: number;
  name: string;
  position: string;
  club: string;
  avatar: string;
}

interface ConnectionsProps {
  connections?: Connection[];
  isLoading?: boolean;
}

const ConnectionCard = ({ connection }: { connection: Connection }) => (
  <div className="flex items-center gap-3 mb-3">
    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
      <Avatar className="w-full h-full">
        <AvatarImage src={connection.avatar} alt={connection.name} />
        <AvatarFallback>{connection.name.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
    </div>
    <div className="flex-grow min-w-0">
      <h4 className="font-medium text-sm truncate">{connection.name}</h4>
      <p className="text-neutral-500 text-xs truncate">
        {connection.position} • {connection.club}
      </p>
    </div>
    <button className="text-neutral-500 hover:text-neutral-700">
      <i className="fas fa-ellipsis-h"></i>
    </button>
  </div>
);

const Connections = ({ connections = [], isLoading = false }: ConnectionsProps) => {
  // Sample connections data (in a real app this would come from API)
  const sampleConnections: Connection[] = [
    {
      id: 1,
      name: "Wayne Rooney",
      position: "Forward",
      club: "Manchester United FC",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
    },
    {
      id: 2,
      name: "Gary Neville",
      position: "Defender",
      club: "Manchester United FC",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
    },
    {
      id: 3,
      name: "Rio Ferdinand",
      position: "Defender",
      club: "Manchester United FC",
      avatar: "https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
    }
  ];

  const displayConnections = connections.length > 0 ? connections : sampleConnections;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gray-200"></div>
            <div className="flex-grow">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Connections</h3>
        <Link href="/network">
          <a className="text-primary text-sm">See all</a>
        </Link>
      </div>

      {displayConnections.map((connection) => (
        <ConnectionCard key={connection.id} connection={connection} />
      ))}

      <div className="mt-2">
        <Button 
          variant="outline"
          className="w-full py-2 text-primary border border-primary rounded-full text-sm font-medium hover:bg-primary/5"
        >
          Find more connections
        </Button>
      </div>
    </div>
  );
};

export default Connections;
