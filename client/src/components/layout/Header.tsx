import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

const Header = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: currentUser, isLoading } = useQuery<User | null>({
    queryKey: ["/api/users/me"],
  });

  const isActive = (path: string) => location === path;

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

          {/* Desktop Navigation */}
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
            <Link href="/opportunities">
              <a className={`${isActive('/opportunities') ? 'text-primary' : 'text-neutral-700'} hover:text-primary flex items-center gap-1 font-medium`}>
                <i className="fas fa-briefcase"></i>
                <span>Opportunities</span>
              </a>
            </Link>
            <Link href="/profile">
              <a className={`${isActive('/profile') ? 'text-primary' : 'text-neutral-700'} hover:text-primary flex items-center gap-1 font-medium`}>
                <i className="fas fa-user"></i>
                <span>My Profile</span>
              </a>
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Input 
              type="text" 
              placeholder="Search players, clubs, opportunities..." 
              className="pl-10 pr-4 py-2 rounded-full border border-neutral-200 w-64"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"></i>
          </div>

          {!isLoading && currentUser ? (
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-full hover:bg-neutral-100 relative" aria-label="Messages">
                <i className="fas fa-envelope text-neutral-600"></i>
                <span className="absolute top-0 right-0 bg-amber-500 w-2 h-2 rounded-full"></span>
              </button>
              
              <button className="p-2 rounded-full hover:bg-neutral-100 relative" aria-label="Notifications">
                <i className="fas fa-bell text-neutral-600"></i>
                <span className="absolute top-0 right-0 bg-amber-500 w-2 h-2 rounded-full"></span>
              </button>
              
              <Link href="/profile">
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" />
                  <AvatarFallback>{currentUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Link href="/login">
                <Button variant="outline" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-md"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-neutral-600`}></i>
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
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
            <Link href="/opportunities">
              <a className={`${isActive('/opportunities') ? 'text-primary' : 'text-neutral-700'} py-2 hover:text-primary flex items-center gap-2 font-medium`}>
                <i className="fas fa-briefcase w-5"></i>
                <span>Opportunities</span>
              </a>
            </Link>
            <Link href="/profile">
              <a className={`${isActive('/profile') ? 'text-primary' : 'text-neutral-700'} py-2 hover:text-primary flex items-center gap-2 font-medium`}>
                <i className="fas fa-user w-5"></i>
                <span>My Profile</span>
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
