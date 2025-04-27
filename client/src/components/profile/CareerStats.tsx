import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface CareerStatsProps {
  userId: string;
}

const CareerStats = ({ userId }: CareerStatsProps) => {
  // In a real app, we would fetch this data from an API endpoint
  const { data: stats, isLoading } = useQuery({
    queryKey: ["careerStats", userId],
    queryFn: async () => {
      // This is a placeholder - replace with actual API call
      return {
        appearances: 264,
        goals: 85,
        assists: 112,
        passAccuracy: 87,
        freeKickSuccess: 72
      };
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Career Stats</h3>
      
      <div className="space-y-4">
        {/* Basic Stats */}
        <div className="flex justify-between items-center">
          <span className="text-neutral-600">Appearances</span>
          <span className="font-semibold">{stats?.appearances}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-neutral-600">Goals</span>
          <span className="font-semibold">{stats?.goals}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-neutral-600">Assists</span>
          <span className="font-semibold">{stats?.assists}</span>
        </div>
        
        {/* Pass Accuracy */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-600">Pass Accuracy</span>
            <span className="font-semibold">{stats?.passAccuracy}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-800 h-2 rounded-full" 
              style={{ width: `${stats?.passAccuracy}%` }}
            ></div>
          </div>
        </div>
        
        {/* Free Kick Success */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-600">Free Kick Success</span>
            <span className="font-semibold">{stats?.freeKickSuccess}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-amber-500 h-2 rounded-full" 
              style={{ width: `${stats?.freeKickSuccess}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <Link href={`/stats/${userId}`}>
        <a className="text-blue-600 text-sm flex items-center justify-center mt-5 hover:underline">
          View detailed stats
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </a>
      </Link>
    </div>
  );
};

export default CareerStats;
