import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import PostCreator from "@/components/feed/PostCreator";
import FeedPost from "@/components/feed/FeedPost";
import FeedFilters from "@/components/feed/FeedFilters";
import SuggestedConnections from "@/components/network/SuggestedConnections";
import UpcomingEvents from "@/components/opportunities/UpcomingEvents";
import { User, Post } from "@shared/schema";
import { getCurrentUser, supabase } from "@/lib/queryClient";

const Home = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  
  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  // Use the getCurrentUser function with the correct query key
  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });
  
  // Fetch user's connections first
  const { data: connections, isLoading: isLoadingConnections } = useQuery({
    queryKey: ["userConnections", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      try {
        // Get connections where user is the receiver and status is accepted
        const { data: receivedConnections, error: receivedError } = await supabase
          .from("connections")
          .select(`
            requester:requester_id(id)
          `)
          .eq("receiver_id", currentUser.id)
          .eq("status", "accepted");

        // Get connections where user is the requester and status is accepted
        const { data: requestedConnections, error: requestedError } = await supabase
          .from("connections")
          .select(`
            receiver:receiver_id(id)
          `)
          .eq("requester_id", currentUser.id)
          .eq("status", "accepted");

        if (receivedError || requestedError) {
          console.error("Error fetching connections:", receivedError || requestedError);
          return [];
        }

        // Extract connected user IDs
        const connectedUserIds = [
          ...(receivedConnections || []).map((conn: any) => conn.requester.id),
          ...(requestedConnections || []).map((conn: any) => conn.receiver.id),
        ];
        
        return connectedUserIds;
      } catch (error) {
        console.error("Failed to fetch connections:", error);
        return [];
      }
    },
    enabled: !!currentUser?.id,
  });
  
  // Updated to properly fetch posts from only connected users
  const { data: feedPosts, isLoading: isLoadingPosts } = useQuery<Post[]>({
    queryKey: ["/api/posts/feed", activeFilter, connections],
    queryFn: async () => {
      try {
        if (!currentUser) {
          return [];
        }
        
        // If user has no connections, return empty array
        if (connections && connections.length === 0) {
          return [];
        }
        
        // Start building the query - include current user's posts and posts from connections
        let query = supabase
          .from('posts')
          .select(`
            *,
            author:author_id(*)
          `)
          .or(`author_id.eq.${currentUser.id},author_id.in.(${connections?.join(',')})`)
          
        // Apply filtering based on the selected filter
        if (activeFilter !== "all") {
          // Map UI filter categories to database post types
          const filterTypeMap: { [key: string]: string } = {
            highlights: "video",
            matches: "stats",
            transfers: "transfer", 
            training: "training"
          };
          
          const postType = filterTypeMap[activeFilter];
          if (postType) {
            query = query.eq('type', postType);
          }
        }
        
        // Execute query with ordering
        const { data, error } = await query.order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching posts:", error);
          throw error;
        }
        
        // Format the posts to match your Post type
        return data.map(post => ({
          ...post,
          author: post.author || {},
          comments: [] // Initialize with empty comments array
        }));
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        throw error;
      }
    },
    enabled: !!currentUser && !!connections,
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Sidebar */}
        <div className="md:w-1/4 hidden lg:block">
          <UpcomingEvents />
        </div>
        
        {/* Main Feed */}
        <div className="md:w-full lg:w-2/4 space-y-6">
          {/* Feed Filters */}
          <FeedFilters onFilterChange={handleFilterChange} />
          
          {/* Post Creator */}
          {currentUser && <PostCreator user={currentUser} />}
          
          {/* Posts Feed */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Latest Activity</h2>
            
            {isLoadingPosts || isLoadingConnections ? (
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
            ) : feedPosts && feedPosts.length > 0 ? (
              feedPosts.map((post) => (
                <FeedPost key={post.id} post={post} />
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <i className="fas fa-users text-4xl text-neutral-300 mb-3"></i>
                <h3 className="text-lg font-medium mb-1">No posts found</h3>
                <p className="text-neutral-500">
                  {connections && connections.length === 0
                    ? "Add connections to see their posts in your feed."
                    : activeFilter === "all" 
                      ? "Your connections haven't posted anything yet."
                      : `No ${activeFilter} posts available from your connections.`}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Sidebar */}
        <div className="md:w-1/4 space-y-6">
          <SuggestedConnections />
        </div>
      </div>
    </div>
  );
};

export default Home;
