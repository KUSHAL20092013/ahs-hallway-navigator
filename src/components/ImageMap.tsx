
import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Navigation, Trash2, Edit3, Download, Upload, Search, ZoomIn, ZoomOut, Eye, EyeOff, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export const ImageMap = () => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [isWaypointMode, setIsWaypointMode] = useState(false);
  const [isRoomMode, setIsRoomMode] = useState(false);
  const [isPathMode, setIsPathMode] = useState(false);
  const [selectedWaypointForPath, setSelectedWaypointForPath] = useState<string | null>(null);
  const [selectedRoomForPath, setSelectedRoomForPath] = useState<string | null>(null);
  const { toast } = useToast();
  const [newPointName, setNewPointName] = useState('');
  const [selectedStart, setSelectedStart] = useState<Room | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Room | null>(null);
  const [route, setRoute] = useState<Waypoint[]>([]);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState('');
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [showRooms, setShowRooms] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [showPaths, setShowPaths] = useState(true);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);

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
    if (!selectedStart) {
      setSelectedStart(room);
      toast({ title: `Start: ${room.name}` });
    } else if (!selectedEnd && room.id !== selectedStart.id) {
      setSelectedEnd(room);
      toast({ title: `Destination: ${room.name}` });
    }
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
    setSelectedStart(null);
    setSelectedEnd(null);
    setRoute([]);
    toast({ title: "Route cleared" });
  };


  const deleteRoom = (id: string) => {
    setRooms(prev => prev.filter(room => room.id !== id));
    if (selectedStart?.id === id) setSelectedStart(null);
    if (selectedEnd?.id === id) setSelectedEnd(null);
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

  return (
    <div className="w-full h-screen flex bg-background">
      {/* Control Panel */}
      <div className="w-80 p-4 border-r bg-card overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Floor Plan Editor</h2>
        
        {/* Mode Controls */}
        <div className="space-y-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={isWaypointMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsWaypointMode(!isWaypointMode);
                setIsRoomMode(false);
                setIsPathMode(false);
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
                setIsPathMode(false);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Rooms
            </Button>
            <Button
              variant={isPathMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsPathMode(!isPathMode);
                setIsWaypointMode(false);
                setIsRoomMode(false);
                setSelectedWaypointForPath(null);
              }}
            >
              <Link className="w-4 h-4 mr-1" />
              Paths
            </Button>
            <Button
              variant={showPaths ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPaths(!showPaths)}
            >
              {showPaths ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
              Show Paths
            </Button>
          </div>
        </div>

        {/* Save/Load Controls */}
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold">Save/Load</h3>
          <div className="flex gap-2">
            <Button size="sm" onClick={exportData} variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <label className="cursor-pointer">
              <Button size="sm" variant="outline" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-1" />
                  Import
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
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

        {/* Paths List */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Paths ({paths.length})</h3>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {paths.map(path => {
              const wpA = waypoints.find(w => w.id === path.waypointA);
              const wpB = path.waypointB ? waypoints.find(w => w.id === path.waypointB) : null;
              const roomB = path.roomB ? rooms.find(r => r.id === path.roomB) : null;
              
              const pathLabel = wpB 
                ? `${wpA?.name} ↔ ${wpB?.name}` 
                : `${wpA?.name} ↔ ${roomB?.name}`;
              
              return (
                <div key={path.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                  <span>{pathLabel}</span>
                  <Button size="sm" variant="ghost" onClick={() => deletePath(path.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
            {paths.length === 0 && (
              <p className="text-xs text-muted-foreground">No paths created. Use Path mode to connect waypoints and rooms.</p>
            )}
          </div>
        </div>

        {/* Waypoints List */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Waypoints ({waypoints.length})</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowWaypoints(!showWaypoints)}
              className="h-7 w-7 p-0"
            >
              {showWaypoints ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
          </div>
          {isPathMode && <p className="text-xs text-muted-foreground mt-1">Click waypoints and rooms to create paths</p>}
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRooms(!showRooms)}
              className="h-7 w-7 p-0"
            >
              {showRooms ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
          </div>
          
          {/* Room Search */}
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search rooms..."
              value={roomSearchTerm}
              onChange={(e) => setRoomSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {filteredRooms.map(room => (
              <div key={room.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                {editingRoomId === room.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingRoomName}
                      onChange={(e) => setEditingRoomName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') saveRoomEdit();
                        if (e.key === 'Escape') cancelRoomEdit();
                      }}
                      onBlur={saveRoomEdit}
                      className="h-6 text-xs"
                      autoFocus
                    />
                  </div>
                ) : (
                  <span 
                    className="cursor-pointer hover:text-primary flex-1"
                    onClick={() => selectRoom(room)}
                  >
                    {room.name}
                  </span>
                )}
                <div className="flex gap-1">
                  {editingRoomId !== room.id && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => startEditingRoom(room)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => deleteRoom(room.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floor Plan */}
      <div className="flex-1 relative overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center overflow-auto">
            <img 
              ref={imageRef}
              src="/school-floorplan.jpg" 
              alt="School Floor Plan"
              className="w-full h-full object-contain cursor-crosshair transition-transform duration-200"
              onClick={handleImageClick}
              draggable={false}
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                minWidth: '100%',
                minHeight: '100%'
              }}
            />
            
            {/* Paths visualization */}
            {showPaths && paths.map(path => {
              const wpA = waypoints.find(w => w.id === path.waypointA);
              if (!wpA) return null;
              
              let coordsA = getDisplayCoordinates(wpA.x, wpA.y);
              let coordsB;
              
              if (path.waypointB) {
                // Waypoint to waypoint path
                const wpB = waypoints.find(w => w.id === path.waypointB);
                if (!wpB) return null;
                coordsB = getDisplayCoordinates(wpB.x, wpB.y);
              } else if (path.roomB) {
                // Waypoint to room path
                const roomB = rooms.find(r => r.id === path.roomB);
                if (!roomB) return null;
                coordsB = getDisplayCoordinates(roomB.x, roomB.y);
              } else {
                return null;
              }
              
              return (
                <svg key={path.id} className="absolute inset-0 w-full h-full pointer-events-none">
                  <line
                    x1={coordsA.x}
                    y1={coordsA.y}
                    x2={coordsB.x}
                    y2={coordsB.y}
                    stroke={path.roomB ? "#f59e0b" : "#10b981"}
                    strokeWidth="2"
                    strokeDasharray={path.roomB ? "3,3" : "5,5"}
                  />
                </svg>
              );
            })}
            
            {/* Waypoints */}
            {showWaypoints && waypoints.map(wp => {
              const { x, y } = getDisplayCoordinates(wp.x, wp.y);
              const isSelectedForPath = selectedWaypointForPath === wp.id;
              
              return (
                <div
                  key={wp.id}
                  className={`absolute w-3 h-3 border-2 border-white rounded-full shadow-lg cursor-pointer hover:scale-125 transition-transform ${
                    isSelectedForPath ? 'bg-yellow-500' : 'bg-orange-500'
                  } ${isPathMode ? 'pointer-events-auto' : 'pointer-events-none'}`}
                  style={{ left: x - 6, top: y - 6 }}
                  title={wp.name}
                  onClick={() => handleWaypointClick(wp.id)}
                />
              );
            })}
            
            {/* Rooms */}
            {showRooms && rooms.map(room => {
              const { x, y } = getDisplayCoordinates(room.x, room.y);
              
              return (
                <div
                  key={room.id}
                  className={`absolute w-4 h-4 border-2 border-white rounded-full shadow-lg cursor-pointer ${
                    selectedStart?.id === room.id ? 'bg-green-500' :
                    selectedEnd?.id === room.id ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ left: x - 8, top: y - 8 }}
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
                  stroke="hsl(214, 84%, 56%)"
                  strokeWidth="3"
                  strokeOpacity="0.8"
                />
              </svg>
            )}
          </div>
        
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={zoomIn}
            className="w-10 h-10 p-0 bg-background/95"
            disabled={zoom >= 3}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={zoomOut}
            className="w-10 h-10 p-0 bg-background/95"
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="text-xs text-center text-muted-foreground bg-background/95 px-2 py-1 rounded">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute top-4 left-4 bg-background/95 p-3 rounded border">
          <p className="text-sm text-muted-foreground">
            {isWaypointMode ? 'Click to place waypoints (auto-numbered WP1, WP2, WP3...)' :
             isRoomMode ? 'Click to place rooms (auto-numbered 1, 2, 3...)' :
             'Select mode to start placing points'}
          </p>
        </div>
      </div>
    </div>
  );
};
