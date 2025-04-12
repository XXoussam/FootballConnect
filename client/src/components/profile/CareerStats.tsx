import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

interface StatItemProps {
  label: string;
  value: number | string;
  showProgress?: boolean;
  progressValue?: number;
  progressColor?: string;
}

const StatItem = ({ label, value, showProgress = false, progressValue = 0, progressColor = "bg-secondary" }: StatItemProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
    {showProgress && (
      <div className="w-full bg-neutral-200 rounded-full h-1.5">
        <div className={`${progressColor} h-1.5 rounded-full`} style={{ width: `${progressValue}%` }}></div>
      </div>
    )}
  </div>
);

interface CareerStatsProps {
  userId?: number;
}

const CareerStats = ({ userId }: CareerStatsProps) => {
  // In a real app, these would be fetched from the API based on the userId
  const stats = {
    appearances: 264,
    goals: 85,
    assists: 112,
    passAccuracy: 87,
    freeKickSuccess: 72
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-bold text-lg mb-4">Career Stats</h3>
      
      <div className="space-y-4">
        <StatItem label="Appearances" value={stats.appearances} />
        <StatItem label="Goals" value={stats.goals} />
        <StatItem label="Assists" value={stats.assists} />
        
        <StatItem 
          label="Pass Accuracy" 
          value={`${stats.passAccuracy}%`} 
          showProgress={true} 
          progressValue={stats.passAccuracy} 
          progressColor="bg-secondary"
        />
        
        <StatItem 
          label="Free Kick Success" 
          value={`${stats.freeKickSuccess}%`} 
          showProgress={true} 
          progressValue={stats.freeKickSuccess} 
          progressColor="bg-amber-500"
        />
        
        <div className="pt-4 mt-2">
          <Link href={`/stats/${userId}`}>
            <a className="text-primary font-medium text-sm flex justify-center items-center">
              <span>View detailed stats</span>
              <i className="fas fa-chevron-right text-xs ml-1"></i>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CareerStats;
