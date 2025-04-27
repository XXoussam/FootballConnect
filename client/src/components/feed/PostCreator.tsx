import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, supabase } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PostCreatorProps {
  user?: User | any; // Allow any to handle database response format
}

// Helper function to access properties that might be in different formats
const getProperty = (obj: any, camelCase: string, snakeCase: string) => {
  return obj[camelCase] !== undefined ? obj[camelCase] : obj[snakeCase];
};

// Get initials from name
const getInitials = (name: string) => {
  if (!name) return "";
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('');
};

const PostCreator = ({ user }: PostCreatorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState("text");
  const { toast } = useToast();

  // Extract properties safely with fallbacks to different formats
  const avatarUrl = user ? getProperty(user, 'avatarUrl', 'avatar_url') : null;
  const fullName = user ? getProperty(user, 'fullName', 'full_name') : null;
  const username = user?.username || "";

  const createPostMutation = useMutation({
    mutationFn: async ({ content, type }: { content: string, type: string }) => {
      try {
        // Initialize post data with basic info
        const postData: any = {
          author_id: user.id,
          content: content,
          type: type
        };

        // Add additional fields based on the post type
        if (type === "stats") {
          postData.stats_data = {
            goals: 1,
            assists: 2,
            passAccuracy: 85
          };
        } else if (type === "achievement") {
          postData.achievement_title = "New Achievement";
          postData.achievement_subtitle = "Accomplished a milestone";
        }
        
        const { data, error } = await supabase
          .from('posts')
          .insert(postData)
          .select();
          
        if (error) {
          throw error;
        }
        
        return data;
      } catch (error) {
        console.error("Error creating post:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate both feed and user posts queries
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/user", user.id] });
      
      setPostContent("");
      setPostType("text");
      setIsExpanded(false);
      toast({
        title: "Post created",
        description: "Your post has been published successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to create post: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleSubmitPost = () => {
    if (postContent.trim()) {
      createPostMutation.mutate({ content: postContent, type: postType });
    }
  };

  const handleTypeSelect = (type: string) => {
    setPostType(type);
    setIsExpanded(true);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          <Avatar className="w-full h-full">
            {avatarUrl ? (
              <AvatarImage 
                src={avatarUrl} 
                alt={fullName || username} 
                className="object-cover"
                onError={() => {
                  console.error("Error loading avatar image in PostCreator");
                }}
              />
            ) : null}
            <AvatarFallback>
              {getInitials(fullName || username)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-grow">
          {isExpanded ? (
            <>
              <div className="mb-2 text-sm">
                <span className="font-medium">Posting as: </span>
                <span className="text-primary">
                  {postType === "text" && "Text Update"}
                  {postType === "video" && "Highlight Video"}
                  {postType === "stats" && "Match Update"}
                  {postType === "transfer" && "Transfer News"}
                  {postType === "training" && "Training Update"}
                  {postType === "achievement" && "Achievement"}
                </span>
              </div>
              <textarea
                className="w-full bg-neutral-100 rounded-lg px-4 py-2.5 text-neutral-700 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white resize-none min-h-[100px]"
                placeholder={
                  postType === "video" ? "Share your latest highlight video..." :
                  postType === "stats" ? "Share your match statistics..." :
                  postType === "transfer" ? "Share transfer news..." :
                  postType === "training" ? "Share your training update..." :
                  postType === "achievement" ? "Share your recent achievement..." :
                  "What's on your mind?"
                }
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
              <div className="flex justify-between mt-3">
                <div className="flex gap-2">
                  {/* Media buttons for this post type */}
                  {postType === "video" && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-neutral-100"
                    >
                      <i className="fas fa-video text-blue-600"></i>
                      <span className="text-sm font-medium text-neutral-700">Add Video</span>
                    </Button>
                  )}
                  {(postType === "text" || postType === "training") && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-neutral-100"
                    >
                      <i className="fas fa-image text-green-600"></i>
                      <span className="text-sm font-medium text-neutral-700">Add Photo</span>
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    size="sm"
                    disabled={!postContent.trim() || createPostMutation.isPending}
                    onClick={handleSubmitPost}
                  >
                    {createPostMutation.isPending ? "Posting..." : "Post"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <button 
                className="w-full text-left bg-neutral-100 rounded-full px-4 py-2.5 text-neutral-500 hover:bg-neutral-200 transition"
                onClick={() => {
                  setPostType("text");
                  setIsExpanded(true);
                }}
              >
                What's on your mind?
              </button>
              
              <div className="flex flex-wrap justify-between mt-3">
                <button 
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-neutral-100"
                  onClick={() => handleTypeSelect("video")}
                >
                  <i className="fas fa-video text-blue-600"></i>
                  <span className="text-sm font-medium text-neutral-700">Highlights</span>
                </button>
                <button 
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-neutral-100"
                  onClick={() => handleTypeSelect("stats")}
                >
                  <i className="fas fa-chart-bar text-purple-600"></i>
                  <span className="text-sm font-medium text-neutral-700">Match Updates</span>
                </button>
                <button 
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-neutral-100"
                  onClick={() => handleTypeSelect("transfer")}
                >
                  <i className="fas fa-exchange-alt text-orange-600"></i>
                  <span className="text-sm font-medium text-neutral-700">Transfer News</span>
                </button>
                <button 
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-neutral-100"
                  onClick={() => handleTypeSelect("training")}
                >
                  <i className="fas fa-running text-green-600"></i>
                  <span className="text-sm font-medium text-neutral-700">Training</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCreator;
