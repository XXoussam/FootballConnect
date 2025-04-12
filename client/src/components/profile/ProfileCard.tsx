import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { User } from "@shared/schema";

interface ProfileCardProps {
  user?: User;
  isCurrentUser?: boolean;
}

const ProfileCard = ({ user, isCurrentUser = false }: ProfileCardProps) => {
  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-t-xl"></div>
        <div className="h-24 w-24 bg-gray-300 rounded-full mx-auto mt-4"></div>
        <div className="h-6 bg-gray-200 rounded mt-6 w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded mt-4 w-1/2 mx-auto"></div>
        <div className="mt-6 flex justify-between">
          <div className="w-1/3 h-12 bg-gray-200 rounded"></div>
          <div className="w-1/3 h-12 bg-gray-200 rounded"></div>
          <div className="w-1/3 h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Sample data - in a real app this would come from the user object
  const profileCompletionPercentage = 85;
  const positions = ["Right Wing", "Center Midfield", "Free Kick Specialist"];

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="h-32 bg-primary relative">
        {isCurrentUser && (
          <button className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full">
            <i className="fas fa-camera text-white"></i>
          </button>
        )}
      </div>
      <div className="px-6 pt-0 pb-6 relative">
        <div className="absolute -top-12 left-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-100">
              <Avatar className="w-full h-full">
                <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName || user.username} />}
              </Avatar>
            </div>
            {user.verified && (
              <div className="absolute bottom-0 right-0 bg-green-500 p-1 rounded-full border-2 border-white text-white">
                <i className="fas fa-check text-xs"></i>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-center">
            <h2 className="text-xl font-bold">{user.fullName || user.username}</h2>
            <div className="ml-2 flex space-x-1">
              {user.isPro && (
                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">Pro</span>
              )}
              {user.verified && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                  <i className="fas fa-shield-alt text-xs mr-1"></i>Verified
                </span>
              )}
            </div>
          </div>
          <p className="text-neutral-500 mt-1">
            {user.position} • {user.club}
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            {user.location}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {positions.map((position, index) => (
              <span key={index} className="bg-neutral-100 text-neutral-700 text-xs px-2 py-1 rounded-full">
                {position}
              </span>
            ))}
          </div>

          {isCurrentUser && (
            <div className="mt-4 flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Profile completion</span>
                <span className="text-xs font-medium">{profileCompletionPercentage}%</span>
              </div>
              <Progress value={profileCompletionPercentage} className="h-1.5" />
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <div>
                <p className="font-bold">821</p>
                <p className="text-neutral-500">Connections</p>
              </div>
              <div>
                <p className="font-bold">32</p>
                <p className="text-neutral-500">Profile views</p>
              </div>
              <div>
                <p className="font-bold">8</p>
                <p className="text-neutral-500">Opportunities</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
