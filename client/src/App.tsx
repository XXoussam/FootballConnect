import { Switch, Route, useLocation } from "wouter";
import { queryClient, getCurrentUser } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Profile from "@/pages/profile";
import Opportunities from "@/pages/opportunities";
import Network from "@/pages/network";
import NotFound from "@/pages/not-found";
import Events from "@/pages/events";
import AI from "@/pages/ai";
import Messages from "@/pages/messages";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/profile/:author_id" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/opportunities" component={() => <ProtectedRoute component={Opportunities} />} />
      <Route path="/network" component={() => <ProtectedRoute component={Network} />} />
      <Route path="/events" component={() => <ProtectedRoute component={Events} />} />
      <Route path="/ai" component={() => <ProtectedRoute component={AI} />} />
      <Route path="/messages" component={() => <ProtectedRoute component={Messages} />} />
      <Route path="/messages/:user_id" component={() => <ProtectedRoute component={Messages} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  
  // Prefetch user data when the app starts
  useEffect(() => {
    // Prefetch the current user data using our getCurrentUser function
    queryClient.prefetchQuery({
      queryKey: ["currentUser"],
      queryFn: getCurrentUser
    });
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow">
        <Router />
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
