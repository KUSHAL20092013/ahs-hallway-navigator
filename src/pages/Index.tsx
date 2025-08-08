import { useState } from "react";
import { ImageMap } from "@/components/ImageMap";
import { SearchNavigation } from "@/components/SearchNavigation";
import navigationData from '@/data/navigationData.json';

// Define Room interface based on navigationData.json structure  
interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
}

const Index = () => {
  const [selectedStart, setSelectedStart] = useState<Room | 'current' | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Room | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const handleRouteCalculate = (start: Room | 'current', end: Room) => {
    setSelectedStart(start);
    setSelectedEnd(end);
    setUseCurrentLocation(start === 'current');
  };

  const handleClear = () => {
    setSelectedStart(null);
    setSelectedEnd(null);
    setUseCurrentLocation(false);
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Search Navigation at the top */}
      <SearchNavigation 
        onRouteCalculate={handleRouteCalculate}
        onClear={handleClear}
      />

      {/* Map - Full screen below search */}
      <main className="flex-1">
        <ImageMap 
          selectedStart={selectedStart === 'current' ? null : selectedStart}
          selectedEnd={selectedEnd}
          useCurrentLocation={useCurrentLocation}
        />
      </main>
    </div>
  );
};

export default Index;