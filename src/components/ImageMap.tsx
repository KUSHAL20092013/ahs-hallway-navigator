// Summary: We initialize everything on the map such as the waypoints, rooms, paths, and the image itself. This includes adding the x and y coordinates to the json file called
// navigationData.json. Constructing the path also happens here. Current location code is here too so it asks user for permission, then maps the geolocation coordinates to the
// image pixel coordinates to create a box area of coordinates. by comparing the scale value of the image coordinates and the geopositioning coordinates, the function
// estimates how far the user has to walk. 
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, ZoomIn, ZoomOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHybridPositioning } from '@/hooks/useHybridPositioning';
import { gpsPositioning } from '@/services/gpsPositioning';
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
  const [isLocating, setIsLocating] = useState(false);
  const [locationTracking, setLocationTracking] = useState<NodeJS.Timeout | null>(null);
  const [lastRouteCheck, setLastRouteCheck] = useState<{ x: number; y: number } | null>(null);
  const { toast } = useToast();
  const { scanPosition, currentPosition, config, startContinuousScanning } = useHybridPositioning();
  const imageRef = useRef<HTMLImageElement>(null);

  // Load navigation data on mount
  useEffect(() => {
    setWaypoints((navigationData.waypoints || []) as Waypoint[]);
    setRooms(navigationData.rooms || []);
    setPaths(navigationData.paths || []);
  }, []);

  // Calculate route when start/end changes or when current location moves significantly
  useEffect(() => {
    if ((selectedStart || useCurrentLocation) && selectedEnd) {
      calculateRoute();
    } else {
      setRoute([]);
      setDirections([]);
    }
  }, [selectedStart, selectedEnd, useCurrentLocation, waypoints, paths, currentLocation]);

  // Check if user is off route and recalculate if needed
  useEffect(() => {
    if (useCurrentLocation && currentLocation && route.length > 0 && lastRouteCheck) {
      const distanceMoved = Math.hypot(
        currentLocation.x - lastRouteCheck.x,
        currentLocation.y - lastRouteCheck.y
      );
      
      // If user moved more than 5% of map width/height, check if they're off route
      if (distanceMoved > 0.05) {
        const isOffRoute = !isNearRoute(currentLocation, route, 0.03); // 3% tolerance
        if (isOffRoute) {
          toast({
            title: "Route updated",
            description: "You've moved off the planned route. Recalculating...",
          });
          calculateRoute();
        }
        setLastRouteCheck(currentLocation);
      }
    } else if (currentLocation && !lastRouteCheck) {
      setLastRouteCheck(currentLocation);
    }
  }, [currentLocation, route, useCurrentLocation]);

  // Start continuous location tracking when useCurrentLocation is enabled
  useEffect(() => {
    if (useCurrentLocation) {
      getCurrentLocation();
      // Start continuous tracking every 3 seconds
      const trackingInterval = setInterval(() => {
        getCurrentLocation();
      }, 3000);
      setLocationTracking(trackingInterval);
    } else {
      // Stop tracking when disabled
      if (locationTracking) {
        clearInterval(locationTracking);
        setLocationTracking(null);
      }
    }

    // Cleanup on unmount or when useCurrentLocation changes
    return () => {
      if (locationTracking) {
        clearInterval(locationTracking);
      }
    };
  }, [useCurrentLocation]);

  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      // Try hybrid positioning first (WiFi + GPS)
      let position = await scanPosition();
      
      // If hybrid positioning fails, try GPS only
      if (!position) {
        position = await gpsPositioning.getCurrentPosition();
      }
      
      // If GPS fails, try browser geolocation as fallback
      if (!position && navigator.geolocation) {
        try {
          const geoPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 30000
            });
          });
          
          position = {
            coordinates: [geoPosition.coords.longitude, geoPosition.coords.latitude],
            accuracy: Math.min(geoPosition.coords.accuracy || 100, 100) / 100,
            method: 'gps'
          };
        } catch (error) {
          console.warn('Browser geolocation failed:', error);
        }
      }
      
      if (position) {
        // Convert GPS coordinates to map pixel coordinates
        const mapCoords = convertGPSToMapCoordinates(position.coordinates);
        if (mapCoords) {
          setCurrentLocation(mapCoords);
          
          toast({
            title: "Location found",
            description: `Located using ${position.method} (accuracy: ${Math.round(position.accuracy * 100)}%)`,
          });
        } else {
          setCurrentLocation(null);
        }
      } else {
        // Fallback to manual selection
        toast({
          title: "Location not available",
          description: "Please tap on the map to set your current location manually",
          variant: "destructive"
        });
        setCurrentLocation(null);
      }
    } catch (error) {
      console.error('Location error:', error);
      toast({
        title: "Location error",
        description: "Could not determine your location. Please tap on the map to set it manually.",
        variant: "destructive"
      });
      setCurrentLocation(null);
    } finally {
      setIsLocating(false);
    }
  };

  // Campus boundaries
  const CAMPUS_BOUNDS = {
    north: 37.566092,
    south: 37.562864,
    east: -122.013955,
    west: -122.018535
  };

  // Check if coordinates are within campus bounds
  const isWithinCampus = (coordinates: [number, number]): boolean => {
    const [longitude, latitude] = coordinates;
    return latitude >= CAMPUS_BOUNDS.south && 
           latitude <= CAMPUS_BOUNDS.north && 
           longitude >= CAMPUS_BOUNDS.west && 
           longitude <= CAMPUS_BOUNDS.east;
  };

  // Convert GPS coordinates to map pixel coordinates
  const convertGPSToMapCoordinates = (coordinates: [number, number]): { x: number; y: number } | null => {
    const [longitude, latitude] = coordinates;
    
    // Check if within campus bounds first
    if (!isWithinCampus(coordinates)) {
      toast({
        title: "Location unavailable",
        description: `This function only works on campus. Current coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        variant: "destructive"
      });
      return null;
    }
    
    // Convert GPS to normalized coordinates (0-1) using campus bounds
    const x = (longitude - CAMPUS_BOUNDS.west) / (CAMPUS_BOUNDS.east - CAMPUS_BOUNDS.west);
    const y = (latitude - CAMPUS_BOUNDS.south) / (CAMPUS_BOUNDS.north - CAMPUS_BOUNDS.south);
    
    // Invert Y axis (image coordinates start from top)
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, 1 - y))
    };
  };

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
    
    // Build graph based on where each waypoint is and wherre each room is
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
    
    // Simple breadth-first-search (BFS) pathfinding algorithm is executed to find the closest path between two points using the waypoints given. 
    const queue = [start];
    const visited = new Set([start.id]);
    const parent = new Map<string, Waypoint>();
    
    while (queue.length > 0) {
      const current = queue.shift()!; // here current means the current room we are starting from. 
      
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
      
      const neighbors = graph.get(current.id) || []; // here neighbor is all the surrounding waypoints or nodes in a radius. 
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

  //function to calculate directions using natural language
  const calculateDirections = (route: Waypoint[]): string[] => {
    const directions = [];
    
    if (route.length === 0) return directions;
    
    // Start instruction
    directions.push(`Start here and head toward ${route.length > 1 ? getDestinationName(route[route.length - 1]) : 'your destination'}`);
    
    for (let i = 1; i < route.length - 1; i++) {
      const prev = route[i - 1];
      const current = route[i];
      const next = route[i + 1];
      
      const turnDirection = getTurnDirection(prev, current, next);
      const distance = Math.sqrt(Math.pow((current.x - prev.x) * 100, 2) + Math.pow((current.y - prev.y) * 100, 2));
      
      if (turnDirection !== 'straight') {
        directions.push(`In ${Math.round(distance)}m, ${turnDirection}`);
      } else {
        directions.push(`Continue straight for ${Math.round(distance)}m`);
      }
    }
    
    if (route.length > 1) {
      const secondToLast = route[route.length - 2];
      const destination = route[route.length - 1];
      const finalDistance = Math.sqrt(Math.pow((destination.x - secondToLast.x) * 100, 2) + Math.pow((destination.y - secondToLast.y) * 100, 2));
      directions.push(`Continue ${Math.round(finalDistance)}m to arrive at ${getDestinationName(destination)}`);
    }
    
    return directions;
  };

  // Helper function to get natural destination name
  const getDestinationName = (waypoint: Waypoint): string => {
    if (waypoint.name.toLowerCase().includes('room')) return waypoint.name;
    if (waypoint.name.toLowerCase().includes('entrance')) return 'the entrance';
    if (waypoint.name.toLowerCase().includes('hallway')) return 'the hallway';
    return waypoint.name;
  };

  // Helper function to determine turn direction using angle calculation
  const getTurnDirection = (prev: Waypoint, current: Waypoint, next: Waypoint): string => {
    // Calculate angle between the three points
    const angle1 = Math.atan2(current.y - prev.y, current.x - prev.x);
    const angle2 = Math.atan2(next.y - current.y, next.x - current.x);
    
    let angleDiff = angle2 - angle1;
    
    // Normalize angle to [-π, π]
    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    const degrees = (angleDiff * 180) / Math.PI;
    
    if (Math.abs(degrees) < 15) return 'straight';
    if (degrees > 15 && degrees < 45) return 'take a slight right';
    if (degrees >= 45 && degrees < 135) return 'turn right';
    if (degrees >= 135) return 'turn sharply right';
    if (degrees < -15 && degrees > -45) return 'take a slight left';
    if (degrees <= -45 && degrees > -135) return 'turn left';
    if (degrees <= -135) return 'turn sharply left';
    
    return 'continue';
  };

  // Check if user is near a turn waypoint and show real-time directions
  useEffect(() => {
    if (!currentLocation || !useCurrentLocation || route.length < 3) return;

    const proximityThreshold = 0.04; // 4% of map size
    
    // Check if near any waypoint that requires a turn
    for (let i = 1; i < route.length - 1; i++) {
      const prev = route[i - 1];
      const current = route[i];
      const next = route[i + 1];
      
      const distance = Math.hypot(
        currentLocation.x - current.x,
        currentLocation.y - current.y
      );
      
      if (distance < proximityThreshold) {
        const turnDirection = getTurnDirection(prev, current, next);
        
        if (turnDirection !== 'straight' && turnDirection !== 'continue') {
          toast({
            title: "Navigation",
            description: `${turnDirection.charAt(0).toUpperCase() + turnDirection.slice(1)} now`,
            duration: 3000,
          });
        }
        break; // Only show one turn instruction at a time
      }
    }
  }, [currentLocation, route, useCurrentLocation]);

  // Helper function to check if user is near the planned route
  const isNearRoute = (position: { x: number; y: number }, route: Waypoint[], tolerance: number): boolean => {
    if (route.length < 2) return true;
    
    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i];
      const end = route[i + 1];
      
      // Calculate distance from point to line segment
      const distanceToSegment = distancePointToLineSegment(position, start, end);
      if (distanceToSegment <= tolerance) {
        return true;
      }
    }
    return false;
  };

  // Helper function to calculate distance from point to line segment
  const distancePointToLineSegment = (
    point: { x: number; y: number },
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): number => {
    const A = point.x - start.x;
    const B = point.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    let param = dot / lenSq;
    if (param < 0) param = 0;
    if (param > 1) param = 1;

    const xx = start.x + param * C;
    const yy = start.y + param * D;

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    if (useCurrentLocation) {
      setCurrentLocation({ x, y });
      setLastRouteCheck({ x, y });
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

          {/* Current location - Always visible when tracking */}
          {currentLocation && (
            <div
              className="absolute w-4 h-4 bg-purple-500 border-2 border-purple-700 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{
                left: `${currentLocation.x * 100}%`,
                top: `${currentLocation.y * 100}%`,
                boxShadow: '0 0 10px rgba(147, 51, 234, 0.6)'
              }}
            >
              {/* Pulse animation ring */}
              <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping"></div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-purple-900/90 text-white text-xs rounded whitespace-nowrap">
                You are here
              </div>
            </div>
          )}
          
          {/* Loading indicator for location */}
          {isLocating && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/80 text-white px-3 py-2 rounded-lg">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Finding your location...</span>
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

        {/* Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {useCurrentLocation && (
            <Button
              size="sm"
              variant="secondary"
              onClick={getCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              {isLocating ? 'Locating...' : 'Refresh Location'}
            </Button>
          )}
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
