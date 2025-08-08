
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Navigation, Trash2, Edit3, Download, Upload, Search, ZoomIn, ZoomOut, Eye, EyeOff, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import navigationData from '@/data/navigationData.json';
import { gpsPositioning } from '@/services/gpsPositioning';
import type { WiFiPositionResult } from '@/types/wifi';
import { schoolRooms, type Room as ExternalRoom } from '@/data/schoolRooms';

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

interface ImageMapProps {
  selectedStart?: ExternalRoom | null;
  selectedEnd?: ExternalRoom | null;
  useCurrentLocation?: boolean;
}

export const ImageMap = ({ selectedStart: propSelectedStart, selectedEnd: propSelectedEnd, useCurrentLocation = false }: ImageMapProps) => {
  // Convert external room data to internal format
  const convertExternalToInternalRoom = (externalRoom: ExternalRoom): Room => ({
    id: externalRoom.id,
    name: externalRoom.name,
    x: externalRoom.coordinates[0] / 100, // Convert to percentage
    y: externalRoom.coordinates[1] / 100  // Convert to percentage
  });

  const selectedStart = propSelectedStart ? convertExternalToInternalRoom(propSelectedStart) : null;
  const selectedEnd = propSelectedEnd ? convertExternalToInternalRoom(propSelectedEnd) : null;
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);

  // Load navigation data on component mount
  useEffect(() => {
    setWaypoints((navigationData.waypoints || []) as Waypoint[]);
    setRooms(navigationData.rooms || []);
    setPaths(navigationData.paths || []);
  }, []);
  const [isWaypointMode, setIsWaypointMode] = useState(false);
  const [isRoomMode, setIsRoomMode] = useState(false);
  const [isPathMode, setIsPathMode] = useState(false);
  const [selectedWaypointForPath, setSelectedWaypointForPath] = useState<string | null>(null);
  const [selectedRoomForPath, setSelectedRoomForPath] = useState<string | null>(null);
  const { toast } = useToast();
  const [newPointName, setNewPointName] = useState('');
  const [route, setRoute] = useState<Waypoint[]>([]);
  const [directions, setDirections] = useState<string[]>([]);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState('');
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [showRooms, setShowRooms] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [currentLocation, setCurrentLocation] = useState<{ x: number; y: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

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

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;
    
    if (naturalWidth === 0 || naturalHeight === 0) return;
    
    // Get click position relative to the container
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Calculate how the image is displayed (object-contain behavior)
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    const scale = Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight);
    const displayedWidth = naturalWidth * scale;
    const displayedHeight = naturalHeight * scale;
    
    // Calculate centering offsets
    const offsetX = (containerWidth - displayedWidth) / 2;
    const offsetY = (containerHeight - displayedHeight) / 2;
    
    // Convert click coordinates to image coordinates (accounting for zoom)
    const imageX = ((clickX - offsetX) / zoom - offsetX * (1 - zoom) / zoom) / scale;
    const imageY = ((clickY - offsetY) / zoom - offsetY * (1 - zoom) / zoom) / scale;
    
    // Check if click is within the image bounds
    if (imageX < 0 || imageX > naturalWidth || imageY < 0 || imageY > naturalHeight) {
      return;
    }

    // Convert to percentage coordinates
    const percentX = imageX / naturalWidth;
    const percentY = imageY / naturalHeight;

    if (isWaypointMode) {
      const waypointNumber = waypoints.length + 1;
      const waypoint: Waypoint = {
        id: `wp-${Date.now()}`,
        name: `WP${waypointNumber}`,
        x: percentX,
        y: percentY,
        type: 'corridor'
      };
      setWaypoints(prev => [...prev, waypoint]);
      toast({ title: `Waypoint ${waypointNumber} placed` });
    } else if (isRoomMode) {
      const roomNumber = rooms.length + 1;
      const room: Room = {
        id: `room-${Date.now()}`,
        name: roomNumber.toString(),
        x: percentX,
        y: percentY
      };
      setRooms(prev => [...prev, room]);
      toast({ title: `Room ${roomNumber} placed` });
    }
  };

  const handleWaypointClick = (waypointId: string) => {
    if (!isPathMode) return;
    
    if (!selectedWaypointForPath && !selectedRoomForPath) {
      setSelectedWaypointForPath(waypointId);
      toast({ title: "Now click another waypoint or room to create path" });
    } else if (selectedWaypointForPath && selectedWaypointForPath !== waypointId) {
      // Waypoint to waypoint path
      const pathExists = paths.some(p => 
        (p.waypointA === selectedWaypointForPath && p.waypointB === waypointId) ||
        (p.waypointA === waypointId && p.waypointB === selectedWaypointForPath)
      );
      
      if (pathExists) {
        toast({ title: "Path already exists between these waypoints", variant: "destructive" });
      } else {
        const newPath: Path = {
          id: `path-${Date.now()}`,
          waypointA: selectedWaypointForPath,
          waypointB: waypointId
        };
        setPaths(prev => [...prev, newPath]);
        toast({ title: "Waypoint-to-waypoint path created" });
      }
      setSelectedWaypointForPath(null);
    } else if (selectedRoomForPath) {
      // Room to waypoint path
      const pathExists = paths.some(p => 
        (p.waypointA === waypointId && p.roomB === selectedRoomForPath)
      );
      
      if (pathExists) {
        toast({ title: "Path already exists between this waypoint and room", variant: "destructive" });
      } else {
        const newPath: Path = {
          id: `path-${Date.now()}`,
          waypointA: waypointId,
          roomB: selectedRoomForPath
        };
        setPaths(prev => [...prev, newPath]);
        toast({ title: "Waypoint-to-room path created" });
      }
      setSelectedRoomForPath(null);
    } else {
      // Cancel selection
      setSelectedWaypointForPath(null);
      setSelectedRoomForPath(null);
      toast({ title: "Path creation cancelled" });
    }
  };

  const handleRoomClick = (roomId: string) => {
    if (!isPathMode) {
      // Normal room selection for routing
      const room = rooms.find(r => r.id === roomId);
      if (room) selectRoom(room);
      return;
    }
    
    if (!selectedWaypointForPath && !selectedRoomForPath) {
      setSelectedRoomForPath(roomId);
      toast({ title: "Now click a waypoint to create path" });
    } else if (selectedWaypointForPath) {
      // Waypoint to room path
      const pathExists = paths.some(p => 
        (p.waypointA === selectedWaypointForPath && p.roomB === roomId)
      );
      
      if (pathExists) {
        toast({ title: "Path already exists between this waypoint and room", variant: "destructive" });
      } else {
        const newPath: Path = {
          id: `path-${Date.now()}`,
          waypointA: selectedWaypointForPath,
          roomB: roomId
        };
        setPaths(prev => [...prev, newPath]);
        toast({ title: "Waypoint-to-room path created" });
      }
      setSelectedWaypointForPath(null);
    } else {
      // Cancel selection
      setSelectedWaypointForPath(null);
      setSelectedRoomForPath(null);
      toast({ title: "Path creation cancelled" });
    }
  };

  const calculateRoute = () => {
    if (!selectedStart || !selectedEnd) {
      toast({ title: "Select both start and destination", variant: "destructive" });
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
      const distance = Math.hypot(wp.x - selectedStart.x, wp.y - selectedStart.y);
      const nearestDistance = Math.hypot(nearest.x - selectedStart.x, nearest.y - selectedStart.y);
      return distance < nearestDistance ? wp : nearest;
    });

    const endWaypoint = waypoints.reduce((nearest, wp) => {
      const distance = Math.hypot(wp.x - selectedEnd.x, wp.y - selectedEnd.y);
      const nearestDistance = Math.hypot(nearest.x - selectedEnd.x, nearest.y - selectedEnd.y);
      return distance < nearestDistance ? wp : nearest;
    });

    // Check if there's a direct waypoint-to-room path for start or end
    let actualStartWaypoint = startWaypoint;
    let actualEndWaypoint = endWaypoint;
    
    // If start room has a direct path to a waypoint, use that waypoint
    const startRoomPath = paths.find(p => p.roomB === selectedStart.id);
    if (startRoomPath) {
      const connectedWaypoint = waypoints.find(wp => wp.id === startRoomPath.waypointA);
      if (connectedWaypoint) actualStartWaypoint = connectedWaypoint;
    }
    
    // If end room has a direct path to a waypoint, use that waypoint
    const endRoomPath = paths.find(p => p.roomB === selectedEnd.id);
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
    if (actualStartWaypoint.id !== selectedStart.id) {
      const startPoint: Waypoint = {
        id: selectedStart.id,
        name: selectedStart.name,
        x: selectedStart.x,
        y: selectedStart.y,
        type: 'room'
      };
      routeWithStartAndDestination.push(startPoint);
    }
    
    // Add the calculated path
    routeWithStartAndDestination.push(...path);
    
    // Add destination room if it's not the same as the last waypoint
    if (actualEndWaypoint.id !== selectedEnd.id) {
      const destinationPoint: Waypoint = {
        id: selectedEnd.id,
        name: selectedEnd.name,
        x: selectedEnd.x,
        y: selectedEnd.y,
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

  const deleteWaypoint = (id: string) => {
    setWaypoints(prev => prev.filter(w => w.id !== id));
    // Also remove any paths connected to this waypoint
    setPaths(prev => prev.filter(p => p.waypointA !== id && p.waypointB !== id));
    console.log('Waypoint deleted:', id);
  };

  const selectRoom = (room: Room) => {
    // Room selection is now handled by parent component
    console.log('Room selected:', room);
  };

  const deletePath = (pathId: string) => {
    setPaths(prev => prev.filter(p => p.id !== pathId));
    toast({ title: "Path deleted" });
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
      } else if (path.roomB) {
        // Waypoint to room path - we'll handle this when finding routes to rooms
        // For now, just ensure the waypoint exists in the graph
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
    toast({ title: "Route cleared" });
  };


  const deleteRoom = (id: string) => {
    setRooms(prev => prev.filter(room => room.id !== id));
    // Room selection is now handled by parent component
    toast({ title: "Room deleted" });
  };

  const startEditingRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setEditingRoomName(room.name);
  };

  const saveRoomEdit = () => {
    if (editingRoomId && editingRoomName.trim()) {
      setRooms(prev => prev.map(room => 
        room.id === editingRoomId 
          ? { ...room, name: editingRoomName.trim() }
          : room
      ));
      setEditingRoomId(null);
      setEditingRoomName('');
      toast({ title: "Room renamed" });
    }
  };

  const cancelRoomEdit = () => {
    setEditingRoomId(null);
    setEditingRoomName('');
  };

  const exportData = () => {
    const data = {
      waypoints,
      rooms,
      paths,
      version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'school-navigation-data.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: `Exported ${waypoints.length} waypoints, ${rooms.length} rooms, and ${paths.length} paths` });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.waypoints) setWaypoints(data.waypoints);
        if (data.rooms) setRooms(data.rooms);
        if (data.paths) setPaths(data.paths || []);
        
        toast({ 
          title: `Imported ${data.waypoints?.length || 0} waypoints, ${data.rooms?.length || 0} rooms, and ${data.paths?.length || 0} paths` 
        });
      } catch (error) {
        toast({ title: "Failed to import data", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
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
      x: clampedLngFactor, // longitude maps to x-axis
      y: 1 - clampedLatFactor // latitude maps to y-axis (inverted because image coordinates start from top)
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
          
          // Current location tracking is handled by parent component
          toast({ title: "Current location found" });
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

  // Start continuous GPS tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking) {
      interval = setInterval(() => {
        getCurrentGPSLocation();
      }, 3000); // Update every 3 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking]);

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  // Filter rooms based on search term
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(roomSearchTerm.toLowerCase())
  );

  // Helper function to convert percentage coordinates to display coordinates
  const getDisplayCoordinates = (percentX: number, percentY: number) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    
    const rect = imageRef.current.getBoundingClientRect();
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;
    
    if (naturalWidth === 0 || naturalHeight === 0) return { x: 0, y: 0 };
    
    const containerWidth = rect.width;
    const containerHeight = rect.height;
    const scale = Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight);
    const displayedWidth = naturalWidth * scale;
    const displayedHeight = naturalHeight * scale;
    
    const offsetX = (containerWidth - displayedWidth) / 2;
    const offsetY = (containerHeight - displayedHeight) / 2;
    
    const x = offsetX + (percentX * naturalWidth * scale);
    const y = offsetY + (percentY * naturalHeight * scale);
    
    return { x, y };
  };

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
      
      // Determine cardinal direction for this segment
      let direction = '';
      if (normalizedSegmentBearing >= 337.5 || normalizedSegmentBearing < 22.5) direction = 'north';
      else if (normalizedSegmentBearing >= 22.5 && normalizedSegmentBearing < 67.5) direction = 'northeast';
      else if (normalizedSegmentBearing >= 67.5 && normalizedSegmentBearing < 112.5) direction = 'east';
      else if (normalizedSegmentBearing >= 112.5 && normalizedSegmentBearing < 157.5) direction = 'southeast';
      else if (normalizedSegmentBearing >= 157.5 && normalizedSegmentBearing < 202.5) direction = 'south';
      else if (normalizedSegmentBearing >= 202.5 && normalizedSegmentBearing < 247.5) direction = 'southwest';
      else if (normalizedSegmentBearing >= 247.5 && normalizedSegmentBearing < 292.5) direction = 'west';
      else direction = 'northwest';
      
      if (i === 0) {
        // First step - establish initial facing direction
        currentFacingBearing = normalizedSegmentBearing;
        directions.push(`Start at ${current.name} and head ${direction} for ${Math.round(distanceFeet)} feet`);
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
      directions.push(`\nTotal distance: ${Math.round(totalDistance)} feet (approximately ${Math.round(totalDistance/4)} seconds walking)`);
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

  // Calculate route when props change
  useEffect(() => {
    if (selectedStart && selectedEnd) {
      calculateRoute();
    }
  }, [selectedStart, selectedEnd]);

  return (
    <div className="w-full h-full bg-background relative">{/* Mobile-optimized map container */}

      {/* Full Screen Floor Plan */}
      <div className="w-full h-full relative overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center overflow-auto">
            <img 
              ref={imageRef}
              src="/school-floorplan.jpg" 
              alt="School Floor Plan"
              className="w-full h-full object-contain transition-transform duration-200"
              draggable={false}
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                minWidth: '100%',
                minHeight: '100%'
              }}
            />
            {/* Current Location (Pink Dot) */}
            {currentLocation && (
              <div
                className="absolute w-4 h-4 bg-pink-500 border-2 border-white rounded-full shadow-lg animate-pulse"
                style={{ 
                  left: getDisplayCoordinates(currentLocation.x, currentLocation.y).x - 8, 
                  top: getDisplayCoordinates(currentLocation.x, currentLocation.y).y - 8 
                }}
                title="Your Current Location"
              />
            )}

            {/* Rooms */}
            {showRooms && rooms.map(room => {
              const { x, y } = getDisplayCoordinates(room.x, room.y);
              
              return (
                <div
                  key={room.id}
                  className={`absolute w-3 h-3 border border-white rounded-sm shadow-sm cursor-pointer transition-all duration-200 hover:scale-150 ${
                    selectedStart?.id === room.id ? 'bg-primary' :
                    selectedEnd?.id === room.id ? 'bg-accent' : 'bg-primary/80'
                  }`}
                  style={{ left: x - 6, top: y - 6 }}
                  onClick={() => selectRoom(room)}
                  title={room.name}
                />
              );
            })}
            
            {/* Route Line */}
            {route.length > 1 && (
              <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                <polyline
                  points={route.map(wp => {
                    const { x, y } = getDisplayCoordinates(wp.x, wp.y);
                    return `${x},${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeOpacity="0.9"
                />
              </svg>
            )}
          </div>
        
        {/* Mobile Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={zoomOut}
            className="w-12 h-12 p-0 bg-primary/90 text-primary-foreground border-primary"
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={zoomIn}
            className="w-12 h-12 p-0 bg-primary/90 text-primary-foreground border-primary"
            disabled={zoom >= 3}
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Directions Overlay */}
        {directions.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 max-h-48 overflow-y-auto">
            <h3 className="font-semibold mb-2 text-primary">Navigation Directions</h3>
            <div className="space-y-2">
              {directions.map((direction, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Badge variant="default" className="min-w-6 h-6 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                    {index + 1}
                  </Badge>
                  <span className="leading-relaxed">{direction}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
