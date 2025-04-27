import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/queryClient";
import { Event as BaseEvent } from "@shared/schema";

// Extended Event interface with price property
interface Event extends BaseEvent {
  price?: number;
}
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Add leaflet imports
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icon issue in React
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

// Simple geocoding service (mock)
const getCoordsFromLocation = (location: string): [number, number] => {
  // Map common football venues to coordinates
  const locationMap: Record<string, [number, number]> = {
    "Camp Nou, Barcelona": [41.380898, 2.122820],
    "Old Trafford, Manchester": [53.463056, -2.291389],
    "Wembley Stadium, London": [51.556111, -0.279167],
    "Anfield, Liverpool": [53.430829, -2.960828],
    "Etihad Stadium": [53.483056, -2.200278],
    "Emirates Stadium": [51.555, -0.108611],
    "Santiago Bernabéu": [40.453056, -3.688333],
    "San Siro": [45.478056, 9.124167],
    "Manchester": [53.483959, -2.244644],
    "London": [51.5074, -0.1278],
    "Liverpool": [53.4084, -2.9916],
    "Birmingham": [52.4862, -1.8904],
    "Leeds": [53.8008, -1.5491]
  };
  
  // Try to match the location to our predefined list
  for (const [key, coords] of Object.entries(locationMap)) {
    if (location.toLowerCase().includes(key.toLowerCase())) {
      return coords;
    }
  }
  
  // Default to a central location if no match
  return [51.505, -0.09]; // London, UK as default
};

