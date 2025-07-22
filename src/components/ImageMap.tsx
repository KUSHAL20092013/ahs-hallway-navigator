
import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NavigationButton } from '@/components/ui/navigation-button';
import { MapPin, Navigation, Search, Zap, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  coordinates: [number, number]; // x, y coordinates on the image (percentages)
  type: 'classroom' | 'lab' | 'office' | 'facility';
}

// Sample room data extracted from the floor plan
const schoolRooms: Room[] = [
  // Building 1 Level 1
  { id: '101', name: 'Room 101', building: 'Building 1', floor: 1, coordinates: [25, 45], type: 'classroom' },
  { id: '102', name: 'Room 102', building: 'Building 1', floor: 1, coordinates: [30, 45], type: 'classroom' },
  { id: '103', name: 'Room 103', building: 'Building 1', floor: 1, coordinates: [35, 45], type: 'classroom' },
  
  // Building 1 Level 2
  { id: '201', name: 'Room 201', building: 'Building 1', floor: 2, coordinates: [25, 35], type: 'classroom' },
  { id: '202', name: 'Room 202', building: 'Building 1', floor: 2, coordinates: [30, 35], type: 'classroom' },
  
  // Building 2 Level 1
  { id: '301', name: 'Room 301', building: 'Building 2', floor: 1, coordinates: [65, 45], type: 'classroom' },
  { id: '302', name: 'Room 302', building: 'Building 2', floor: 1, coordinates: [70, 45], type: 'classroom' },
  
  // 700s Wing
  { id: '701', name: 'Room 701', building: 'Main', floor: 1, coordinates: [45, 25], type: 'classroom' },
  { id: '702', name: 'Room 702', building: 'Main', floor: 1, coordinates: [50, 25], type: 'classroom' },
  { id: '703', name: 'Room 703', building: 'Main', floor: 1, coordinates: [55, 25], type: 'classroom' },
  
  // Special Facilities
  { id: 'POOL', name: 'Swimming Pool', building: 'Athletics', floor: 1, coordinates: [80, 60], type: 'facility' },
  { id: 'THEATRE', name: 'Theatre', building: 'Arts', floor: 1, coordinates: [20, 60], type: 'facility' },
  { id: 'LIBRARY', name: 'Library', building: 'Main', floor: 1, coordinates: [45, 50], type: 'facility' },
  { id: 'GYM', name: 'Gymnasium', building: 'Athletics', floor: 1, coordinates: [85, 45], type: 'facility' },
  { id: 'LAB1', name: 'Science Lab', building: 'Main', floor: 1, coordinates: [40, 35], type: 'lab' },
  { id: 'CAFE', name: 'Cafeteria', building: 'Main', floor: 1, coordinates: [50, 55], type: 'facility' },
];

