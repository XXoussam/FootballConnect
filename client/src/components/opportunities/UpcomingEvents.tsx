import { Link } from "wouter";
import { Event } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface UpcomingEventsProps {
  limit?: number;
}

const EventCard = ({ event }: { event: Event }) => {
  const getEventDateDisplay = () => {
    const date = new Date(event.date);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    
    return { day, month };
  };

  const dateDisplay = getEventDateDisplay();
  
  const getEventTypeColor = () => {
    switch (event.type) {
      case "match":
        return "bg-primary/5 text-primary";
      case "training":
        return "bg-secondary/5 text-secondary";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };
  
  return (
    <div className="p-4">
      <div className="flex gap-3">
        <div className={`flex-shrink-0 w-14 h-14 ${getEventTypeColor()} rounded-lg flex flex-col items-center justify-center`}>
          <span className="font-bold">{dateDisplay.day}</span>
          <span className="text-xs text-neutral-500">{dateDisplay.month}</span>
        </div>
        <div>
          <h4 className="font-medium">{event.title}</h4>
          <p className="text-sm text-neutral-500 mt-0.5">{event.description}</p>
          <div className="flex items-center text-xs gap-2 mt-1.5 text-neutral-500">
            <i className="fas fa-map-marker-alt"></i>
            <span>{event.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const UpcomingEvents = ({ limit = 2 }: UpcomingEventsProps) => {
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Sample data for UI display
  const sampleEvents: Event[] = [
    {
      id: 1,
      title: "Man Utd vs. Liverpool",
      description: "Premier League Match",
      date: new Date(2023, 9, 15).toISOString(),
      location: "Old Trafford, Manchester",
      type: "match"
    },
    {
      id: 2,
      title: "Premier Skills Training",
      description: "Skills Development Program",
      date: new Date(2023, 9, 22).toISOString(),
      location: "Carrington Training Ground",
      type: "training"
    }
  ];

  const displayEvents = events || sampleEvents;
  const limitedEvents = displayEvents.slice(0, limit);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
        <div className="p-4 border-b border-neutral-100">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
        
        {[1, 2].map((i) => (
          <div key={i} className="p-4 border-b border-neutral-100">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 bg-gray-200 rounded-lg"></div>
              <div className="flex-grow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-red-500">Failed to load events</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Upcoming Events</h3>
          <Link href="/events">
            <a className="text-primary text-sm">See all</a>
          </Link>
        </div>
      </div>
      
      <div className="divide-y">
        {limitedEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;
