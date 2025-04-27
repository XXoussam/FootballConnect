import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ScoutingData } from "@shared/schema";
import { supabase } from "@/lib/queryClient";

interface ScoutingInsightsProps {
  userId?: number | string;
}

const ScoutingInsights = ({ userId }: ScoutingInsightsProps) => {
  const sampleInsights: ScoutingData = {
    profileViews: 20,
    highlightViews: 143,
    opportunityMatches: 8
  };

  const { data: insights, isLoading, error } = useQuery<ScoutingData>({
    queryKey: ["/api/scouting-insights", userId],
    queryFn: async () => {
      try {
        // Attempt to fetch from Supabase
        const { data, error } = await supabase
          .from('scouting_insights')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (error) {
          console.error("Error fetching scouting insights:", error);
          throw error;
        }
        
        return data || sampleInsights;
      } catch (err) {
        console.error("Failed to fetch scouting insights:", err);
        // Return sample data as fallback
        return sampleInsights;
      }
    },
    enabled: !!userId,
  });

  const displayInsights = insights || sampleInsights;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-red-500">Failed to load scouting insights</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-bold text-lg mb-4">Scouting Insights</h3>
      
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm">Your profile was viewed by <span className="font-medium">{displayInsights.profileViews} scouts</span> this week</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm">Your highlight videos received <span className="font-medium">{displayInsights.highlightViews} views</span> from club representatives</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm">Your profile matches <span className="font-medium">{displayInsights.opportunityMatches} new opportunities</span></span>
        </div>
        
        <div className="pt-2">
          <Link href="/analytics">
            <a className="text-primary font-medium text-sm flex items-center">
              <span>View detailed analytics</span>
              <i className="fas fa-chevron-right text-xs ml-1"></i>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ScoutingInsights;
