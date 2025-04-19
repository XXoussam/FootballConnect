import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://upxpzbvnvwvpwxrwajrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVweHB6YnZudnd2cHd4cndhanJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNzIyOTIsImV4cCI6MjA2MDY0ODI5Mn0.cARn3kj8LU9wufAX4zvbKaZ57pZYR4KQySg6MoOiyMg';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export the client for use in other files
export default supabase;