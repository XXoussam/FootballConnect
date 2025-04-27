import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import OpportunityCard from "@/components/opportunities/OpportunityCard";
import EmptyState from "@/components/opportunities/EmptyState";
import OpportunityAlerts from "@/components/opportunities/OpportunityAlerts";

const Opportunities = () => {
  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });

  // Mock data - would be replaced with actual API calls
  const opportunities = [
    {
      id: 1,
      title: "Youth Team Trials",
      organization: "Manchester City FC Academy",
      type: "Trial",
      location: "Manchester, UK",
      date: "Jun 15, 2023",
      positions: ["Forward", "Midfielder"],
      ageRange: "16-18",
      logoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
      description: "Join our youth development program and showcase your talent. Looking for skilled forwards and midfielders for the upcoming season."
    },
    {
      id: 2,
      title: "Experienced Goalkeeper Needed",
      organization: "FC Barcelona",
      type: "Job",
      location: "Barcelona, Spain",
      date: "Immediately",
      positions: ["Goalkeeper"],
      ageRange: "25-35",
      logoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
      description: "Seeking an experienced goalkeeper with professional experience to join our first team squad."
    },
    {
      id: 3,
      title: "Summer Football Camp",
      organization: "Elite Soccer Training",
      type: "Training",
      location: "London, UK",
      date: "Jul 10-24, 2023",
      positions: ["All Positions"],
      ageRange: "14-21",
      logoUrl: "https://randomuser.me/api/portraits/men/67.jpg",
      description: "Intensive two-week training camp focused on technical skills development, tactical awareness, and physical conditioning."
    },
    {
      id: 4,
      title: "Defensive Coach Position",
      organization: "Ajax Football Academy",
      type: "Job",
      location: "Amsterdam, Netherlands",
      date: "Starting Aug 2023",
      positions: ["Coach"],
      ageRange: "30+",
      logoUrl: "https://randomuser.me/api/portraits/men/22.jpg",
      description: "Looking for an experienced defensive coach to join our youth academy coaching staff."
    },
    {
      id: 5,
      title: "Professional Trials - Strikers",
      organization: "Borussia Dortmund",
      type: "Trial",
      location: "Dortmund, Germany",
      date: "Jul 5-7, 2023",
      positions: ["Striker"],
      ageRange: "18-24",
      logoUrl: "https://randomuser.me/api/portraits/men/45.jpg",
      description: "Open trials for striker position. Seeking prolific goalscorers with pace and technical ability."
    },
    {
      id: 6,
      title: "Women's Team Expansion",
      organization: "Arsenal Women FC",
      type: "Trial",
      location: "London, UK",
      date: "Jun 28-30, 2023",
      positions: ["All Positions"],
      ageRange: "18-28",
      logoUrl: "https://randomuser.me/api/portraits/women/28.jpg",
      description: "Expanding our women's team roster. Looking for talented female players across all positions."
    }
  ];

  // Mock events
  const events = [
    {
      id: 1,
      title: "International Scouting Showcase",
      organizer: "Global Football Network",
      date: "May 28-30, 2023",
      location: "Berlin, Germany",
      attendees: 145,
      imageUrl: "https://source.unsplash.com/random/300x200/?football,event"
    },
    {
      id: 2,
      title: "Football Career Expo 2023",
      organizer: "Sports Career Alliance",
      date: "Jun 12, 2023",
      location: "London, UK",
      attendees: 230,
      imageUrl: "https://source.unsplash.com/random/300x200/?stadium,football"
    }
  ];

  // Toggle states
  const [trials, setTrials] = useState(true);
  const [jobs, setJobs] = useState(false);
  const [positions, setPositions] = useState(true);
  const [training, setTraining] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Opportunities</h1>
        <p className="text-neutral-600">Discover trials, jobs, and events in the football industry</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm mb-6">
            <div className="p-4 flex flex-col sm:flex-row gap-3">
              <Input 
                placeholder="Search opportunities..."
                className="flex-grow"
              />
              <Button variant="outline" className="whitespace-nowrap">
                <i className="fas fa-filter mr-2"></i>
                Filters
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="trials">Trials</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map(opportunity => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </TabsContent>
            
            <TabsContent value="trials" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.filter(opp => opp.type === 'Trial').length > 0 ? (
                opportunities
                  .filter(opp => opp.type === 'Trial')
                  .map(opportunity => (
                    <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                  ))
              ) : (
                <div className="col-span-2">
                  <EmptyState 
                    type="trials" 
                    icon="fa-clipboard-list" 
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="jobs" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.filter(opp => opp.type === 'Job').length > 0 ? (
                opportunities
                  .filter(opp => opp.type === 'Job')
                  .map(opportunity => (
                    <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                  ))
              ) : (
                <div className="col-span-2">
                  <EmptyState 
                    type="jobs" 
                    icon="fa-briefcase" 
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="training" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.filter(opp => opp.type === 'Training').length > 0 ? (
                opportunities
                  .filter(opp => opp.type === 'Training')
                  .map(opportunity => (
                    <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                  ))
              ) : (
                <div className="col-span-2">
                  <EmptyState 
                    type="training programs" 
                    icon="fa-graduation-cap"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4">Upcoming Events</h3>
            <div className="space-y-4">
              {events.map(event => (
                <div key={event.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <img 
                    src={event.imageUrl} 
                    alt={event.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h4 className="font-medium">{event.title}</h4>
                  <div className="text-sm text-neutral-600 mt-1">{event.organizer}</div>
                  <div className="flex flex-wrap items-center text-sm text-neutral-500 mt-2 gap-x-4 gap-y-1">
                    <span className="flex items-center">
                      <i className="fas fa-calendar mr-1"></i>
                      {event.date}
                    </span>
                    <span className="flex items-center">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      {event.location}
                    </span>
                    <span className="flex items-center">
                      <i className="fas fa-users mr-1"></i>
                      {event.attendees} attending
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 w-full">
                    View Event
                  </Button>
                </div>
              ))}
              <Button variant="link" className="w-full">
                View all events <i className="fas fa-arrow-right ml-1"></i>
              </Button>
            </div>
          </div>
          
          <OpportunityAlerts />
        </div>
      </div>
    </div>
  );
};

export default Opportunities;
