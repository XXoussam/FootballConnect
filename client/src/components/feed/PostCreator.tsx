import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PostCreatorProps {
  user?: User;
}

const PostCreator = ({ user }: PostCreatorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [postContent, setPostContent] = useState("");
  const { toast } = useToast();

  const createPostMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest("POST", "/api/posts", { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setPostContent("");
      setIsExpanded(false);
      toast({
        title: "Post created",
        description: "Your post has been published successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create post: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleSubmitPost = () => {
    if (postContent.trim()) {
      createPostMutation.mutate(postContent);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          <Avatar className="w-full h-full">
            <AvatarImage src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" />
            <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-grow">
          {isExpanded ? (
            <>
              <textarea
                className="w-full bg-neutral-100 rounded-lg px-4 py-2.5 text-neutral-700 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white resize-none min-h-[100px]"
                placeholder="Share your latest match highlights..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
              />
              <div className="flex justify-between mt-3">
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-neutral-100"
                  >
                    <i className="fas fa-image text-green-600"></i>
                    <span className="text-sm font-medium text-neutral-700">Photo</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-neutral-100"
                  >
                    <i className="fas fa-video text-blue-600"></i>
                    <span className="text-sm font-medium text-neutral-700">Video</span>
                  </Button>
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
                onClick={() => setIsExpanded(true)}
              >
                Share your latest match highlights...
              </button>
              
              <div className="flex justify-between mt-3">
                <button className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-neutral-100">
                  <i className="fas fa-image text-green-600"></i>
                  <span className="text-sm font-medium text-neutral-700">Photo</span>
                </button>
                <button className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-neutral-100">
                  <i className="fas fa-video text-blue-600"></i>
                  <span className="text-sm font-medium text-neutral-700">Video</span>
                </button>
                <button className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-neutral-100">
                  <i className="fas fa-chart-bar text-purple-600"></i>
                  <span className="text-sm font-medium text-neutral-700">Stats</span>
                </button>
                <button className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-neutral-100">
                  <i className="fas fa-trophy text-amber-600"></i>
                  <span className="text-sm font-medium text-neutral-700">Achievement</span>
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
