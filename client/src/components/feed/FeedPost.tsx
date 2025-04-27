import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient, supabase } from "@/lib/queryClient";
import { Post, User } from "@shared/schema";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "../ui/tooltip";

// Helper function to access properties that might be in different formats
const getProperty = (obj: any, camelCase: string, snakeCase: string) => {
  return obj && (obj[camelCase] !== undefined ? obj[camelCase] : obj[snakeCase]);
};

// Get initials from name
const getInitials = (name: string) => {
  if (!name) return "";
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('');
};

interface FeedPostProps {
  post: Post;
}

const FeedPost = ({ post }: FeedPostProps) => {
  const [comment, setComment] = useState("");
  const [postComments, setPostComments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(post.hasLiked || false);
  const [likesCount, setLikesCount] = useState<number>(post.likes || 0);
  const queryClient = useQueryClient();
  const [isCurrentUserPost, setIsCurrentUserPost] = useState<boolean>(false);

  // Check if this is a shared post
  const isSharedPost = post.type === 'shared';

  // Get shared post properties if applicable
  const sharedOriginalPostId = (post as any).shared_original_post_id;
  const sharedAuthorUsername = (post as any).shared_author_username;
  const sharedAuthorFullName = (post as any).shared_author_full_name;
  const sharedAuthorAvatar = (post as any).shared_author_avatar;
  const originalContent = (post as any).original_content;
  const originalType = (post as any).original_type;

  // Fetch the current logged-in user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', sessionData.session.user.id)
          .single();

        if (userData) {
          setCurrentUser(userData);
          
          // Check if this post belongs to the current user
          setIsCurrentUserPost(userData.id === post.author_id || userData.id === post.author_id);
          
          // Check if the current user has liked this post
          const { data: likeData } = await supabase
            .from('likes')
            .select('*')
            .eq('post_id', post.id)
            .eq('user_id', sessionData.session.user.id)
            .maybeSingle();
            
          setIsLiked(!!likeData);
        }
      }
    };

    fetchCurrentUser();
  }, [post.id, post.author_id, post.author_id]);

  // Fetch comments for this post
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:author_id(*)
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setPostComments(data);
      }
    };

    fetchComments();
  }, [post.id]);

  const formatPostDate = (date: string | Date | null) => {
    try {
      if (date) {
        return formatDistanceToNow(new Date(date), { addSuffix: true });
      }
      return "recently";
    } catch (error) {
      return "recently";
    }
  };

  // Extract properties safely with fallbacks to different formats
  const authorAvatarUrl = getProperty(post.author, 'avatarUrl', 'avatar_url');
  const authorFullName = getProperty(post.author, 'fullName', 'full_name');
  const authorUsername = post.author.username || "";

  // Current user properties
  const currentUserAvatarUrl = currentUser ? getProperty(currentUser, 'avatarUrl', 'avatar_url') : null;
  const currentUserFullName = currentUser ? getProperty(currentUser, 'fullName', 'full_name') : null;
  const currentUserUsername = currentUser?.username || "";

  // Get post properties with fallback to snake_case
  const mediaUrl = getProperty(post, 'mediaUrl', 'media_url');
  const achievementTitle = getProperty(post, 'achievementTitle', 'achievement_title');
  const achievementSubtitle = getProperty(post, 'achievementSubtitle', 'achievement_subtitle');
  const statsData = getProperty(post, 'statsData', 'stats_data');
  const createdAt = getProperty(post, 'createdAt', 'created_at');

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) {
        throw new Error("You must be logged in to like posts");
      }
      
      // If already liked, unlike the post
      if (isLiked) {
        // Delete the like record
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id);

        if (deleteError) {
          throw deleteError;
        }
        
        // Decrement the likes count directly in the posts table
        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes: Math.max(0, likesCount - 1) }) // Ensure likes don't go below 0
          .eq('id', post.id);
        
        if (updateError) {
          throw updateError;
        }
        
        return { liked: false };
      } else {
        // Add like record
        const { error: insertError } = await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: currentUser.id
          });

        if (insertError && insertError.code !== '23505') { // Ignore unique violation (already liked)
          throw insertError;
        }
        
        // Increment likes count directly in the posts table
        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes: likesCount + 1 })
          .eq('id', post.id);
        
        if (updateError) {
          throw updateError;
        }
        
        return { liked: true };
      }
    },
    onSuccess: (data) => {
      // Update local state immediately
      setIsLiked(data.liked);
      setLikesCount(prevCount => data.liked ? prevCount + 1 : Math.max(0, prevCount - 1));
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
    onError: (error) => {
      console.error("Error toggling like:", error);
    }
  });

  // Share to profile mutation
  const shareToProfileMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) {
        throw new Error("You must be logged in to share posts");
      }
      
      // Create a new post that references the original post
      const newPost: Record<string, any> = {
        author_id: currentUser.id,
        // Just indicate this is a shared post, we'll show the original content separately
        content: `Shared post from @${authorUsername}: ${post.content}`,
        // We'll use a special type to indicate this is a shared post
        type: 'shared',
        created_at: new Date().toISOString(),
        // Store reference to original post
        shared_original_post_id: post.id,
        // Store original post author info for rendering
        shared_author_username: authorUsername,
        shared_author_full_name: authorFullName,
        shared_author_avatar: authorAvatarUrl,
        // Copy the original post's content and metadata
        original_content: post.content,
        original_type: post.type
      };
      
      // Copy over any additional content fields based on original post type
      if (post.type === 'stats' && statsData) {
        newPost.stats_data = statsData;
      }
      
      if (post.type === 'achievement') {
        newPost.achievement_title = achievementTitle;
        newPost.achievement_subtitle = achievementSubtitle;
      }
      
      if (mediaUrl) {
        newPost.media_url = mediaUrl;
      }
      
      // Insert the new post
      const { data, error } = await supabase
        .from('posts')
        .insert(newPost)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Show success notification
      alert('Post shared to your profile!');
      // Refresh feed
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
    onError: (error) => {
      console.error("Error sharing post:", error);
      alert('Failed to share post. Please try again.');
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          author_id: currentUser?.id,
          content
        })
        .select(`*, author:author_id(*)`); // Return the new comment with author

      if (error) {
        throw error;
      }

      if (data) {
        // Update local state immediately instead of waiting for refetch
        setPostComments(prev => [data[0], ...prev]);
      }

      return data;
    },
    onSuccess: () => {
      setComment("");
    },
  });

  const handleAddComment = () => {
    if (comment.trim() && currentUser) {
      commentMutation.mutate(comment);
    } else if (!currentUser) {
      alert("You must be logged in to comment");
    }
  };

  const handleToggleLike = () => {
    if (currentUser) {
      toggleLikeMutation.mutate();
    } else {
      alert("You must be logged in to like posts");
    }
  };

  const handleSharePost = () => {
    if (currentUser) {
      shareToProfileMutation.mutate();
    } else {
      alert("You must be logged in to share posts");
    }
  };

  const commentsCount = postComments?.length || 0;

  let postContent;
  
  // For regular posts, use the normal content rendering
  if (post.type === "video") {
    postContent = (
      <div className="mt-2 relative">
        <div className="aspect-video bg-neutral-200">
          <div className="w-full h-full flex items-center justify-center relative">
            <img
              src={mediaUrl || ""}
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
            <h4 className="font-semibold">{achievementTitle}</h4>
            <p className="text-sm text-neutral-500">{achievementSubtitle}</p>
          </div>
        </div>
      </div>
    );
  } else if (post.type === "stats") {
    const goals = statsData?.goals || 0;
    const assists = statsData?.assists || 0;
    const passAccuracy = statsData?.passAccuracy || 0;
    const rating = 8.4;

    postContent = (
      <div className="px-4 py-6 bg-neutral-50 border-y border-neutral-100">
        <h4 className="font-semibold mb-4 text-center">Performance Stats</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <div className="text-center">
              <span className="block text-3xl font-bold text-primary">{goals}</span>
              <span className="text-sm text-neutral-500">Goals</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <div className="text-center">
              <span className="block text-3xl font-bold text-primary">{assists}</span>
              <span className="text-sm text-neutral-500">Assists</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <div className="text-center">
              <span className="block text-3xl font-bold text-primary">{passAccuracy}%</span>
              <span className="text-sm text-neutral-500">Pass Completion</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <div className="text-center">
              <span className="block text-3xl font-bold text-primary">{rating}</span>
              <span className="text-sm text-neutral-500">Avg. Rating</span>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (post.type === "shared") {
    // For shared posts, render a special nested post format
    postContent = (
      <div className="px-4 py-3 bg-neutral-50 border border-neutral-100 rounded-lg mx-4 my-2">
        {/* Original post author info */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-8 h-8">
            {sharedAuthorAvatar ? (
              <AvatarImage
                src={sharedAuthorAvatar}
                alt={sharedAuthorFullName || sharedAuthorUsername}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback>
              {getInitials(sharedAuthorFullName || sharedAuthorUsername)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-sm">
              {sharedAuthorFullName || sharedAuthorUsername}
            </div>
          </div>
        </div>
        
        {/* Original post content */}
        <p className="text-sm mb-3">{originalContent}</p>
        
        {/* Original post stats/achievement if applicable */}
        {originalType === "stats" && statsData && (
          <div className="px-3 py-4 bg-white border border-neutral-100 rounded-lg">
            <h4 className="font-semibold mb-3 text-center text-sm">Performance Stats</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-50 p-3 rounded-lg">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-primary">{statsData.goals || 0}</span>
                  <span className="text-xs text-neutral-500">Goals</span>
                </div>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-primary">{statsData.assists || 0}</span>
                  <span className="text-xs text-neutral-500">Assists</span>
                </div>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-primary">{statsData.passAccuracy || 0}%</span>
                  <span className="text-xs text-neutral-500">Pass Completion</span>
                </div>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-primary">{statsData.rating || 8.4}</span>
                  <span className="text-xs text-neutral-500">Avg. Rating</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {originalType === "achievement" && (
          <div className="bg-white p-3 border border-neutral-100 rounded-lg">
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center bg-amber-500/10 rounded-full flex-shrink-0">
                <i className="fas fa-trophy text-xl text-amber-500"></i>
              </div>
              <div className="ml-3">
                <h4 className="font-semibold text-sm">{achievementTitle}</h4>
                <p className="text-xs text-neutral-500">{achievementSubtitle}</p>
              </div>
            </div>
          </div>
        )}
        
        {mediaUrl && (
          <div className="mt-2 rounded-lg overflow-hidden">
            <img 
              src={mediaUrl} 
              alt="Shared media" 
              className="w-full h-auto object-cover" 
            />
          </div>
        )}
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
                {authorAvatarUrl ? (
                  <AvatarImage
                    src={authorAvatarUrl}
                    alt={authorFullName || authorUsername}
                    className="object-cover"
                    onError={() => {
                      console.error("Error loading avatar image in FeedPost");
                    }}
                  />
                ) : null}
                <AvatarFallback>
                  {getInitials(authorFullName || authorUsername)}
                </AvatarFallback>
              </Avatar>
            </a>
          </Link>
          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <div>
                <Link href={`/profile/${post.author.id}`}>
                  <a className="font-semibold hover:underline">{authorFullName || authorUsername}</a>
                </Link>
                <span className="text-neutral-500">• {formatPostDate(createdAt)}</span>
              </div>
              <button className="text-neutral-500 hover:text-neutral-700">
                <i className="fas fa-ellipsis-h"></i>
              </button>
            </div>
            <p className="text-neutral-500 text-sm">
              {getProperty(post.author, 'position', 'position')}
              {post.author.club ? ` at ${getProperty(post.author, 'club', 'club')}` : ''}
            </p>
            <p className="mt-2">{post.content}</p>
          </div>
        </div>
      </div>

      {/* For shared posts, add a sharing indicator before showing the post content */}
      {isSharedPost && (
        <div className="px-4 pt-1 pb-2 flex items-center">
          <i className="fas fa-share text-neutral-400 mr-2"></i>
          <span className="text-sm text-neutral-500">Shared a post</span>
        </div>
      )}

      {postContent}

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Like button with proper Tooltip structure */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`p-1.5 hover:bg-neutral-100 rounded-full transition-colors ${toggleLikeMutation.isPending ? 'opacity-50' : ''}`}
                    onClick={handleToggleLike}
                    disabled={toggleLikeMutation.isPending}
                    aria-label={isLiked ? "Unlike post" : "Like post"}
                  >
                    <i className={`fas fa-thumbs-up ${isLiked ? 'text-primary' : 'text-neutral-500'}`}></i>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {isLiked ? "Unlike" : "Like"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Comment button with proper Tooltip structure */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="p-1.5 hover:bg-neutral-100 rounded-full"
                    onClick={() => document.getElementById(`comment-input-${post.id}`)?.focus()}
                    aria-label="Comment on post"
                  >
                    <i className="fas fa-comment text-neutral-500"></i>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Comment
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Share button with proper Tooltip structure - only display on posts that aren't by the current user */}
            {!isCurrentUserPost && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className={`p-1.5 hover:bg-neutral-100 rounded-full ${shareToProfileMutation.isPending ? 'opacity-50' : ''}`}
                      onClick={handleSharePost}
                      disabled={shareToProfileMutation.isPending}
                      aria-label="Share post to your profile"
                    >
                      <i className="fas fa-share text-neutral-500"></i>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Share to your profile
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="text-sm text-neutral-500">
            <span>{likesCount} likes • {commentsCount} comments</span>
          </div>
        </div>

        {postComments.length > 0 && (
          <div className="mt-3 border-t pt-3">
            {postComments.map((comment: any) => {
              const commenterAvatarUrl = getProperty(comment.author, 'avatarUrl', 'avatar_url');
              const commenterFullName = getProperty(comment.author, 'fullName', 'full_name');
              const commenterUsername = comment.author?.username || "";

              return (
                <div key={comment.id} className="flex gap-2 mb-3">
                  <div 
                    className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer"
                    onClick={() => window.location.href = `/profile/${comment.author?.id}`}
                  >
                    <Avatar className="w-full h-full">
                      {commenterAvatarUrl ? (
                        <AvatarImage
                          src={commenterAvatarUrl}
                          alt={commenterFullName || commenterUsername}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(commenterFullName || commenterUsername)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-grow">
                    <div className="bg-neutral-100 rounded-2xl px-3 py-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm cursor-pointer" onClick={() => window.location.href = `/profile/${comment.author?.id}`}>{commenterFullName || commenterUsername}</span>
                        <span className="text-xs text-neutral-500">
                          {formatPostDate(getProperty(comment, 'createdAt', 'created_at'))}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 border-t pt-3">
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <Avatar className="w-full h-full">
                {currentUserAvatarUrl ? (
                  <AvatarImage
                    src={currentUserAvatarUrl}
                    alt={currentUserFullName || currentUserUsername}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback>
                  {getInitials(currentUserFullName || currentUserUsername)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-grow">
              <div className="relative">
                <input
                  id={`comment-input-${post.id}`}
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
