import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const OpportunityAlerts = () => {
  const [trials, setTrials] = useState(true);
  const [jobs, setJobs] = useState(false);
  const [positions, setPositions] = useState(true);
  const [training, setTraining] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-bold text-lg mb-4">Opportunity Alerts</h3>
      <p className="text-sm text-neutral-600 mb-4">
        Get notified when new opportunities match your profile and preferences.
      </p>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Trials & Tryouts</span>
          <Switch checked={trials} onCheckedChange={setTrials} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Coaching Jobs</span>
          <Switch checked={jobs} onCheckedChange={setJobs} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Player Positions</span>
          <Switch checked={positions} onCheckedChange={setPositions} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Training Camps</span>
          <Switch checked={training} onCheckedChange={setTraining} />
        </div>
      </div>
    </div>
  );
};

export default OpportunityAlerts;
