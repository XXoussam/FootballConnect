import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Opportunity } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const Opportunities = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const { data: opportunities, isLoading, error } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
  });

  // Sample data for UI display
  const sampleOpportunities: Opportunity[] = [
    {
      id: 1,
      title: "Midfielder Needed",
      club: "Liverpool FC",
      location: "Liverpool, UK",
      category: "football",
      position: "Midfielder",
      description: "Looking for an experienced midfielder with strong passing skills and field vision. Opportunity to join one of the Premier League's top clubs.",
      salary: "$50k-$80k",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      title: "Scouting Event - Forwards",
      club: "Juventus FC",
      location: "Turin, Italy",
      category: "training",
      position: "Forward",
      description: "Scouting event for talented forwards. Showcase your skills to Juventus scouts and potentially secure a spot in our academy or first team.",
      type: "Tryout",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      title: "Center-Back Position Open",
      club: "Bayern Munich",
      location: "Munich, Germany",
      category: "defense",
      position: "Defender",
      description: "Bayern Munich is seeking a strong center-back with exceptional defensive skills, aerial ability, and leadership qualities to strengthen our backline.",
      salary: "$70k-$90k",
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      title: "Goalkeeper Coach",
      club: "Arsenal FC",
      location: "London, UK",
      category: "coaching",
      position: "Coach",
      description: "Experienced goalkeeper coach needed to train and develop our goalkeeping talent across all levels from academy to first team.",
      salary: "$65k-$85k",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 5,
      title: "Youth Academy Trials",
      club: "Ajax Amsterdam",
      location: "Amsterdam, Netherlands",
      category: "academy",
      position: "Various",
      description: "Ajax's prestigious youth academy is holding trials for talented young players across all positions. Ages 12-18 welcome.",
      type: "Youth Development",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  const displayOpportunities = opportunities || sampleOpportunities;

  // Apply filters
  const filteredOpportunities = displayOpportunities.filter(opportunity => {
    const matchesSearch = searchQuery === "" || 
      opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.club.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPosition = positionFilter === "" || 
      opportunity.position?.toLowerCase() === positionFilter.toLowerCase();
    
    const matchesLocation = locationFilter === "" ||
      opportunity.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesPosition && matchesLocation;
  });

  const handleApply = (opportunityId: number) => {
    toast({
      title: "Application Submitted",
      description: "Your application has been sent to the club. Good luck!",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Football Opportunities</h1>
        <p className="text-neutral-600">Find the perfect opportunity to advance your football career</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-700">Search</label>
            <Input
              placeholder="Search by title, club or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-700">Position</label>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="">All Positions</SelectItem>
                  <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                  <SelectItem value="defender">Defender</SelectItem>
                  <SelectItem value="midfielder">Midfielder</SelectItem>
                  <SelectItem value="forward">Forward</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-700">Location</label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="">All Locations</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="Spain">Spain</SelectItem>
                  <SelectItem value="Italy">Italy</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading state
          Array(6).fill(0).map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-24 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))
        ) : error ? (
          <div className="col-span-3 text-center py-12">
            <p className="text-red-500">Failed to load opportunities</p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <i className="fas fa-search text-4xl text-neutral-300 mb-3"></i>
            <h3 className="text-lg font-medium mb-1">No opportunities found</h3>
            <p className="text-neutral-500">Try adjusting your search filters</p>
          </div>
        ) : (
          filteredOpportunities.map((opportunity) => (
            <Card key={opportunity.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{opportunity.title}</CardTitle>
                    <CardDescription>{opportunity.club}</CardDescription>
                  </div>
                  <div className={`w-10 h-10 ${opportunity.category === 'football' ? 'bg-primary/10' : opportunity.category === 'training' ? 'bg-secondary/10' : 'bg-amber-500/10'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <i className={`${opportunity.category === 'football' ? 'fas fa-futbol text-primary' : opportunity.category === 'training' ? 'fas fa-running text-secondary' : 'fas fa-shield-alt text-amber-500'}`}></i>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-neutral-500 mb-3">
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  <span>{opportunity.location}</span>
                </div>
                <p className="text-sm mb-4">{opportunity.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {opportunity.position && (
                    <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-full">
                      {opportunity.position}
                    </span>
                  )}
                  {opportunity.salary && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {opportunity.salary}
                    </span>
                  )}
                  {opportunity.type && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {opportunity.type}
                    </span>
                  )}
                </div>
                <Button 
                  className="w-full"
                  onClick={() => handleApply(opportunity.id)}
                >
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Opportunities;
