import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MapPin, Navigation, Search, Target } from 'lucide-react';
import { searchRooms, schoolRooms } from '@/data/schoolRooms';
import type { Room } from '@/hooks/useSchoolNavigation';
import { useToast } from '@/hooks/use-toast';

interface SearchNavigationProps {
  onStartSelect: (room: Room | 'current') => void;
  onEndSelect: (room: Room) => void;
  onNavigate: () => void;
  selectedStart: Room | null;
  selectedEnd: Room | null;
  currentLocationAvailable: boolean;
}

export const SearchNavigation: React.FC<SearchNavigationProps> = ({
  onStartSelect,
  onEndSelect,
  onNavigate,
  selectedStart,
  selectedEnd,
  currentLocationAvailable
}) => {
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [startSuggestions, setStartSuggestions] = useState<Room[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<Room[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  const [activeStep, setActiveStep] = useState<'start' | 'end'>('start');
  const { toast } = useToast();

  useEffect(() => {
    if (startQuery.trim()) {
      const results = searchRooms(startQuery).slice(0, 5);
      setStartSuggestions(results);
      setShowStartSuggestions(true);
    } else {
      setStartSuggestions([]);
      setShowStartSuggestions(false);
    }
  }, [startQuery]);

  useEffect(() => {
    if (endQuery.trim()) {
      const results = searchRooms(endQuery).slice(0, 5);
      setEndSuggestions(results);
      setShowEndSuggestions(true);
    } else {
      setEndSuggestions([]);
      setShowEndSuggestions(false);
    }
  }, [endQuery]);

  const handleStartSelect = (room: Room | 'current') => {
    if (room === 'current') {
      setStartQuery('Current Location');
      onStartSelect('current');
    } else {
      setStartQuery(room.name);
      onStartSelect(room);
    }
    setShowStartSuggestions(false);
    setActiveStep('end');
  };

  const handleEndSelect = (room: Room) => {
    setEndQuery(room.name);
    onEndSelect(room);
    setShowEndSuggestions(false);
  };

  const handleNavigate = () => {
    if (!selectedStart && !currentLocationAvailable) {
      toast({ title: "Please select a starting point", variant: "destructive" });
      return;
    }
    if (!selectedEnd) {
      toast({ title: "Please select a destination", variant: "destructive" });
      return;
    }
    onNavigate();
  };

  const clearSelection = () => {
    setStartQuery('');
    setEndQuery('');
    setActiveStep('start');
    setShowStartSuggestions(false);
    setShowEndSuggestions(false);
  };

  return (
    <div className="space-y-3">
      {/* Start Location Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder={activeStep === 'start' ? "Starting point..." : "Choose starting point"}
            value={startQuery}
            onChange={(e) => setStartQuery(e.target.value)}
            onFocus={() => setActiveStep('start')}
            className="pl-10 pr-4 h-12 text-base border-2 focus:border-primary"
          />
          {selectedStart && (
            <Badge variant="secondary" className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <MapPin className="h-3 w-3 mr-1" />
              Start
            </Badge>
          )}
        </div>

        {/* Start Suggestions */}
        {showStartSuggestions && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto shadow-lg">
            <div className="p-2 space-y-1">
              {currentLocationAvailable && (
                <button
                  onClick={() => handleStartSelect('current')}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3"
                >
                  <Target className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium">Current Location</div>
                    <div className="text-sm text-muted-foreground">Use GPS location</div>
                  </div>
                </button>
              )}
              {startSuggestions.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleStartSelect(room)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="font-medium">{room.name}</div>
                  <div className="text-sm text-muted-foreground">{room.building}</div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* End Location Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder={activeStep === 'end' ? "Where to?" : "Choose destination"}
            value={endQuery}
            onChange={(e) => setEndQuery(e.target.value)}
            onFocus={() => setActiveStep('end')}
            className="pl-10 pr-4 h-12 text-base border-2 focus:border-primary"
            disabled={!selectedStart}
          />
          {selectedEnd && (
            <Badge variant="default" className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <MapPin className="h-3 w-3 mr-1" />
              End
            </Badge>
          )}
        </div>

        {/* End Suggestions */}
        {showEndSuggestions && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto shadow-lg">
            <div className="p-2 space-y-1">
              {endSuggestions.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleEndSelect(room)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="font-medium">{room.name}</div>
                  <div className="text-sm text-muted-foreground">{room.building}</div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex gap-2">
        <Button
          onClick={handleNavigate}
          disabled={!selectedStart || !selectedEnd}
          className="flex-1 h-12 text-base font-medium bg-primary hover:bg-primary-hover"
        >
          <Navigation className="h-4 w-4 mr-2" />
          Get Directions
        </Button>
        {(selectedStart || selectedEnd) && (
          <Button
            onClick={clearSelection}
            variant="outline"
            className="h-12 px-4"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};