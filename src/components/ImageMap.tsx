import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import navigationData from '@/data/navigationData.json';
import { gpsPositioning } from '@/services/gpsPositioning';
import type { WiFiPositionResult } from '@/types/wifi';
import { schoolRooms } from '@/data/schoolRooms';

interface Waypoint {
  id: string;
  name: string;
  x: number; // Percentage of natural image width (0-1)
  y: number; // Percentage of natural image height (0-1)
  type: 'corridor' | 'junction' | 'entrance' | 'room' | 'destination';
}

interface Room {
  id: string;
  name: string;
  x: number; // Percentage of natural image width (0-1)
  y: number; // Percentage of natural image height (0-1)
}

interface Path {
  id: string;
  waypointA: string; // waypoint ID
  waypointB?: string; // waypoint ID (optional for waypoint-to-room paths)
  roomB?: string; // room ID (optional for waypoint-to-room paths)
}

interface ExternalRoom {
  id: string;
  name: string;
  building: string;
  floor: number;
  coordinates: [number, number];
  type: string;
}

interface ImageMapProps {
  selectedStart?: ExternalRoom | null;
  selectedEnd?: ExternalRoom | null;
  useCurrentLocation?: boolean;
}

export const ImageMap: React.FC<ImageMapProps> = ({ 
  selectedStart, 
  selectedEnd, 
  useCurrentLocation = false 
}) => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [route, setRoute] = useState<Waypoint[]>([]);
  const [directions, setDirections] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [currentLocation, setCurrentLocation] = useState<{ x: number; y: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  // Load navigation data on component mount
  useEffect(() => {
    setWaypoints((navigationData.waypoints || []) as Waypoint[]);
    setRooms(navigationData.rooms || []);
    setPaths(navigationData.paths || []);
  }, []);

  // GPS corner coordinates for the map
  const mapCorners = {
    topLeft: { lat: 37.566092, lng: -122.017120 },
    topRight: { lat: 37.564643, lng: -122.013955 },
    bottomLeft: { lat: 37.564194, lng: -122.018535 },
    bottomRight: { lat: 37.562864, lng: -122.016039 }
  };

  // Calculate real-world dimensions of the map
  const calculateMapDimensions = () => {
    const { topLeft, topRight, bottomLeft, bottomRight } = mapCorners;
    
    // Calculate approximate distances using GPS coordinates
    // 1 degree latitude ≈ 364,000 feet
    // 1 degree longitude ≈ 364,000 * cos(latitude) feet
    const avgLatitude = (topLeft.lat + topRight.lat + bottomLeft.lat + bottomRight.lat) / 4;
    const cosLatitude = Math.cos(avgLatitude * Math.PI / 180);
    
    // Map height (latitude difference)
    const latDiff = topLeft.lat - bottomLeft.lat;
    const mapHeightFeet = latDiff * 364000;
    
    // Map width (longitude difference) 
    const lngDiff = topRight.lng - topLeft.lng;
    const mapWidthFeet = lngDiff * 364000 * cosLatitude;
    
    return { width: Math.abs(mapWidthFeet), height: Math.abs(mapHeightFeet) };
  };

  // Convert pixel distance to feet
  const pixelsToFeet = (pixels: number): number => {
    if (!imageRef.current) return pixels;
    
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;
    const { width: mapWidthFeet, height: mapHeightFeet } = calculateMapDimensions();
    
    // Calculate feet per pixel (using average of width and height ratios)
    const feetPerPixelX = mapWidthFeet / naturalWidth;
    const feetPerPixelY = mapHeightFeet / naturalHeight;
    const feetPerPixel = (feetPerPixelX + feetPerPixelY) / 2;
    
    return pixels * feetPerPixel;
  };

  // Convert external room format to internal room format
  const convertExternalRoom = (externalRoom: ExternalRoom): Room => {
    // Find matching room in schoolRooms by ID first
    const schoolRoom = schoolRooms.find(r => r.id === externalRoom.id);
    if (schoolRoom) {
      return {
        id: schoolRoom.id,
        name: schoolRoom.name,
        x: schoolRoom.coordinates[0] / 100,
        y: schoolRoom.coordinates[1] / 100
      };
    }

    // If not found, use coordinates as percentage
    return {
      id: externalRoom.id,
      name: externalRoom.name,
      x: externalRoom.coordinates[0] / 100,
      y: externalRoom.coordinates[1] / 100
    };
  };

  // Update route when external selections change
  useEffect(() => {
    if ((selectedStart || useCurrentLocation) && selectedEnd) {
      calculateRoute();
    }
  }, [selectedStart, selectedEnd, useCurrentLocation, currentLocation]);

  const calculateRoute = () => {
    const start = useCurrentLocation && currentLocation ? 
      { 
        id: 'current', 
        name: 'Current Location', 
        x: currentLocation.x / 100, 
        y: currentLocation.y / 100 
      } as Room : 
      selectedStart ? convertExternalRoom(selectedStart) : null;
      
    const end = selectedEnd ? convertExternalRoom(selectedEnd) : null;
      
    if (!start || !end) {
      return;
    }

    if (waypoints.length < 2) {
      toast({ title: "Need at least 2 waypoints for routing", variant: "destructive" });
      return;
    }

    if (paths.length === 0) {
      toast({ title: "Need to create paths between waypoints first", variant: "destructive" });
      return;
    }

    // Find nearest waypoints to start and end rooms
    const startWaypoint = waypoints.reduce((nearest, wp) => {
      const distance = Math.hypot(wp.x - start.x, wp.y - start.y);
      const nearestDistance = Math.hypot(nearest.x - start.x, nearest.y - start.y);
      return distance < nearestDistance ? wp : nearest;
    });

    const endWaypoint = waypoints.reduce((nearest, wp) => {
      const distance = Math.hypot(wp.x - end.x, wp.y - end.y);
      const nearestDistance = Math.hypot(nearest.x - end.x, nearest.y - end.y);
      return distance < nearestDistance ? wp : nearest;
    });

    // Check if there's a direct waypoint-to-room path for start or end
    let actualStartWaypoint = startWaypoint;
    let actualEndWaypoint = endWaypoint;
    
    // If start room has a direct path to a waypoint, use that waypoint
    const startRoomPath = paths.find(p => p.roomB === start.id);
    if (startRoomPath) {
      const connectedWaypoint = waypoints.find(wp => wp.id === startRoomPath.waypointA);
      if (connectedWaypoint) actualStartWaypoint = connectedWaypoint;
    }
    
    // If end room has a direct path to a waypoint, use that waypoint
    const endRoomPath = paths.find(p => p.roomB === end.id);
    if (endRoomPath) {
      const connectedWaypoint = waypoints.find(wp => wp.id === endRoomPath.waypointA);
      if (connectedWaypoint) actualEndWaypoint = connectedWaypoint;
    }

    // Find optimal path using A* algorithm
    const path = findOptimalPath(actualStartWaypoint, actualEndWaypoint);
    
    if (path.length === 0) {
      toast({ title: "No path found between waypoints", variant: "destructive" });
      return;
    }

    // Add the starting room as the first point and destination room as the final point in the route
    const routeWithStartAndDestination = [];
    
    // Add start room if it's not the same as the first waypoint
    if (actualStartWaypoint.id !== start.id) {
      const startPoint: Waypoint = {
        id: start.id,
        name: start.name,
        x: start.x,
        y: start.y,
        type: 'room'
      };
      routeWithStartAndDestination.push(startPoint);
    }
    
    // Add the calculated path
    routeWithStartAndDestination.push(...path);
    
    // Add destination room if it's not the same as the last waypoint
    if (actualEndWaypoint.id !== end.id) {
      const destinationPoint: Waypoint = {
        id: end.id,
        name: end.name,
        x: end.x,
        y: end.y,
        type: 'destination'
      };
      routeWithStartAndDestination.push(destinationPoint);
    }

    setRoute(routeWithStartAndDestination);
    const stepDirections = calculateDirections(routeWithStartAndDestination);
    setDirections(stepDirections);
    console.log('Route calculated:', routeWithStartAndDestination);
    toast({ title: `Route found with ${routeWithStartAndDestination.length} points` });
  };

  const findOptimalPath = (start: Waypoint, end: Waypoint): Waypoint[] => {
    if (start.id === end.id) return [start];
    
    // Build adjacency graph using manually created paths
    const graph = new Map<string, Waypoint[]>();
    
    // Initialize graph
    waypoints.forEach(wp => {
      graph.set(wp.id, []);
    });
    
    // Add connections based on manually created paths
    paths.forEach(path => {
      const waypointA = waypoints.find(wp => wp.id === path.waypointA);
      
      if (path.waypointB) {
        // Waypoint to waypoint path
        const waypointB = waypoints.find(wp => wp.id === path.waypointB);
        if (waypointA && waypointB) {
          graph.get(path.waypointA)!.push(waypointB);
          graph.get(path.waypointB)!.push(waypointA); // bidirectional
        }
      }
    });
    
    // A* pathfinding algorithm with safety limits
    const openSet = new Set([start.id]);
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    
    // Initialize scores
    waypoints.forEach(wp => {
      gScore.set(wp.id, Infinity);
      fScore.set(wp.id, Infinity);
    });
    
    gScore.set(start.id, 0);
    fScore.set(start.id, Math.hypot(start.x - end.x, start.y - end.y));
    
    // Safety limit to prevent infinite loops
    let iterations = 0;
    const maxIterations = waypoints.length * waypoints.length;
    
    while (openSet.size > 0 && iterations < maxIterations) {
      iterations++;
      // Find node with lowest fScore
      let current = '';
      let lowestF = Infinity;
      for (const id of openSet) {
        const f = fScore.get(id) || Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = id;
        }
      }
      
      if (current === end.id) {
        // Reconstruct path
        const path = [end];
        let currentId = end.id;
        while (cameFrom.has(currentId)) {
          currentId = cameFrom.get(currentId)!;
          const waypoint = waypoints.find(wp => wp.id === currentId);
          if (waypoint) path.unshift(waypoint);
        }
        return path;
      }
      
      openSet.delete(current);
      closedSet.add(current);
      const neighbors = graph.get(current) || [];
      
      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor.id)) continue;
        
        const currentWp = waypoints.find(wp => wp.id === current)!;
        const tentativeG = (gScore.get(current) || 0) + Math.hypot(currentWp.x - neighbor.x, currentWp.y - neighbor.y);
        
        if (tentativeG < (gScore.get(neighbor.id) || Infinity)) {
          cameFrom.set(neighbor.id, current);
          gScore.set(neighbor.id, tentativeG);
          fScore.set(neighbor.id, tentativeG + Math.hypot(neighbor.x - end.x, neighbor.y - end.y));
          if (!openSet.has(neighbor.id)) {
            openSet.add(neighbor.id);
          }
        }
      }
    }
    
    return []; // No path found
  };

  const clearRoute = () => {
    setRoute([]);
    setDirections([]);
  };

  // GPS coordinate conversion functions
  const convertGPSToPercent = (lat: number, lng: number): { x: number; y: number } => {
    // Use bilinear interpolation to map GPS coordinates to image percentage coordinates
    const { topLeft, topRight, bottomLeft, bottomRight } = mapCorners;
    
    // Calculate interpolation factors
    const latRange = topLeft.lat - bottomLeft.lat; // Total latitude range
    const lngRange = topRight.lng - topLeft.lng; // Total longitude range
    
    // Normalize the input coordinates within the map bounds
    const latFactor = (lat - bottomLeft.lat) / latRange;
    const lngFactor = (lng - topLeft.lng) / lngRange;
    
    // Clamp values to ensure they're within bounds
    const clampedLatFactor = Math.max(0, Math.min(1, latFactor));
    const clampedLngFactor = Math.max(0, Math.min(1, lngFactor));
    
    return {
      x: clampedLngFactor * 100, // longitude maps to x-axis (convert to percentage)
      y: (1 - clampedLatFactor) * 100 // latitude maps to y-axis (inverted because image coordinates start from top)
    };
  };

  const getCurrentGPSLocation = async () => {
    try {
      setIsTracking(true);
      const position = await gpsPositioning.getCurrentPosition();
      
      if (position && position.coordinates) {
        const [lng, lat] = position.coordinates;
        
        // Check if coordinates are within the map bounds
        const { topLeft, topRight, bottomLeft, bottomRight } = mapCorners;
        if (lat >= bottomLeft.lat && lat <= topLeft.lat && 
            lng >= topLeft.lng && lng <= topRight.lng) {
          
          const percentCoords = convertGPSToPercent(lat, lng);
          setCurrentLocation(percentCoords);
          
          toast({ title: "Location updated" });
        } else {
          toast({ title: "You are outside the mapped area", variant: "destructive" });
        }
      } else {
        toast({ title: "Unable to get GPS location", variant: "destructive" });
      }
    } catch (error) {
      console.error('GPS error:', error);
      toast({ title: "GPS positioning failed", variant: "destructive" });
    } finally {
      setIsTracking(false);
    }
  };

  // Start continuous GPS tracking if using current location
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (useCurrentLocation) {
      getCurrentGPSLocation(); // Get initial location
      interval = setInterval(() => {
        getCurrentGPSLocation();
      }, 5000); // Update every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [useCurrentLocation]);

  const calculateDirections = (routePoints: Waypoint[]): string[] => {
    if (routePoints.length < 2) return [];
    
    const directions: string[] = [];
    let totalDistance = 0;
    
    // Get natural image dimensions for pixel calculations
    const naturalWidth = imageRef.current?.naturalWidth || 1;
    const naturalHeight = imageRef.current?.naturalHeight || 1;
    
    // Track the walker's current facing direction
    let currentFacingBearing = 0;
    
    for (let i = 0; i < routePoints.length - 1; i++) {
      const current = routePoints[i];
      const next = routePoints[i + 1];
      
      // Convert percentage coordinates to pixel coordinates
      const currentX = current.x * naturalWidth;
      const currentY = current.y * naturalHeight;
      const nextX = next.x * naturalWidth;
      const nextY = next.y * naturalHeight;
      
      // Calculate distance in pixels, then convert to feet
      const distancePixels = Math.sqrt((nextX - currentX) ** 2 + (nextY - currentY) ** 2);
      const distanceFeet = pixelsToFeet(distancePixels);
      totalDistance += distanceFeet;
      
      // Calculate bearing (angle from north) for this segment
      const segmentBearing = Math.atan2(nextX - currentX, currentY - nextY) * 180 / Math.PI;
      const normalizedSegmentBearing = (segmentBearing + 360) % 360;
      
      if (i === 0) {
        // First step - establish initial facing direction
        currentFacingBearing = normalizedSegmentBearing;
        directions.push(`Head forward for ${Math.round(distanceFeet)} feet`);
      } else {
        // Calculate turn direction relative to walker's current facing direction
        const turnDirection = getWalkerTurnDirection(currentFacingBearing, normalizedSegmentBearing);
        
        if (i === routePoints.length - 2) {
          // Last step
          if (turnDirection !== 'straight') {
            directions.push(`Turn ${turnDirection} and walk ${Math.round(distanceFeet)} feet to reach ${next.name}`);
          } else {
            directions.push(`Continue straight for ${Math.round(distanceFeet)} feet to reach ${next.name}`);
          }
        } else {
          // Middle steps
          if (turnDirection !== 'straight') {
            directions.push(`Turn ${turnDirection} and walk ${Math.round(distanceFeet)} feet`);
          } else {
            directions.push(`Continue straight for ${Math.round(distanceFeet)} feet`);
          }
        }
        
        // Update facing direction after the turn
        currentFacingBearing = normalizedSegmentBearing;
      }
    }
    
    // Add total distance summary
    if (totalDistance > 0) {
      directions.push(`Total: ${Math.round(totalDistance)} ft (${Math.round(totalDistance/4)} sec walk)`);
    }
    
    return directions;
  };
  
  // Calculate turn direction from walker's perspective
  const getWalkerTurnDirection = (currentFacing: number, newBearing: number): 'left' | 'right' | 'straight' => {
    let diff = newBearing - currentFacing;
    
    // Normalize the difference to [-180, 180]
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    if (Math.abs(diff) < 30) return 'straight'; // Within 30 degrees is considered straight
    return diff > 0 ? 'right' : 'left'; // Positive diff = turn right, negative = turn left
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Mobile-optimized map container */}
      <div className="flex-1 relative bg-muted rounded-lg overflow-hidden"
           style={{ minHeight: '60vh' }}>
        <div 
          className="w-full h-full relative overflow-hidden touch-pan-x touch-pan-y"
          style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease'
          }}
        >
          <img
            ref={imageRef}
            src="/school-floorplan.jpg"
            alt="School Floor Plan"
            className="w-full h-full object-cover cursor-pointer select-none"
            onLoad={() => {
              console.log('Image loaded');
            }}
            draggable={false}
          />

          {/* Selected Start Room Highlight */}
          {selectedStart && (
            <div
              className="absolute w-6 h-6 bg-primary border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 shadow-lg"
              style={{
                left: `${convertExternalRoom(selectedStart).x * 100}%`,
                top: `${convertExternalRoom(selectedStart).y * 100}%`,
              }}
            >
              <div className="absolute inset-0 bg-primary rounded-full animate-pulse opacity-75"></div>
            </div>
          )}

          {/* Selected End Room Highlight */}
          {selectedEnd && (
            <div
              className="absolute w-6 h-6 bg-accent border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 shadow-lg"
              style={{
                left: `${convertExternalRoom(selectedEnd).x * 100}%`,
                top: `${convertExternalRoom(selectedEnd).y * 100}%`,
              }}
            >
              <div className="absolute inset-0 bg-accent rounded-full animate-pulse opacity-75"></div>
            </div>
          )}

          {/* Current Location Dot - Prominent pink/red dot */}
          {currentLocation && (
            <div
              className="absolute w-5 h-5 bg-accent border-3 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 shadow-xl"
              style={{
                left: `${currentLocation.x}%`,
                top: `${currentLocation.y}%`,
              }}
            >
              <div className="absolute inset-0 bg-accent rounded-full animate-pulse opacity-75"></div>
              <div className="absolute -inset-1 bg-accent rounded-full animate-ping opacity-25"></div>
            </div>
          )}

          {/* Route Line */}
          {route.length > 1 && (
            <svg className="absolute inset-0 pointer-events-none w-full h-full">
              <polyline
                points={route.map(wp => `${wp.x * 100},${wp.y * 100}`).join(' ')}
                fill="none"
                stroke="hsl(var(--accent))"
                strokeWidth="4"
                strokeOpacity="0.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Route direction arrows */}
              {route.map((wp, index) => {
                if (index === route.length - 1) return null;
                const next = route[index + 1];
                const midX = (wp.x + next.x) * 50; // Midpoint between waypoints
                const midY = (wp.y + next.y) * 50;
                const angle = Math.atan2(next.y - wp.y, next.x - wp.x) * 180 / Math.PI;
                
                return (
                  <polygon
                    key={`arrow-${index}`}
                    points="0,-5 10,0 0,5"
                    fill="hsl(var(--accent))"
                    transform={`translate(${midX},${midY}) rotate(${angle})`}
                  />
                );
              })}
            </svg>
          )}
        </div>

        {/* Simplified Zoom Controls for Mobile */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-card/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <Button
            onClick={() => setZoom(prev => Math.min(prev + 0.3, 2.5))}
            size="sm"
            variant="secondary"
            className="w-10 h-10 p-0 touch-manipulation"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setZoom(prev => Math.max(prev - 0.3, 0.8))}
            size="sm"
            variant="secondary"
            className="w-10 h-10 p-0 touch-manipulation"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Location Button */}
        {useCurrentLocation && (
          <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
            <Button
              onClick={getCurrentGPSLocation}
              size="sm"
              variant="secondary"
              disabled={isTracking}
              className="w-10 h-10 p-0 touch-manipulation"
            >
              <Target className={`h-4 w-4 ${isTracking ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
      </div>

      {/* Route Information - Bottom overlay for mobile */}
      {route.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Directions</h3>
            <Button onClick={clearRoute} variant="ghost" size="sm" className="h-6 px-2 text-xs">
              Clear
            </Button>
          </div>
          <div className="space-y-1">
            {directions.slice(0, 3).map((direction, index) => (
              <div key={index} className="flex items-start gap-2 text-xs">
                <Badge variant="outline" className="min-w-[20px] h-5 text-xs flex items-center justify-center shrink-0">
                  {index + 1}
                </Badge>
                <span className="leading-tight">{direction}</span>
              </div>
            ))}
            {directions.length > 3 && (
              <div className="text-xs text-muted-foreground mt-1">
                +{directions.length - 3} more steps
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};