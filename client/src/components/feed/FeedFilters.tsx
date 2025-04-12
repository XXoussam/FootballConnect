import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FeedFiltersProps {
  onFilterChange?: (filter: string) => void;
}

const FeedFilters = ({ onFilterChange }: FeedFiltersProps) => {
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = [
    { id: "all", label: "All Updates" },
    { id: "highlights", label: "Highlights" },
    { id: "matches", label: "Match Updates" },
    { id: "transfers", label: "Transfer News" },
    { id: "training", label: "Training" },
  ];

  const handleFilterClick = (filterId: string) => {
    setActiveFilter(filterId);
    if (onFilterChange) {
      onFilterChange(filterId);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? "default" : "outline"}
            className={`px-4 py-1.5 ${
              activeFilter === filter.id
                ? "bg-primary text-white"
                : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            } rounded-full text-sm whitespace-nowrap`}
            onClick={() => handleFilterClick(filter.id)}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default FeedFilters;
