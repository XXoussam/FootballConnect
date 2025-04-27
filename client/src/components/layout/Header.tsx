import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { queryClient, supabase } from "@/lib/queryClient";

const Header = () => {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const { data: currentUser, isLoading } = useQuery<User | null>({
    queryKey: ["currentUser"],
  });

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (currentUser?.id) {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('id')
            .eq('receiver_id', currentUser.id)
            .eq('read', false);
          
          if (!error && data) {
            setUnreadMessageCount(data.length);
          }
        } catch (err) {
          console.error("Error fetching unread messages:", err);
        }
      }
    };

    fetchUnreadCount();
    
    // Set up real-time subscription for new messages
    if (currentUser?.id) {
      const channel = supabase
        .channel('messages-changes')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` }, 
          payload => {
            if (!payload.new.read) {
              setUnreadMessageCount(prevCount => prevCount + 1);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser?.id]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Sign out with Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear the user data in the query client
      await queryClient.setQueryData(["currentUser"], null);
    },
    onSuccess: () => {
      navigate("/login");
    },
  });

  const isActive = (path: string) => location === path;

  // Don't show navigation on login and register pages
  const isAuthPage = location === "/login" || location === "/register";

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center text-white font-bold text-xl">
              FL
            </div>
            <span className="ml-2 text-primary font-bold text-xl">FootLink</span>
          </Link>

          {/* Only show navigation when user is logged in and not on auth pages */}
          {!isLoading && currentUser && !isAuthPage && (
            <nav className="hidden md:flex space-x-6">
              <Link href="/">
                <a className={`${isActive('/') ? 'text-primary' : 'text-neutral-700'} hover:text-primary flex items-center gap-1 font-medium`}>
                  <i className="fas fa-home"></i>
                  <span>Home</span>
                </a>
              </Link>
              <Link href="/network">
                <a className={`${isActive('/network') ? 'text-primary' : 'text-neutral-700'} hover:text-primary flex items-center gap-1 font-medium`}>
                  <i className="fas fa-users"></i>
                  <span>Network</span>
                </a>
              </Link>
              <Link href="/messages">
                <a className={`${isActive('/messages') ? 'text-primary' : 'text-neutral-700'} hover:text-primary flex items-center gap-1 font-medium`}>
                  <i className="fas fa-envelope"></i>
                  <span>Messages</span>
                </a>
              </Link>
              <Link href="/opportunities">
                <a className={`${isActive('/opportunities') ? 'text-primary' : 'text-neutral-700'} hover:text-primary flex items-center gap-1 font-medium`}>
                  <i className="fas fa-briefcase"></i>
                  <span>Opportunities</span>
                </a>
              </Link>
              <Link href="/events">
                <a className={`${isActive('/events') ? 'text-primary' : 'text-neutral-700'} hover:text-primary flex items-center gap-1 font-medium`}>
                  <i className="fas fa-calendar-alt"></i>
                  <span>Events</span>
                </a>
              </Link>
              <Link href="/ai">
                <a className={`${isActive('/ai') ? 'text-primary' : 'text-neutral-700'} hover:text-primary flex items-center gap-1 font-medium`}>
                  <i className="fas fa-robot"></i>
                  <span>AI</span>
                </a>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {!isLoading && currentUser && !isAuthPage && (
            <>
              <div className="relative hidden md:block">
                <Input 
                  type="text" 
                  placeholder="Search players, clubs, opportunities..." 
                  className="pl-10 pr-4 py-2 rounded-full border border-neutral-200 w-64"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"></i>
              </div>

              <div className="flex items-center space-x-2">
                <Link href="/messages">
                  <a className="p-2 rounded-full hover:bg-neutral-100 relative" aria-label="Messages">
                    <i className="fas fa-envelope text-neutral-600"></i>
                    {unreadMessageCount > 0 && (
                      <span className="absolute top-0 right-0 bg-amber-500 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </span>
                    )}
                  </a>
                </Link>
                
                <button className="p-2 rounded-full hover:bg-neutral-100 relative" aria-label="Notifications">
                  <i className="fas fa-bell text-neutral-600"></i>
                  <span className="absolute top-0 right-0 bg-amber-500 w-2 h-2 rounded-full"></span>
                </button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none">
                      <Avatar className="h-10 w-10 cursor-pointer">
                        <AvatarFallback>{currentUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        {currentUser.avatar_url && <AvatarImage src={currentUser.avatar_url} alt={currentUser.full_name || currentUser.username} />}
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/profile/${currentUser.id}`)}>
                      <i className="fas fa-user mr-2 text-neutral-500"></i>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/messages')}>
                      <i className="fas fa-envelope mr-2 text-neutral-500"></i>
                      Messages
                      {unreadMessageCount > 0 && (
                        <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-2 py-0.5">
                          {unreadMessageCount}
                        </span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                      <i className="fas fa-sign-out-alt mr-2 text-neutral-500"></i>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}

          {/* Show login/signup buttons only when not logged in and not on auth pages */}
          {!isLoading && !currentUser && !isAuthPage && (
            <div className="flex space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu button - only show when logged in */}
          {!isLoading && currentUser && !isAuthPage && (
            <button 
              className="md:hidden p-2 rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-neutral-600`}></i>
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation - only show when logged in */}
      {!isLoading && currentUser && !isAuthPage && mobileMenuOpen && (
        <div className="md:hidden bg-white border-t pt-2 pb-4 px-4">
          <div className="flex flex-col space-y-3">
            <Link href="/">
              <a className={`${isActive('/') ? 'text-primary' : 'text-neutral-700'} py-2 hover:text-primary flex items-center gap-2 font-medium`}>
                <i className="fas fa-home w-5"></i>
                <span>Home</span>
              </a>
            </Link>
            <Link href="/network">
              <a className={`${isActive('/network') ? 'text-primary' : 'text-neutral-700'} py-2 hover:text-primary flex items-center gap-2 font-medium`}>
                <i className="fas fa-users w-5"></i>
                <span>Network</span>
              </a>
            </Link>
            <Link href="/messages">
              <a className={`${isActive('/messages') ? 'text-primary' : 'text-neutral-700'} py-2 hover:text-primary flex items-center gap-2 font-medium`}>
                <i className="fas fa-envelope w-5"></i>
                <span>Messages</span>
                {unreadMessageCount > 0 && (
                  <span className="bg-amber-500 text-white text-xs rounded-full px-2 py-0.5 ml-auto">
                    {unreadMessageCount}
                  </span>
                )}
              </a>
            </Link>
            <Link href="/opportunities">
              <a className={`${isActive('/opportunities') ? 'text-primary' : 'text-neutral-700'} py-2 hover:text-primary flex items-center gap-2 font-medium`}>
                <i className="fas fa-briefcase w-5"></i>
                <span>Opportunities</span>
              </a>
            </Link>
            <Link href="/events">
              <a className={`${isActive('/events') ? 'text-primary' : 'text-neutral-700'} py-2 hover:text-primary flex items-center gap-2 font-medium`}>
                <i className="fas fa-calendar-alt w-5"></i>
                <span>Events</span>
              </a>
            </Link>
            <Link href="/ai">
              <a className={`${isActive('/ai') ? 'text-primary' : 'text-neutral-700'} py-2 hover:text-primary flex items-center gap-2 font-medium`}>
                <i className="fas fa-robot w-5"></i>
                <span>AI</span>
              </a>
            </Link>
            
            <div className="pt-2 mt-2 border-t">
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-10 w-full"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"></i>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
