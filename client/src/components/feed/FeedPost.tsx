import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Post } from "@shared/schema";

interface FeedPostProps {
  post: Post;
}

const FeedPost = ({ post }: FeedPostProps) => {
  const [comment, setComment] = useState("");
  
  const formatPostDate = (date: string | Date | null) => {
    try {
      if (date) {
        return formatDistanceToNow(new Date(date), { addSuffix: false });
      }
      return "recently";
    } catch (error) {
      return "recently";
    }
  };

  const likeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/posts/${post.id}/like`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest("POST", `/api/posts/${post.id}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setComment("");
    },
  });

  const handleAddComment = () => {
    if (comment.trim()) {
      commentMutation.mutate(comment);
    }
  };

  // These would come from the post object in a real app
  const hasLiked = post.hasLiked;

  let postContent;
  
  if (post.type === "video") {
    postContent = (
      <div className="mt-2 relative">
        <div className="aspect-video bg-neutral-200">
          <div className="w-full h-full flex items-center justify-center relative">
            <img 
              src={post.mediaUrl || "https://images.unsplash.com/photo-1517466787929-bc90951d0974?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"} 
              alt="Football match highlight" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <button className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                <i className="fas fa-play text-white text-2xl"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-3 left-3 flex items-center">
          <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm flex items-center gap-1">
            <i className="fas fa-eye text-xs"></i>
            <span>{post.views || 0}</span>
          </div>
        </div>
      </div>
    );
  } else if (post.type === "achievement") {
    postContent = (
      <div className="px-4 py-3 bg-neutral-50 border-y border-neutral-100">
        <div className="flex items-center">
          <div className="w-12 h-12 flex items-center justify-center bg-amber-500/10 rounded-full flex-shrink-0">
            <i className="fas fa-trophy text-2xl text-amber-500"></i>
          </div>
          <div className="ml-3">
            <h4 className="font-semibold">{post.achievementTitle}</h4>
            <p className="text-sm text-neutral-500">{post.achievementSubtitle}</p>
          </div>
        </div>
      </div>
    );
  } else if (post.type === "stats") {
    postContent = (
      <div className="px-4 py-6 bg-neutral-50 border-y border-neutral-100">
        <h4 className="font-semibold mb-4 text-center">Performance Stats (Last 5 Matches)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <div className="text-center">
              <span className="block text-3xl font-bold text-primary">4</span>
              <span className="text-sm text-neutral-500">Goals</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <div className="text-center">
              <span className="block text-3xl font-bold text-primary">6</span>
              <span className="text-sm text-neutral-500">Assists</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <div className="text-center">
              <span className="block text-3xl font-bold text-primary">87%</span>
              <span className="text-sm text-neutral-500">Pass Completion</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <div className="text-center">
              <span className="block text-3xl font-bold text-primary">8.4</span>
              <span className="text-sm text-neutral-500">Avg. Rating</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 pb-2">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${post.author.id}`}>
            <a className="flex-shrink-0">
              <Avatar className="w-12 h-12">
                <AvatarImage src={post.author.avatarUrl || ""} alt={post.author.username} />
                <AvatarFallback>{post.author.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </a>
          </Link>
          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <div>
                <Link href={`/profile/${post.author.id}`}>
                  <a className="font-semibold hover:underline">{post.author.fullName || post.author.username}</a>
                </Link>
                <span className="text-neutral-500">• {formatPostDate(post.createdAt)}</span>
              </div>
              <button className="text-neutral-500 hover:text-neutral-700">
                <i className="fas fa-ellipsis-h"></i>
              </button>
            </div>
            <p className="text-neutral-500 text-sm">{post.author.position} at {post.author.club}</p>
            <p className="mt-2">{post.content}</p>
          </div>
        </div>
      </div>
      
      {postContent}
      
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button 
              className="p-1.5 hover:bg-neutral-100 rounded-full"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              <i className={`fas fa-thumbs-up ${hasLiked ? 'text-primary' : 'text-neutral-500'}`}></i>
            </button>
            <button className="p-1.5 hover:bg-neutral-100 rounded-full">
              <i className="fas fa-comment text-neutral-500"></i>
            </button>
            <button className="p-1.5 hover:bg-neutral-100 rounded-full">
              <i className="fas fa-share text-neutral-500"></i>
            </button>
          </div>
          <div className="text-sm text-neutral-500">
            <span>{post.likes} likes • {post.comments.length} comments</span>
          </div>
        </div>
        
        <div className="mt-3 border-t pt-3">
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <Avatar className="w-full h-full">
                <AvatarImage src={post.author.avatarUrl || ""} alt={post.author.username} />
                <AvatarFallback>{post.author.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-grow">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Add a comment..." 
                  className="w-full border border-neutral-200 rounded-full px-4 py-2 pr-10 text-sm focus:outline-none focus:border-primary"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddComment();
                    }
                  }}
                />
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary"
                  onClick={handleAddComment}
                  disabled={!comment.trim() || commentMutation.isPending}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedPost;
