import { useQuery } from "@tanstack/react-query";
import ProfileCard from "@/components/profile/ProfileCard";
import CareerStats from "@/components/profile/CareerStats";
import Connections from "@/components/profile/Connections";
import PostCreator from "@/components/feed/PostCreator";
import FeedFilters from "@/components/feed/FeedFilters";
import FeedPost from "@/components/feed/FeedPost";
import OpportunitiesCard from "@/components/opportunities/OpportunitiesCard";
import UpcomingEvents from "@/components/opportunities/UpcomingEvents";
import ScoutingInsights from "@/components/common/ScoutingInsights";
import SuggestedConnections from "@/components/network/SuggestedConnections";
import { User, Post } from "@shared/schema";
import { useState } from "react";

const Home = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  
  const { data: currentUser, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: ["/api/users/me"],
  });
  
  const { data: posts, isLoading: isLoadingPosts } = useQuery<Post[]>({
    queryKey: ["/api/posts", activeFilter],
  });

  const isAuthenticated = !!currentUser;

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <aside className="lg:w-1/4 space-y-6">
          <ProfileCard user={currentUser} isCurrentUser={true} />
          {isAuthenticated && <CareerStats userId={currentUser.id} />}
          {isAuthenticated && <Connections />}
        </aside>
        
        {/* Main Content Area */}
        <div className="lg:w-2/4 space-y-6">
          {isAuthenticated && <PostCreator user={currentUser} />}
          <FeedFilters onFilterChange={setActiveFilter} />
          
          {isLoadingPosts ? (
            // Loading state
            Array(3).fill(0).map((_, index) => (
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
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <FeedPost key={post.id} post={post} />
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <i className="fas fa-newspaper text-4xl text-neutral-300 mb-3"></i>
              <h3 className="text-lg font-medium mb-1">No posts to display</h3>
              <p className="text-neutral-500">
                {isAuthenticated 
                  ? "Create a post or connect with more players to see updates here"
                  : "Log in to view and interact with posts from football professionals"}
              </p>
            </div>
          )}
        </div>
        
        {/* Right Sidebar */}
        <aside className="lg:w-1/4 space-y-6">
          <OpportunitiesCard />
          <UpcomingEvents />
          {isAuthenticated && <ScoutingInsights userId={currentUser.id} />}
          <SuggestedConnections />
        </aside>
      </div>
    </main>
  );
};

export default Home;
