// This is the class which filters rooms based on what the user first types. It also includes the initial current location option which users see when they first load the app. 
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import navigationData from '@/data/navigationData.json';
import { MapPin, Navigation, RotateCcw, Search } from 'lucide-react';

// Define Room interface based on navigationData.json structure
interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface SearchNavigationProps {
  onRouteCalculate: (start: Room | 'current', end: Room) => void;
  onClear: () => void;
}

export function SearchNavigation({ onRouteCalculate, onClear }: SearchNavigationProps) {
  // Get rooms from navigationData.json
  const rooms = navigationData.rooms || [];
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [startSuggestions, setStartSuggestions] = useState<Room[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<Room[]>([]);
  const [selectedStart, setSelectedStart] = useState<Room | 'current' | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Room | null>(null);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);

  const handleStartSearch = (value: string) => {
    setStartInput(value);
    if (value.length > 0) {
      const filtered = rooms.filter(room => 
        room.name.toLowerCase().includes(value.toLowerCase()) ||
        room.id.toLowerCase().includes(value.toLowerCase())
      );
      setStartSuggestions(filtered);
      setShowStartSuggestions(true);
    } else {
      setStartSuggestions([]);
      setShowStartSuggestions(false);
    }
  };

  const handleEndSearch = (value: string) => {
    setEndInput(value);
    if (value.length > 0) {
      const filtered = rooms.filter(room => 
        room.name.toLowerCase().includes(value.toLowerCase()) ||
        room.id.toLowerCase().includes(value.toLowerCase())
      );
      setEndSuggestions(filtered);
      setShowEndSuggestions(true);
    } else {
      setEndSuggestions([]);
      setShowEndSuggestions(false);
    }
  };

  const selectStart = (selection: Room | 'current') => {
    setSelectedStart(selection);
    setStartInput(selection === 'current' ? 'Current Location' : selection.name);
    setShowStartSuggestions(false);
  };

  const selectEnd = (room: Room) => {
    setSelectedEnd(room);
    setEndInput(room.name);
    setShowEndSuggestions(false);
  };

  const handleNavigate = () => {
    if (selectedStart && selectedEnd) {
      onRouteCalculate(selectedStart, selectedEnd);
    }
  };

  const handleClear = () => {
    setStartInput('');
    setEndInput('');
    setSelectedStart(null);
    setSelectedEnd(null);
    setShowStartSuggestions(false);
    setShowEndSuggestions(false);
    onClear();
  };

  const showCurrentLocationOption = startInput.toLowerCase().includes('current') || startInput.toLowerCase().includes('location') || startInput === '';

  return (
    <div className="bg-card border-b border-border/50 p-4 space-y-3">
      {/* Start Location */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="From: Search or use current location..."
            value={startInput}
            onChange={(e) => handleStartSearch(e.target.value)}
            className="pl-10 h-12 text-base border-border/50"
          />
        </div>
        {(showStartSuggestions || (startInput === '' && !selectedStart)) && (startSuggestions.length > 0 || showCurrentLocationOption) && (
          <div className="absolute top-full left-0 right-0 bg-card border border-border/50 rounded-md mt-1 max-h-40 overflow-y-auto z-50 shadow-lg">
            {showCurrentLocationOption && (
              <button
                onClick={() => selectStart('current')}
                className="w-full text-left px-3 py-2 hover:bg-accent/50 border-b border-border/30 flex items-center gap-2"
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span>Current Location</span>
              </button>
            )}
            {startSuggestions.map((room) => (
              <button
                key={room.id}
                onClick={() => selectStart(room)}
                className="w-full text-left px-3 py-2 hover:bg-accent/50 border-b border-border/30 last:border-b-0 flex items-center gap-2"
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span>{room.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* End Location */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="To: Search destination..."
            value={endInput}
            onChange={(e) => handleEndSearch(e.target.value)}
            className="pl-10 h-12 text-base border-border/50"
          />
        </div>
        {showEndSuggestions && endSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-card border border-border/50 rounded-md mt-1 max-h-40 overflow-y-auto z-50 shadow-lg">
            {endSuggestions.map((room) => (
              <button
                key={room.id}
                onClick={() => selectEnd(room)}
                className="w-full text-left px-3 py-2 hover:bg-accent/50 border-b border-border/30 last:border-b-0 flex items-center gap-2"
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span>{room.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={handleNavigate}
          disabled={!selectedStart || !selectedEnd}
          className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Navigate
        </Button>
        <Button 
          variant="outline"
          onClick={handleClear}
          className="h-12 px-4"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
