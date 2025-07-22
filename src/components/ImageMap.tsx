import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Navigation, Trash2, Sparkles, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Waypoint {
  id: string;
  name: string;
  x: number; // Pixel coordinates on the image
  y: number;
  type: 'corridor' | 'junction' | 'entrance' | 'room';
}

interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
}

export const ImageMap = () => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isWaypointMode, setIsWaypointMode] = useState(false);
  const [isRoomMode, setIsRoomMode] = useState(false);
  const [newPointName, setNewPointName] = useState('');
  const [selectedStart, setSelectedStart] = useState<Room | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Room | null>(null);
  const [route, setRoute] = useState<Waypoint[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isWaypointMode && newPointName.trim()) {
      const waypoint: Waypoint = {
        id: `wp-${Date.now()}`,
        name: newPointName.trim(),
        x,
        y,
        type: 'corridor'
      };
      setWaypoints(prev => [...prev, waypoint]);
      setNewPointName('');
      toast({ title: `Waypoint "${waypoint.name}" placed` });
    } else if (isRoomMode && newPointName.trim()) {
      const room: Room = {
        id: `room-${Date.now()}`,
        name: newPointName.trim(),
        x,
        y
      };
      setRooms(prev => [...prev, room]);
      setNewPointName('');
      toast({ title: `Room "${room.name}" placed` });
    }
  };

  const selectRoom = (room: Room) => {
    if (!selectedStart) {
      setSelectedStart(room);
      toast({ title: `Start: ${room.name}` });
    } else if (!selectedEnd && room.id !== selectedStart.id) {
      setSelectedEnd(room);
      toast({ title: `Destination: ${room.name}` });
    }
  };

  const calculateRoute = () => {
    if (!selectedStart || !selectedEnd) {
      toast({ title: "Select both start and destination", variant: "destructive" });
      return;
    }

    // Simple pathfinding through waypoints (you can enhance this)
    const startWaypoint = findNearestWaypoint(selectedStart.x, selectedStart.y);
    const endWaypoint = findNearestWaypoint(selectedEnd.x, selectedEnd.y);
    
    if (!startWaypoint || !endWaypoint) {
      toast({ title: "Need more waypoints for routing", variant: "destructive" });
      return;
    }

    // For now, simple route through nearest waypoints
    const routePath = [startWaypoint, endWaypoint];
    setRoute(routePath);
    toast({ title: `Route calculated via ${routePath.length} waypoints` });
  };

  const findNearestWaypoint = (x: number, y: number): Waypoint | null => {
    if (waypoints.length === 0) return null;
    
    let nearest = waypoints[0];
    let minDistance = Math.hypot(x - nearest.x, y - nearest.y);
    
    for (const wp of waypoints) {
      const distance = Math.hypot(x - wp.x, y - wp.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = wp;
      }
    }
    
    return nearest;
  };

  const clearRoute = () => {
    setSelectedStart(null);
    setSelectedEnd(null);
    setRoute([]);
    toast({ title: "Route cleared" });
  };

  const autoGenerateRooms = () => {
    if (rooms.length < 3) {
      toast({ title: "Place at least 3 rooms first to establish patterns", variant: "destructive" });
      return;
    }

    const newRooms = [...rooms];
    const generatedRooms = analyzeAndGenerateRooms(rooms);
    
    generatedRooms.forEach((room, index) => {
      newRooms.push({
        id: `auto-room-${Date.now()}-${index}`,
        name: room.name,
        x: room.x,
        y: room.y
      });
    });

    setRooms(newRooms);
    toast({ title: `Generated ${generatedRooms.length} additional rooms based on your pattern` });
  };

  const analyzeAndGenerateRooms = (existingRooms: Room[]): {name: string, x: number, y: number}[] => {
    const generated: {name: string, x: number, y: number}[] = [];
    
    // Analyze room spacing patterns
    const roomRows = findRoomRows(existingRooms);
    const roomColumns = findRoomColumns(existingRooms);
    
    // Generate rooms along detected rows
    roomRows.forEach((row, rowIndex) => {
      const avgSpacing = calculateAverageSpacing(row.map(r => r.x));
      const y = row[0].y;
      const minX = Math.min(...row.map(r => r.x));
      const maxX = Math.max(...row.map(r => r.x));
      
      // Extend row in both directions
      for (let x = minX - avgSpacing; x > 50; x -= avgSpacing) {
        if (!isNearExistingRoom(x, y, existingRooms)) {
          generated.push({
            name: generateRoomName(x, y, existingRooms),
            x, y
          });
        }
      }
      
      for (let x = maxX + avgSpacing; x < 800; x += avgSpacing) {
        if (!isNearExistingRoom(x, y, existingRooms)) {
          generated.push({
            name: generateRoomName(x, y, existingRooms),
            x, y
          });
        }
      }
      
      // Fill gaps in the row
      for (let i = 0; i < row.length - 1; i++) {
        const gap = row[i + 1].x - row[i].x;
        if (gap > avgSpacing * 1.5) {
          const x = row[i].x + avgSpacing;
          if (!isNearExistingRoom(x, y, existingRooms)) {
            generated.push({
              name: generateRoomName(x, y, existingRooms),
              x, y
            });
          }
        }
      }
    });
    
    // Generate rooms along detected columns
    roomColumns.forEach((column) => {
      const avgSpacing = calculateAverageSpacing(column.map(r => r.y));
      const x = column[0].x;
      const minY = Math.min(...column.map(r => r.y));
      const maxY = Math.max(...column.map(r => r.y));
      
      // Extend column in both directions
      for (let y = minY - avgSpacing; y > 50; y -= avgSpacing) {
        if (!isNearExistingRoom(x, y, existingRooms)) {
          generated.push({
            name: generateRoomName(x, y, existingRooms),
            x, y
          });
        }
      }
      
      for (let y = maxY + avgSpacing; y < 600; y += avgSpacing) {
        if (!isNearExistingRoom(x, y, existingRooms)) {
          generated.push({
            name: generateRoomName(x, y, existingRooms),
            x, y
          });
        }
      }
    });
    
    return generated;
  };

  const findRoomRows = (rooms: Room[]): Room[][] => {
    const tolerance = 25; // pixels
    const rows: Room[][] = [];
    
    rooms.forEach(room => {
      const alignedRooms = rooms.filter(r => 
        Math.abs(r.y - room.y) < tolerance && r.id !== room.id
      );
      
      if (alignedRooms.length > 0) {
        alignedRooms.push(room);
        alignedRooms.sort((a, b) => a.x - b.x);
        
        // Check if this row already exists
        if (!rows.some(row => 
          row.some(r => alignedRooms.some(ar => ar.id === r.id))
        )) {
          rows.push(alignedRooms);
        }
      }
    });
    
    return rows;
  };

  const findRoomColumns = (rooms: Room[]): Room[][] => {
    const tolerance = 25;
    const columns: Room[][] = [];
    
    rooms.forEach(room => {
      const alignedRooms = rooms.filter(r => 
        Math.abs(r.x - room.x) < tolerance && r.id !== room.id
      );
      
      if (alignedRooms.length > 0) {
        alignedRooms.push(room);
        alignedRooms.sort((a, b) => a.y - b.y);
        
        if (!columns.some(column => 
          column.some(r => alignedRooms.some(ar => ar.id === r.id))
        )) {
          columns.push(alignedRooms);
        }
      }
    });
    
    return columns;
  };

  const calculateAverageSpacing = (positions: number[]): number => {
    if (positions.length < 2) return 60; // default spacing
    
    const sortedPositions = [...positions].sort((a, b) => a - b);
    const spacings = [];
    
    for (let i = 1; i < sortedPositions.length; i++) {
      spacings.push(sortedPositions[i] - sortedPositions[i - 1]);
    }
    
    const avgSpacing = spacings.reduce((sum, spacing) => sum + spacing, 0) / spacings.length;
    return Math.max(40, Math.min(100, avgSpacing)); // clamp between 40-100 pixels
  };

  const generateRoomName = (x: number, y: number, existingRooms: Room[]): string => {
    // Try to extract room naming pattern from existing rooms
    const roomNumbers = existingRooms
      .map(r => r.name.match(/\d+/))
      .filter(match => match)
      .map(match => parseInt(match![0]))
      .sort((a, b) => a - b);
    
    if (roomNumbers.length > 0) {
      // Find the next available number in sequence
      let nextNumber = roomNumbers[roomNumbers.length - 1] + 1;
      
      // Check if this number is already used
      while (existingRooms.some(r => r.name.includes(nextNumber.toString()))) {
        nextNumber++;
      }
      
      // Try to detect building prefix pattern
      const buildingPrefixes = existingRooms
        .map(r => r.name.match(/^[A-Z]+/))
        .filter(match => match)
        .map(match => match![0]);
      
      if (buildingPrefixes.length > 0) {
        const commonPrefix = buildingPrefixes[0];
        return `${commonPrefix}${nextNumber}`;
      }
      
      return `Room ${nextNumber}`;
    }
    
    return `Room ${Math.floor(Math.random() * 900) + 100}`;
  };

  const isNearExistingRoom = (x: number, y: number, existing: Room[]): boolean => {
    const minDistance = 35; // pixels
    return existing.some(room => Math.hypot(room.x - x, room.y - y) < minDistance);
  };

  const clearAllRooms = () => {
    setRooms([]);
    setSelectedStart(null);
    setSelectedEnd(null);
    setRoute([]);
    toast({ title: "All rooms cleared" });
  };

  const deleteWaypoint = (id: string) => {
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
    toast({ title: "Waypoint deleted" });
  };

  const deleteRoom = (id: string) => {
    setRooms(prev => prev.filter(room => room.id !== id));
    if (selectedStart?.id === id) setSelectedStart(null);
    if (selectedEnd?.id === id) setSelectedEnd(null);
    toast({ title: "Room deleted" });
  };

  return (
    <div className="w-full h-screen flex bg-background">
      {/* Control Panel */}
      <div className="w-80 p-4 border-r bg-card overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Floor Plan Editor</h2>
        
        {/* Mode Controls */}
        <div className="space-y-3 mb-6">
          <div className="flex gap-2">
            <Button
              variant={isWaypointMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsWaypointMode(!isWaypointMode);
                setIsRoomMode(false);
              }}
            >
              <MapPin className="w-4 h-4 mr-1" />
              Waypoints
            </Button>
            <Button
              variant={isRoomMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsRoomMode(!isRoomMode);
                setIsWaypointMode(false);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Rooms
            </Button>
          </div>
          
          {(isWaypointMode || isRoomMode) && (
            <div className="flex gap-2">
              <Input
                placeholder={`${isWaypointMode ? 'Waypoint' : 'Room'} name`}
                value={newPointName}
                onChange={(e) => setNewPointName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && setNewPointName('')}
              />
            </div>
          )}
        </div>

        {/* Route Controls */}
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold">Navigation</h3>
          {selectedStart && (
            <Badge variant="secondary">Start: {selectedStart.name}</Badge>
          )}
          {selectedEnd && (
            <Badge variant="secondary">End: {selectedEnd.name}</Badge>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={calculateRoute} disabled={!selectedStart || !selectedEnd}>
              <Navigation className="w-4 h-4 mr-1" />
              Route
            </Button>
            <Button size="sm" variant="outline" onClick={clearRoute}>
              Clear
            </Button>
          </div>
        </div>

        {/* Waypoints List */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Waypoints ({waypoints.length})</h3>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {waypoints.map(wp => (
              <div key={wp.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                <span>{wp.name}</span>
                <Button size="sm" variant="ghost" onClick={() => deleteWaypoint(wp.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Rooms List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Rooms ({rooms.length})</h3>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={autoGenerateRooms}
                disabled={rooms.length < 3}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Auto
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={clearAllRooms}
                disabled={rooms.length === 0}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {rooms.map(room => (
              <div key={room.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                <span 
                  className="cursor-pointer hover:text-primary"
                  onClick={() => selectRoom(room)}
                >
                  {room.name}
                </span>
                <Button size="sm" variant="ghost" onClick={() => deleteRoom(room.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floor Plan */}
      <div className="flex-1 relative overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative max-w-full max-h-full">
            <img 
              ref={imageRef}
              src="/school-floorplan.jpg" 
              alt="School Floor Plan"
              className="max-w-full max-h-full object-contain cursor-crosshair"
              onClick={handleImageClick}
              draggable={false}
            />
            
            {/* Waypoints */}
            {waypoints.map(wp => (
              <div
                key={wp.id}
                className="absolute w-3 h-3 bg-orange-500 border-2 border-white rounded-full shadow-lg"
                style={{ left: wp.x - 6, top: wp.y - 6 }}
                title={wp.name}
              />
            ))}
            
            {/* Rooms */}
            {rooms.map(room => (
              <div
                key={room.id}
                className={`absolute w-4 h-4 border-2 border-white rounded-full shadow-lg cursor-pointer ${
                  selectedStart?.id === room.id ? 'bg-green-500' :
                  selectedEnd?.id === room.id ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ left: room.x - 8, top: room.y - 8 }}
                onClick={() => selectRoom(room)}
                title={room.name}
              />
            ))}
            
            {/* Route Line */}
            {route.length > 1 && (
              <svg className="absolute inset-0 pointer-events-none">
                <polyline
                  points={route.map(wp => `${wp.x},${wp.y}`).join(' ')}
                  fill="none"
                  stroke="hsl(214, 84%, 56%)"
                  strokeWidth="3"
                  strokeOpacity="0.8"
                />
              </svg>
            )}
          </div>
        </div>
        
        {/* Instructions */}
        <div className="absolute top-4 left-4 bg-background/95 p-3 rounded border">
          <p className="text-sm text-muted-foreground">
            {isWaypointMode ? 'Click to place corridor waypoints' :
             isRoomMode ? 'Click to place room markers' :
             'Select mode to start placing points'}
          </p>
        </div>
      </div>
    </div>
  );
};