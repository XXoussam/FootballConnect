import { useQuery } from "@tanstack/react-query";
import ProfileCard from "@/components/profile/ProfileCard";
import CareerStats from "@/components/profile/CareerStats";
import Connections from "@/components/profile/Connections";
import PostCreator from "@/components/feed/PostCreator";
import FeedPost from "@/components/feed/FeedPost";
import OpportunitiesCard from "@/components/opportunities/OpportunitiesCard";
import ScoutingInsights from "@/components/common/ScoutingInsights";
import { User, Post } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const { data: currentUser, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: ["/api/users/me"],
  });
  
  const { data: userPosts, isLoading: isLoadingPosts } = useQuery<Post[]>({
    queryKey: ["/api/posts/user", currentUser?.id],
    enabled: !!currentUser,
  });

  if (isLoadingUser) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/4 animate-pulse">
            <div className="h-64 bg-gray-200 rounded-xl mb-6"></div>
            <div className="h-48 bg-gray-200 rounded-xl"></div>
          </div>
          <div className="lg:w-2/4 animate-pulse">
            <div className="h-24 bg-gray-200 rounded-xl mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
          <div className="lg:w-1/4 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-xl mb-6"></div>
            <div className="h-48 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Profile Not Available</h2>
        <p className="text-neutral-600 mb-6">You need to log in to view your profile.</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <aside className="lg:w-1/4 space-y-6">
          <ProfileCard user={currentUser} isCurrentUser={true} />
          <CareerStats userId={currentUser.id} />
          <Connections />
        </aside>
        
        {/* Main Content Area */}
        <div className="lg:w-2/4 space-y-6">
          <PostCreator user={currentUser} />
          
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="space-y-6">
              {isLoadingPosts ? (
                // Loading state
                Array(2).fill(0).map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                      <div className="flex-grow">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : userPosts && userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <FeedPost key={post.id} post={post} />
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <i className="fas fa-newspaper text-4xl text-neutral-300 mb-3"></i>
                  <h3 className="text-lg font-medium mb-1">No posts yet</h3>
                  <p className="text-neutral-500">
                    Share your achievements, match highlights, or career updates.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="achievements" className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <i className="fas fa-trophy text-4xl text-neutral-300 mb-3"></i>
                <h3 className="text-lg font-medium mb-1">Achievements</h3>
                <p className="text-neutral-500">
                  This is where your football achievements will be displayed.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="stats" className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <i className="fas fa-chart-line text-4xl text-neutral-300 mb-3"></i>
                <h3 className="text-lg font-medium mb-1">Statistics</h3>
                <p className="text-neutral-500">
                  Your detailed performance statistics will appear here.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="media" className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <i className="fas fa-photo-video text-4xl text-neutral-300 mb-3"></i>
                <h3 className="text-lg font-medium mb-1">Media Gallery</h3>
                <p className="text-neutral-500">
                  Upload photos and videos to showcase your skills.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Sidebar */}
        <aside className="lg:w-1/4 space-y-6">
          <OpportunitiesCard limit={2} />
          <ScoutingInsights userId={currentUser.id} />
        </aside>
      </div>
    </main>
  );
};

export default Profile;