export const ImageMap = () => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedStart, setSelectedStart] = useState<Room | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Room | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentRoute, setCurrentRoute] = useState<any>(null);

  useEffect(() => {
    if (searchQuery) {
      const filtered = schoolRooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.building.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRooms(filtered);
    } else {
      setFilteredRooms([]);
    }
  }, [searchQuery]);

  const getRoomColor = (type: Room['type']) => {
    switch (type) {
      case 'classroom': return 'hsl(214, 84%, 56%)';
      case 'lab': return 'hsl(43, 96%, 56%)';
      case 'office': return 'hsl(142, 76%, 36%)';
      case 'facility': return 'hsl(0, 84%, 60%)';
      default: return 'hsl(214, 84%, 56%)';
    }
  };

  const handleRoomClick = (room: Room) => {
    if (!selectedStart) {
      setSelectedStart(room);
      toast.success(`Starting point set: ${room.name}`);
    } else if (!selectedEnd && room.id !== selectedStart.id) {
      setSelectedEnd(room);
      toast.success(`Destination set: ${room.name}`);
    }
  };

  const calculateRoute = () => {
    if (!selectedStart || !selectedEnd) {
      toast.error('Please select both starting point and destination');
      return;
    }

    // Simple distance calculation for demo
    const distance = Math.sqrt(
      Math.pow(selectedEnd.coordinates[0] - selectedStart.coordinates[0], 2) +
      Math.pow(selectedEnd.coordinates[1] - selectedStart.coordinates[1], 2)
    );

    const route = {
      distance: distance * 10, // Approximate meters
      duration: Math.ceil(distance * 2), // Approximate seconds
      start: selectedStart,
      end: selectedEnd
    };

    setCurrentRoute(route);
    toast.success(`Route calculated! ${Math.round(route.distance)}m, ${route.duration}s walking`);
  };

  const clearRoute = () => {
    setSelectedStart(null);
    setSelectedEnd(null);
    setCurrentRoute(null);
    toast.success('Route cleared');
  };

  const selectRoom = (room: Room) => {
    handleRoomClick(room);
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative w-full h-screen bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-bold text-foreground">American High School</h1>
            <p className="text-sm text-muted-foreground">Navigation System</p>
          </div>
          <NavigationButton
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="w-5 h-5" />
          </NavigationButton>
        </div>
        
        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search rooms, buildings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {filteredRooms.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto z-20">
                  {filteredRooms.map(room => (
                    <div
                      key={room.id}
                      className="p-3 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                      onClick={() => selectRoom(room)}
                    >
                      <div className="font-medium text-foreground">{room.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {room.id} • {room.building} • Floor {room.floor}
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <img
            ref={imageRef}
            src="/placeholder.svg"
            alt="American High School Floor Plan"
            className="w-full h-auto select-none"
            draggable={false}
          />
          
          {/* Room Markers */}
          {schoolRooms.map(room => (
            <div
              key={room.id}
              className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
              style={{
                left: `${room.coordinates[0]}%`,
                top: `${room.coordinates[1]}%`,
              }}
              onClick={() => handleRoomClick(room)}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: getRoomColor(room.type) }}
              />
              <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm text-xs px-2 py-1 rounded border text-foreground whitespace-nowrap">
                {room.name}
              </div>
            </div>
          ))}

          {/* Route Line */}
          {selectedStart && selectedEnd && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line
                x1={`${selectedStart.coordinates[0]}%`}
                y1={`${selectedStart.coordinates[1]}%`}
                x2={`${selectedEnd.coordinates[0]}%`}
                y2={`${selectedEnd.coordinates[1]}%`}
                stroke="hsl(214, 84%, 56%)"
                strokeWidth="3"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-32 right-4 z-10 flex flex-col gap-2">
        <NavigationButton variant="outline" size="icon" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </NavigationButton>
        <NavigationButton variant="outline" size="icon" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </NavigationButton>
      </div>

      {/* Route Info */}
      {(selectedStart || selectedEnd) && (
        <Card className="absolute top-32 left-4 right-20 z-10 p-4">
          <div className="space-y-3">
            {selectedStart && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <div>
                  <div className="font-medium text-foreground">{selectedStart.name}</div>
                  <div className="text-sm text-muted-foreground">Starting point</div>
                </div>
              </div>
            )}
            
            {selectedEnd && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-destructive"></div>
                <div>
                  <div className="font-medium text-foreground">{selectedEnd.name}</div>
                  <div className="text-sm text-muted-foreground">Destination</div>
                </div>
              </div>
            )}

            {currentRoute && (
              <div className="pt-2 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Distance: {Math.round(currentRoute.distance)}m • 
                  ETA: {currentRoute.duration}s walking
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-t border-border p-4">
        <div className="flex gap-3">
          <NavigationButton
            onClick={calculateRoute}
            disabled={!selectedStart || !selectedEnd}
            className="flex-1"
            variant="default"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Get Directions
          </NavigationButton>
          
          {(selectedStart || selectedEnd) && (
            <NavigationButton
              onClick={clearRoute}
              variant="outline"
              size="icon"
            >
              <Zap className="w-4 h-4" />
            </NavigationButton>
          )}
        </div>
      </div>

      {/* Legend */}
      <Card className="absolute bottom-24 right-4 z-10 p-3">
        <div className="text-xs font-medium text-foreground mb-2">Room Types</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-muted-foreground">Classroom</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent"></div>
            <span className="text-muted-foreground">Lab</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span className="text-muted-foreground">Office</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive"></div>
            <span className="text-muted-foreground">Facility</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
