
import { useState } from "react";
import { ImageMap } from "@/components/ImageMap";
import { SearchNavigation } from "@/components/SearchNavigation";
import { PositioningStatus } from "@/components/PositioningStatus";
import { useToast } from "@/hooks/use-toast";
import { schoolRooms } from "@/data/schoolRooms";
import type { Room } from "@/hooks/useSchoolNavigation";

const Index = () => {
  const [selectedStart, setSelectedStart] = useState<Room | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Room | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const { toast } = useToast();

  const handleStartSelect = (room: Room | 'current') => {
    if (room === 'current') {
      setUseCurrentLocation(true);
      setSelectedStart(null);
    } else {
      setUseCurrentLocation(false);
      setSelectedStart(room);
    }
  };

  const handleEndSelect = (room: Room) => {
    setSelectedEnd(room);
  };

  const handleNavigate = () => {
    if ((!selectedStart && !useCurrentLocation) || !selectedEnd) {
      toast({ title: "Please select both start and destination", variant: "destructive" });
      return;
    }
    
    // Trigger navigation in the map component
    toast({ title: "Calculating route...", description: "Finding the best path for you" });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-subtle flex flex-col">
      {/* Header with positioning status */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="px-4 py-3">
          <PositioningStatus />
        </div>
      </div>

      {/* Search Interface */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="p-4">
          <SearchNavigation
            onStartSelect={handleStartSelect}
            onEndSelect={handleEndSelect}
            onNavigate={handleNavigate}
            selectedStart={selectedStart}
            selectedEnd={selectedEnd}
            currentLocationAvailable={true}
          />
        </div>
      </div>

      {/* Map - Full screen below search */}
      <main className="flex-1 relative">
        <div className="absolute inset-0">
          <ImageMap 
            selectedStart={selectedStart}
            selectedEnd={selectedEnd}
            useCurrentLocation={useCurrentLocation}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;