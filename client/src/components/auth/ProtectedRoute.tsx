import { useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { User } from "@shared/schema";
import { getCurrentUser, supabase } from "@/lib/queryClient";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  component: React.ComponentType;
}

export const ProtectedRoute = ({ component: Component }: ProtectedRouteProps) => {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Use React Query to fetch and cache the current user
  const { data: currentUser, isLoading, isError, refetch } = useQuery<User | null>({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });

  // Add an effect to do a direct Supabase session check (as a backup)
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Direct session check with Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          setAuthError(error.message);
        } else if (!data.session && !isLoading && !currentUser) {
          // No session found, and currentUser query completed with no user
          console.log("No active session found after direct check");
        } else if (data.session && !currentUser && !isLoading) {
          // We have a session but no user data - try to refetch user data
          console.log("Session exists but no user data, refetching...");
          refetch();
        }
      } catch (err) {
        console.error("Error in session check:", err);
      } finally {
        // Allow a bit more time for authentication to complete
        setTimeout(() => setIsCheckingAuth(false), 1000);
      }
    };

    checkSession();
  }, [currentUser, isLoading, refetch]);

  // Show loading state while checking authentication
  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  // Show error state if there was an authentication error
  if (isError || authError) {
    console.error("Authentication error:", authError || "Unknown error");
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    console.log("No authenticated user found, redirecting to login");
    return <Redirect to="/login" />;
  }

  // User is authenticated, render the protected component
  return <Component />;
};