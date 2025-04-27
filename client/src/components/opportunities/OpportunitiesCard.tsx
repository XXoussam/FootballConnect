import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Opportunity } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/queryClient";

interface OpportunitiesCardProps {
  limit?: number;
}

const OpportunityItem = ({ opportunity }: { opportunity: Opportunity }) => {
  const getIconClass = () => {
    switch (opportunity.category) {
      case "football":
        return "fas fa-futbol text-primary";
      case "training":
        return "fas fa-running text-secondary";
      case "defense":
        return "fas fa-shield-alt text-amber-500";
      default:
        return "fas fa-futbol text-primary";
    }
  };

  const getIconBgClass = () => {
    switch (opportunity.category) {
      case "football":
        return "bg-primary/10";
      case "training":
        return "bg-secondary/10";
      case "defense":
        return "bg-amber-500/10";
      default:
        return "bg-primary/10";
    }
  };
  
  const formatTimeAgo = (dateInput: Date | string | null) => {
    if (!dateInput) return "Unknown";
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (!(date instanceof Date) || isNaN(date.getTime())) return "Unknown";
    
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1d ago";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return `${Math.floor(diffInDays / 30)}mo ago`;
  };

  return (
    <div className="p-4 hover:bg-neutral-50 transition-colors rounded-lg">
      <div className="flex gap-3">
        <div className={`w-10 h-10 ${getIconBgClass()} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <i className={getIconClass()}></i>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{opportunity.title}</h4>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{opportunity.club} • {opportunity.location}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {opportunity.salary && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800">{opportunity.salary}</Badge>
            )}
            {opportunity.type && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800">{opportunity.type}</Badge>
            )}
            <span className="text-xs text-neutral-400 ml-auto">Posted {formatTimeAgo(opportunity.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const OpportunitiesCard = ({ limit = 3 }: OpportunitiesCardProps) => {
  const { data: opportunities, isLoading, error } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
    queryFn: async () => {
      try {
        // Attempt to fetch from Supabase
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching opportunities:", error);
          throw error;
        }
        
        return data || [];
      } catch (err) {
        console.error("Failed to fetch opportunities:", err);
        // Return sample data as fallback
        return sampleOpportunities;
      }
    }
  });

  // Sample data for UI display
  const sampleOpportunities: Opportunity[] = [
    {
      id: 1,
      title: "Midfielder Needed",
      club: "Liverpool FC",
      location: "Liverpool, UK",
      category: "football",
      position: null,
      description: null,
      salary: "$50k-$80k",
      type: null,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 2,
      title: "Scouting Event - Forwards",
      club: "Juventus FC",
      location: "Turin, Italy",
      category: "training",
      position: "Forward",
      description: null,
      salary: null,
      type: "Tryout",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 3,
      title: "Center-Back Position Open",
      club: "Bayern Munich",
      location: "Munich, Germany",
      category: "defense",
      position: "Center-Back",
      description: null,
      salary: "$70k-$90k",
      type: null,
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    }
  ];

  const displayOpportunities = opportunities || sampleOpportunities;
  const limitedOpportunities = displayOpportunities.slice(0, limit);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <div className="p-4 border-b border-neutral-100">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
        
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border-b border-neutral-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-grow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-500">Failed to load opportunities</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Opportunities</h3>
          <Link href="/opportunities">
            <a className="text-primary text-sm">See all</a>
          </Link>
        </div>
      </div>
      
      <div className="divide-y">
        {limitedOpportunities.map((opportunity) => (
          <OpportunityItem key={opportunity.id} opportunity={opportunity} />
        ))}
      </div>
      
      <CardContent className="p-4 bg-neutral-50 flex flex-col gap-2">
        <Link href="/opportunities">
          <Button 
            variant="outline"
            className="w-full py-2 text-primary border border-primary rounded-full text-sm font-medium hover:bg-primary/5"
          >
            Browse all opportunities
          </Button>
        </Link>
        
        <Link href="/events">
          <Button 
            variant="ghost"
            className="w-full py-2 text-neutral-700 rounded-full text-sm font-medium hover:bg-neutral-100"
          >
            <i className="fas fa-calendar-alt mr-2"></i>
            View all events
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default OpportunitiesCard;