// Dynamic Map component that only renders on client-side
const EventMap = ({ location, title }: { location: string, title: string }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return <div className="h-full min-h-[200px] bg-neutral-100 flex items-center justify-center">
      <span className="text-neutral-400">Loading map...</span>
    </div>;
  }
  
  const coords = getCoordsFromLocation(location);
  
  return (
    <MapContainer 
      center={coords} 
      zoom={13} 
      scrollWheelZoom={false} 
      style={{ height: '100%', width: '100%', minHeight: '220px', borderRadius: '8px', overflow: 'hidden' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={coords}>
        <Popup>
          {title} <br /> {location}
        </Popup>
      </Marker>
    </MapContainer>
  );
};

const EventsPage = () => {
  // State for filter
  const [filter, setFilter] = useState<string>("all");
  
  // Initialize Leaflet icons once when component mounts
  useEffect(() => {
    fixLeafletIcon();
  }, []);
  
  // Fetch all events from Supabase
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ["/api/events", filter],
    queryFn: async () => {
      try {
        let query = supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true });
        
        // Apply filter if not "all"
        if (filter !== "all") {
          query = query.eq('type', filter);
        }
        
        // Only show future events (events with dates greater than today)
        const now = new Date().toISOString();
        query = query.gte('date', now);
        
        const { data, error } = await query;
          
        if (error) {
          console.error("Error fetching events:", error);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error("Failed to fetch events:", error);
        throw error;
      }
    }
  });

  // Group events by date (YYYY-MM-DD)
  const groupedEvents = (events || []).reduce((acc, event) => {
    const dateKey = new Date(event.date).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);
  const sortedDates = Object.keys(groupedEvents).sort();

  // Helper function for date formatting
  const formatDate = (dateInput: string | Date) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      fullDate: date.toLocaleDateString(undefined, { 
        weekday: 'short',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      }),
      time: date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  // Helper function to get event type color/style
  const getEventTypeStyles = (type: string) => {
    switch (type) {
      case "networking":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          icon: "fa-handshake"
        };
      case "training":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          icon: "fa-dumbbell"
        };
      case "match":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          icon: "fa-futbol"
        };
      case "trial":
        return {
          bg: "bg-purple-100",
          text: "text-purple-700",
          icon: "fa-clipboard-list"
        };
      case "social":
        return {
          bg: "bg-amber-100",
          text: "text-amber-700",
          icon: "fa-users"
        };
      default:
        return {
          bg: "bg-neutral-100",
          text: "text-neutral-700",
          icon: "fa-calendar-day"
        };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Events</h1>
        
        <div className="grid gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-lg bg-neutral-200"></div>
                <div className="flex-1">
                  <div className="h-6 bg-neutral-200 rounded w-1/3 mb-3"></div>
                  <div className="h-4 bg-neutral-200 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Events</h1>
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Failed to load events. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Football Events</h1>
      
      {/* Filter tabs */}
      <Tabs defaultValue="all" className="mb-8" onValueChange={setFilter}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="networking">Networking</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="match">Matches</TabsTrigger>
          <TabsTrigger value="trial">Trials</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {/* All events content shown by default */}
        </TabsContent>

        {/* Other tab contents - they use the filter state to filter events */}
      </Tabs>
      
      {/* Event timeline */}
      <div className="relative pl-8 mt-8">
        {/* Vertical timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200 z-0" />
        {events && events.length > 0 ? (
          sortedDates.map((dateKey, idx) => {
            const dateObj = new Date(dateKey);
            const dateInfo = formatDate(dateObj);
            return (
              <div key={dateKey} className="relative mb-10">
                {/* Date header with dot */}
                <div className="flex items-center mb-6">
                  <div className="z-10 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-base absolute -left-0">
                    {dateInfo.day}
                  </div>
                  <div className="ml-10">
                    <span className="text-lg font-semibold">{dateInfo.month} {dateInfo.year}</span>
                  </div>
                </div>
                {/* Events for this date */}
                <div className="flex flex-col gap-6 ml-10">
                  {groupedEvents[dateKey].map((event) => {
                    const typeStyles = getEventTypeStyles(event.type);
                    const eventTime = formatDate(event.date).time;
                    return (
                      <div key={event.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-100 relative">
                        <div className="flex flex-col md:flex-row">
                          <div className="p-6 flex-grow">
                            <div className="flex gap-5">
                              {/* Time indicator */}
                              <div className={`flex-shrink-0 w-24 h-20 ${typeStyles.bg} rounded-lg flex flex-col items-center justify-center`}>
                                <span className="text-lg font-bold">{eventTime}</span>
                              </div>
                              {/* Event details */}
                              <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-3 py-1 rounded text-xs font-medium ${typeStyles.bg} ${typeStyles.text}`}>
                                    <i className={`fas ${typeStyles.icon} mr-1`}></i>
                                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                                  </span>
                                </div>
                                <h2 className="text-lg font-semibold mb-2">{event.title}</h2>
                                <p className="text-neutral-600 mb-3">{event.description}</p>
                                <div className="flex flex-wrap gap-6">
                                  <div className="flex items-center text-neutral-500">
                                    <i className="fas fa-user mr-2"></i>
                                    <span>{'Unknown Organizer'}</span>
                                  </div>
                                  <div className="flex items-center text-neutral-500">
                                    <i className="fas fa-map-marker-alt mr-2"></i>
                                    <span>{event.location}</span>
                                  </div>
                                  {event.price && (
                                    <div className="flex items-center text-neutral-500">
                                      <i className="fas fa-ticket-alt mr-2"></i>
                                      <span>{event.price === 0 ? 'Free' : `$${event.price}`}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Event location map */}
                          <div className="border-t md:border-t-0 md:border-l border-neutral-100 p-0 md:w-1/2 min-h-[220px] relative">
                            <EventMap location={event.location} title={event.title} />
                          </div>
                        </div>
                        
                        <div className="border-t border-neutral-100 px-6 py-3 bg-neutral-50 flex justify-end">
                          <Button variant="outline" size="sm" className="mr-2">
                            <i className="far fa-calendar-plus mr-2"></i>
                            Add to Calendar
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <i className="fas fa-check-circle mr-2"></i>
                            Reserve
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <i className="fas fa-calendar-day text-4xl text-neutral-300 mb-3"></i>
            <h3 className="text-lg font-medium mb-1">No events found</h3>
            <p className="text-neutral-500">
              {filter === "all" 
                ? "There are no upcoming events scheduled at this time."
                : `There are no upcoming ${filter} events scheduled at this time.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;