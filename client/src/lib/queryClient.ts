import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { createClient } from '@supabase/supabase-js';

// Create a single Supabase client for the entire app
const supabaseUrl = 'https://upxpzbvnvwvpwxrwajrp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVweHB6YnZudnd2cHd4cndhanJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNzIyOTIsImV4cCI6MjA2MDY0ODI5Mn0.cARn3kj8LU9wufAX4zvbKaZ57pZYR4KQySg6MoOiyMg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to get the current user from Supabase
export const getCurrentUser = async () => {
  try {
    // First check the session
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Debug session data to see what's happening
    console.log("Session check:", sessionData?.session ? "Active session found" : "No active session");
    
    // Initialize refreshData outside the if block so it's accessible in the entire function scope
    let refreshData: { session: any } | undefined;
    
    if (!sessionData.session) {
      // Try to refresh the session before giving up
      const { data } = await supabase.auth.refreshSession();
      refreshData = data;
      console.log("Attempted session refresh:", refreshData?.session ? "Success" : "Failed");
      
      if (!refreshData?.session) {
        return null;
      }
    }
    
    // Use the session user ID to get user data
    const userId = sessionData.session?.user.id || refreshData?.session?.user.id;
    
    // If we have a session, get the user data
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
    
    return userData;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// API request helper function that uses fetch
export const apiRequest = async (method: string, endpoint: string, data?: any) => {
  // Get the current session to include the access token
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // Add the Authorization header with the access token if available
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    },
    credentials: 'include',
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${window.location.origin}${endpoint}`, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'An error occurred');
  }

  // For 204 No Content responses
  if (response.status === 204) {
    return null;
  }

  return response;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
