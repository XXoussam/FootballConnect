import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import ProfileCard from "@/components/profile/ProfileCard";
import CareerStats from "@/components/profile/CareerStats";
import Connections from "@/components/profile/Connections";
import PostCreator from "@/components/feed/PostCreator";
import FeedPost from "@/components/feed/FeedPost";
import OpportunitiesCard from "@/components/opportunities/OpportunitiesCard";
import ScoutingInsights from "@/components/common/ScoutingInsights";
import { User, Post } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser, supabase } from "@/lib/queryClient";

const Profile = () => {
  // Get author_id from URL parameters
  const params = useParams<{ author_id: string }>();
  const profileUserId = params?.author_id;
  
  // Fetch current logged-in user
  const { data: currentUser, isLoading: isLoadingCurrentUser } = useQuery<User | null>({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });
  
  // Fetch profile user data (could be current user or someone else)
  const { data: profileUser, isLoading: isLoadingProfileUser } = useQuery<User | null>({
    queryKey: ["user", profileUserId],
    queryFn: async () => {
      try {
        // If no author_id provided or matches current user, return current user data
        if (!profileUserId && currentUser) {
          return currentUser;
        }
        
        // Otherwise fetch the requested user profile
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', profileUserId)
          .single();
          
        if (error) {
          console.error("Error fetching user:", error);
          throw error;
        }
        
        return data;
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        throw error;
      }
    },
    enabled: !!profileUserId || !!currentUser,
  });
  
  // Determine if we're viewing our own profile
  const isCurrentUserProfile: boolean = !profileUserId || !!(currentUser && profileUser && currentUser.id === profileUser.id);
  
  // Fetch posts for the profile we're viewing
  const { data: userPosts, isLoading: isLoadingPosts } = useQuery<Post[]>({
    queryKey: ["/api/posts/user", profileUser?.id],
    queryFn: async () => {
      if (!profileUser?.id) {
        return [];
      }

      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            author:author_id(*)
          `)
          .eq('author_id', profileUser.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching user posts:", error);
          throw error;
        }
        
        return data.map(post => ({
          ...post,
          author: post.author || {},
          comments: []
        }));
      } catch (error) {
        console.error("Failed to fetch user posts:", error);
        throw error;
      }
    },
    enabled: !!profileUser?.id,
  });

  // Check if we're still loading data
  const isLoading = isLoadingCurrentUser || isLoadingProfileUser;

  if (isLoading) {
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

  // Show error if profile doesn't exist
  if (!profileUser) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
        <p className="text-neutral-600 mb-6">The user profile you're looking for doesn't exist or you don't have permission to view it.</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <aside className="lg:w-1/4 space-y-6">
          <ProfileCard user={profileUser} isCurrentUser={isCurrentUserProfile} currentUser={currentUser} />
          <CareerStats userId={String(profileUser.id)} />
          <Connections userId={String(profileUser.id)} />
        </aside>
        
        {/* Main Content Area */}
        <div className="lg:w-2/4 space-y-6">
          {/* Only show PostCreator when viewing your own profile */}
          {isCurrentUserProfile && <PostCreator user={currentUser} />}
          
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
                    {isCurrentUserProfile 
                      ? "Share your achievements, match highlights, or career updates."
                      : `${profileUser.full_name || profileUser.username} hasn't posted anything yet.`}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="achievements" className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <i className="fas fa-trophy text-4xl text-neutral-300 mb-3"></i>
                <h3 className="text-lg font-medium mb-1">Achievements</h3>
                <p className="text-neutral-500">
                  {isCurrentUserProfile 
                    ? "This is where your football achievements will be displayed."
                    : `${profileUser.full_name || profileUser.username}'s achievements will be displayed here.`}
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="stats" className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <i className="fas fa-chart-line text-4xl text-neutral-300 mb-3"></i>
                <h3 className="text-lg font-medium mb-1">Statistics</h3>
                <p className="text-neutral-500">
                  {isCurrentUserProfile 
                    ? "Your detailed performance statistics will appear here."
                    : `${profileUser.full_name || profileUser.username}'s performance statistics will appear here.`}
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="media" className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <i className="fas fa-photo-video text-4xl text-neutral-300 mb-3"></i>
                <h3 className="text-lg font-medium mb-1">Media Gallery</h3>
                <p className="text-neutral-500">
                  {isCurrentUserProfile 
                    ? "Upload photos and videos to showcase your skills."
                    : `${profileUser.full_name || profileUser.username}'s photos and videos showcase.`}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Sidebar */}
        <aside className="lg:w-1/4 space-y-6">
          <OpportunitiesCard limit={2} />
          <ScoutingInsights userId={profileUser.id} />
        </aside>
      </div>
    </main>
  );
};

export default Profile;
