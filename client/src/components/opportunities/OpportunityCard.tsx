import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case "Trial": return "bg-blue-100 text-blue-800";
    case "Job": return "bg-green-100 text-green-800";
    case "Training": return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const OpportunityCard = ({ opportunity }: { opportunity: any }) => (
  <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
    <CardHeader className="p-4 pb-2">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={opportunity.logoUrl} alt={opportunity.organization} />
          <AvatarFallback>{opportunity.organization.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold truncate">{opportunity.title}</CardTitle>
              <CardDescription className="text-sm text-neutral-600 truncate">
                {opportunity.organization}
              </CardDescription>
            </div>
            <Badge className={`ml-1 ${getTypeBadgeColor(opportunity.type)}`}>
              {opportunity.type}
            </Badge>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-4 pt-2">
      <div className="text-sm text-neutral-700 mb-3 line-clamp-2">
        {opportunity.description}
      </div>
      <div className="flex flex-wrap items-center text-xs text-neutral-500 gap-x-4 gap-y-1 mb-2">
        <span className="flex items-center">
          <i className="fas fa-map-marker-alt mr-1"></i>
          {opportunity.location}
        </span>
        <span className="flex items-center">
          <i className="fas fa-calendar mr-1"></i>
          {opportunity.date}
        </span>
        <span className="flex items-center">
          <i className="fas fa-user-alt mr-1"></i>
          {opportunity.ageRange}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {opportunity.positions.map((position: string, i: number) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {position}
          </Badge>
        ))}
      </div>
    </CardContent>
    <CardFooter className="p-4 pt-1 flex justify-between">
      <Button size="sm" variant="ghost" className="text-xs">
        <i className="far fa-bookmark mr-1"></i> Save
      </Button>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button size="sm" className="text-xs">Apply Now</Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{opportunity.title}</h4>
            <p className="text-xs text-neutral-600">{opportunity.description}</p>
            <p className="text-xs text-neutral-500">
              Submit your application directly on the organization's website.
            </p>
            <Button size="sm" className="w-full">
              Continue to Application
            </Button>
          </div>
        </HoverCardContent>
      </HoverCard>
    </CardFooter>
  </Card>
);

export default OpportunityCard;
