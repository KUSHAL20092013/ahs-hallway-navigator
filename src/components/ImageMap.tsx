import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, ZoomIn, ZoomOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import navigationData from '@/data/navigationData.json';

interface Waypoint {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'corridor' | 'junction' | 'entrance' | 'room' | 'destination';
}

interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface Path {
  id: string;
  waypointA: string;
  waypointB?: string;
  roomB?: string;
}

interface ImageMapProps {
  selectedStart?: Room | null;
  selectedEnd?: Room | null;
  useCurrentLocation?: boolean;
}

export const ImageMap = ({ selectedStart, selectedEnd, useCurrentLocation = false }: ImageMapProps) => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [route, setRoute] = useState<Waypoint[]>([]);
  const [directions, setDirections] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [currentLocation, setCurrentLocation] = useState<{ x: number; y: number } | null>(null);
  const { toast } = useToast();
  const imageRef = useRef<HTMLImageElement>(null);

  // Load navigation data on mount
  useEffect(() => {
    setWaypoints((navigationData.waypoints || []) as Waypoint[]);
    setRooms(navigationData.rooms || []);
    setPaths(navigationData.paths || []);
  }, []);

  // Calculate route when start/end changes
  useEffect(() => {
    if ((selectedStart || useCurrentLocation) && selectedEnd) {
      calculateRoute();
    } else {
      setRoute([]);
      setDirections([]);
    }
  }, [selectedStart, selectedEnd, useCurrentLocation, waypoints, paths, currentLocation]);

  // Get current location
  useEffect(() => {
    if (useCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Convert GPS to map coordinates (simplified)
          const x = 0.5; // Default center position
          const y = 0.5;
          setCurrentLocation({ x, y });
        },
        () => {
          // Fallback to center of map
          setCurrentLocation({ x: 0.5, y: 0.5 });
        }
      );
    }
  }, [useCurrentLocation]);

  const calculateRoute = () => {
    if ((!selectedStart && !useCurrentLocation) || !selectedEnd) return;

    const startPoint = useCurrentLocation && currentLocation 
      ? { ...currentLocation, id: 'current', name: 'Current Location' }
      : selectedStart;

    if (!startPoint) return;

    // Find nearest waypoints
    const startWaypoint = waypoints.reduce((nearest, wp) => {
      const distance = Math.hypot(wp.x - startPoint.x, wp.y - startPoint.y);
      const nearestDistance = Math.hypot(nearest.x - startPoint.x, nearest.y - startPoint.y);
      return distance < nearestDistance ? wp : nearest;
    });

    const endWaypoint = waypoints.reduce((nearest, wp) => {
      const distance = Math.hypot(wp.x - selectedEnd.x, wp.y - selectedEnd.y);
      const nearestDistance = Math.hypot(nearest.x - selectedEnd.x, nearest.y - selectedEnd.y);
      return distance < nearestDistance ? wp : nearest;
    });

    // Find path between waypoints
    const path = findOptimalPath(startWaypoint, endWaypoint);
    
    if (path.length === 0) return;

    // Build complete route
    const fullRoute = [];
    
    // Add start point
    if (useCurrentLocation && currentLocation) {
      fullRoute.push({
        id: 'current',
        name: 'Current Location',
        x: currentLocation.x,
        y: currentLocation.y,
        type: 'room' as const
      });
    } else if (selectedStart) {
      fullRoute.push({
        id: selectedStart.id,
        name: selectedStart.name,
        x: selectedStart.x,
        y: selectedStart.y,
        type: 'room' as const
      });
    }
    
    // Add path
    fullRoute.push(...path);
    
    // Add destination
    fullRoute.push({
      id: selectedEnd.id,
      name: selectedEnd.name,
      x: selectedEnd.x,
      y: selectedEnd.y,
      type: 'destination' as const
    });

    setRoute(fullRoute);
    setDirections(calculateDirections(fullRoute));
  };

  const findOptimalPath = (start: Waypoint, end: Waypoint): Waypoint[] => {
    if (start.id === end.id) return [start];
    
    // Build graph
    const graph = new Map<string, Waypoint[]>();
    waypoints.forEach(wp => graph.set(wp.id, []));
    
    paths.forEach(path => {
      const waypointA = waypoints.find(wp => wp.id === path.waypointA);
      if (path.waypointB) {
        const waypointB = waypoints.find(wp => wp.id === path.waypointB);
        if (waypointA && waypointB) {
          graph.get(path.waypointA)!.push(waypointB);
          graph.get(path.waypointB)!.push(waypointA);
        }
      }
    });
    
    // Simple BFS pathfinding
    const queue = [start];
    const visited = new Set([start.id]);
    const parent = new Map<string, Waypoint>();
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.id === end.id) {
        // Reconstruct path
        const path = [end];
        let currentId = end.id;
        while (parent.has(currentId)) {
          const parentWp = parent.get(currentId)!;
          path.unshift(parentWp);
          currentId = parentWp.id;
        }
        return path;
      }
      
      const neighbors = graph.get(current.id) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          parent.set(neighbor.id, current);
          queue.push(neighbor);
        }
      }
    }
    
    return [];
  };

  const calculateDirections = (route: Waypoint[]): string[] => {
    const directions = [];
    
    for (let i = 0; i < route.length - 1; i++) {
      const current = route[i];
      const next = route[i + 1];
      
      if (i === 0) {
        directions.push(`Start at ${current.name}`);
      }
      
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const distance = Math.sqrt(dx * dx + dy * dy) * 100; // Approximate distance
      
      let direction = '';
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'east' : 'west';
      } else {
        direction = dy > 0 ? 'south' : 'north';
      }
      
      directions.push(`Go ${direction} to ${next.name} (${Math.round(distance)}m)`);
    }
    
    if (route.length > 0) {
      directions.push(`Arrive at ${route[route.length - 1].name}`);
    }
    
    return directions;
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    if (useCurrentLocation) {
      setCurrentLocation({ x, y });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 overflow-hidden">
        <div 
          className="relative h-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          <img
            ref={imageRef}
            src="/school-floorplan.jpg"
            alt="School Floor Plan"
            className="w-full h-full object-contain cursor-crosshair"
            onClick={handleImageClick}
            draggable={false}
          />
          
          {/* Rooms */}
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`absolute w-3 h-3 rounded-full border-2 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                selectedStart?.id === room.id ? 'bg-green-500 border-green-700' :
                selectedEnd?.id === room.id ? 'bg-red-500 border-red-700' :
                'bg-blue-500 border-blue-700'
              }`}
              style={{
                left: `${room.x * 100}%`,
                top: `${room.y * 100}%`,
              }}
            >
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                {room.name}
              </div>
            </div>
          ))}

          {/* Current location */}
          {currentLocation && (
            <div
              className="absolute w-4 h-4 bg-purple-500 border-2 border-purple-700 rounded-full transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${currentLocation.x * 100}%`,
                top: `${currentLocation.y * 100}%`,
              }}
            >
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap">
                Current Location
              </div>
            </div>
          )}

          {/* Route line */}
          {route.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {route.slice(0, -1).map((point, index) => {
                const next = route[index + 1];
                return (
                  <line
                    key={`${point.id}-${next.id}`}
                    x1={`${point.x * 100}%`}
                    y1={`${point.y * 100}%`}
                    x2={`${next.x * 100}%`}
                    y2={`${next.y * 100}%`}
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                  />
                );
              })}
            </svg>
          )}
        </div>

        {/* Zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation directions - Fixed at bottom */}
      {directions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 p-4 max-h-48 overflow-y-auto z-50">
          <div className="flex items-center gap-2 mb-3">
            <Navigation className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Navigation Directions</h3>
            <Badge variant="secondary" className="ml-auto">
              {directions.length} steps
            </Badge>
          </div>
          <div className="space-y-2">
            {directions.map((direction, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </span>
                <span>{direction}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};