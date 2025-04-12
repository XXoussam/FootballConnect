import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Opportunity } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1d ago";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    return `${Math.floor(diffInDays / 30)}mo ago`;
  };

  return (
    <div className="p-4 hover:bg-neutral-50">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 ${getIconBgClass()} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <i className={getIconClass()}></i>
        </div>
        <div>
          <h4 className="font-medium text-sm">{opportunity.title}</h4>
          <p className="text-xs text-neutral-500 mt-0.5">{opportunity.club} • {opportunity.location}</p>
          <div className="mt-1.5 flex items-center gap-3">
            {opportunity.salary && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{opportunity.salary}</span>
            )}
            {opportunity.type && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{opportunity.type}</span>
            )}
            <span className="text-xs text-neutral-500">Posted {formatTimeAgo(opportunity.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const OpportunitiesCard = ({ limit = 3 }: OpportunitiesCardProps) => {
  const { data: opportunities, isLoading, error } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
  });

  // Sample data for UI display
  const sampleOpportunities: Opportunity[] = [
    {
      id: 1,
      title: "Midfielder Needed",
      club: "Liverpool FC",
      location: "Liverpool, UK",
      category: "football",
      salary: "$50k-$80k",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      title: "Scouting Event - Forwards",
      club: "Juventus FC",
      location: "Turin, Italy",
      category: "training",
      type: "Tryout",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      title: "Center-Back Position Open",
      club: "Bayern Munich",
      location: "Munich, Germany",
      category: "defense",
      salary: "$70k-$90k",
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  const displayOpportunities = opportunities || sampleOpportunities;
  const limitedOpportunities = displayOpportunities.slice(0, limit);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-red-500">Failed to load opportunities</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
      
      <div className="p-4 bg-neutral-50">
        <Link href="/opportunities">
          <Button 
            variant="outline"
            className="w-full py-2 text-primary border border-primary rounded-full text-sm font-medium hover:bg-primary/5"
          >
            Browse all opportunities
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default OpportunitiesCard;
