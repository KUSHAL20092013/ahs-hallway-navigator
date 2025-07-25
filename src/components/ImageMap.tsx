
import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Navigation, Trash2, Edit3, Download, Upload, Search, ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { strategicWaypoints, isPathInCorridors, schoolCorridors, type StrategicWaypoint } from "@/data/schoolCorridors";

interface Waypoint {
  id: string;
  name: string;
  x: number; // Percentage of natural image width (0-1)
  y: number; // Percentage of natural image height (0-1)
  type: 'corridor' | 'junction' | 'entrance' | 'room';
}

interface Room {
  id: string;
  name: string;
  x: number; // Percentage of natural image width (0-1)
  y: number; // Percentage of natural image height (0-1)
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
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState('');
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [showRooms, setShowRooms] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [showCorridors, setShowCorridors] = useState(false);
  const [useStrategicWaypoints, setUseStrategicWaypoints] = useState(true);
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

    const currentWaypoints = useStrategicWaypoints ? 
      strategicWaypoints.map(sw => ({ id: sw.id, name: sw.name, x: sw.x, y: sw.y, type: sw.type as any })) : 
      waypoints;

    if (currentWaypoints.length < 2) {
      toast({ title: "Need at least 2 waypoints for routing", variant: "destructive" });
      return;
    }

    // Find nearest waypoints to start and end rooms
    const startWaypoint = currentWaypoints.reduce((nearest, wp) => {
      const distance = Math.hypot(wp.x - selectedStart.x, wp.y - selectedStart.y);
      const nearestDistance = Math.hypot(nearest.x - selectedStart.x, nearest.y - selectedStart.y);
      return distance < nearestDistance ? wp : nearest;
    });

    const endWaypoint = currentWaypoints.reduce((nearest, wp) => {
      const distance = Math.hypot(wp.x - selectedEnd.x, wp.y - selectedEnd.y);
      const nearestDistance = Math.hypot(nearest.x - selectedEnd.x, nearest.y - selectedEnd.y);
      return distance < nearestDistance ? wp : nearest;
    });

    // Find optimal path using A* algorithm
    const path = findOptimalPath(startWaypoint, endWaypoint);
    
    if (path.length === 0) {
      toast({ title: "No path found between waypoints", variant: "destructive" });
      return;
    }

    setRoute(path);
    console.log('Route calculated:', path);
    toast({ title: `Route found with ${path.length} waypoints` });
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

  // Enhanced line-of-sight checking using corridors and room avoidance
  const hasLineOfSight = (wp1: Waypoint, wp2: Waypoint): boolean => {
    // Check if the path stays within defined corridors
    if (!isPathInCorridors(wp1.x, wp1.y, wp2.x, wp2.y)) {
      return false;
    }
    
    const steps = 20;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const checkX = wp1.x + (wp2.x - wp1.x) * t;
      const checkY = wp1.y + (wp2.y - wp1.y) * t;
      
      // Check if this point is too close to any room
      for (const room of rooms) {
        const distanceToRoom = Math.hypot(checkX - room.x, checkY - room.y);
        if (distanceToRoom < 0.03) {
          return false;
        }
      }
    }
    return true;
  };

  const findOptimalPath = (start: Waypoint, end: Waypoint): Waypoint[] => {
    if (start.id === end.id) return [start];
    
    const currentWaypoints = useStrategicWaypoints ? 
      strategicWaypoints.map(sw => ({ id: sw.id, name: sw.name, x: sw.x, y: sw.y, type: sw.type as any })) : 
      waypoints;
    
    const graph = new Map<string, Waypoint[]>();
    
    // Initialize graph
    currentWaypoints.forEach(wp => {
      graph.set(wp.id, []);
    });
    
    if (useStrategicWaypoints) {
      // Use predefined connections for strategic waypoints
      strategicWaypoints.forEach(wp => {
        const connections = wp.connections
          .map(connId => currentWaypoints.find(w => w.id === connId))
          .filter(Boolean) as Waypoint[];
        graph.set(wp.id, connections);
      });
    } else {
      // Create connections between nearby waypoints with line-of-sight check
      const maxConnectionDistance = 0.20;
      currentWaypoints.forEach(wp1 => {
        currentWaypoints.forEach(wp2 => {
          if (wp1.id !== wp2.id) {
            const distance = Math.hypot(wp1.x - wp2.x, wp1.y - wp2.y);
            if (distance <= maxConnectionDistance && hasLineOfSight(wp1, wp2)) {
              graph.get(wp1.id)!.push(wp2);
            }
          }
        });
      });
    }
    
    // A* pathfinding algorithm with safety limits
    const openSet = new Set([start.id]);
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    
    // Initialize scores
    currentWaypoints.forEach(wp => {
      gScore.set(wp.id, Infinity);
      fScore.set(wp.id, Infinity);
    });
    
    gScore.set(start.id, 0);
    fScore.set(start.id, Math.hypot(start.x - end.x, start.y - end.y));
    
    // Safety limit to prevent infinite loops
    let iterations = 0;
    const maxIterations = currentWaypoints.length * currentWaypoints.length;
    
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
          const waypoint = currentWaypoints.find(wp => wp.id === currentId);
          if (waypoint) path.unshift(waypoint);
        }
        return path;
      }
      
      openSet.delete(current);
      closedSet.add(current);
      const neighbors = graph.get(current) || [];
      
      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor.id)) continue;
        
        const currentWp = currentWaypoints.find(wp => wp.id === current)!;
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
      rooms,
      waypoints,
      exportDate: new Date().toISOString(),
      coordinateSystem: 'percentage' // Flag to indicate coordinate system
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `floor-plan-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Floor plan exported successfully" });
  };

  // Migration helper for old absolute coordinates
  const migrateCoordinates = (data: any) => {
    if (!imageRef.current) return data;
    
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;
    
    if (naturalWidth === 0 || naturalHeight === 0) return data;
    
    // Check if migration is needed (old format doesn't have coordinateSystem flag)
    const needsMigration = !data.coordinateSystem;
    
    if (needsMigration) {
      // Convert absolute coordinates to percentages
      if (data.rooms) {
        data.rooms = data.rooms.map((room: any) => ({
          ...room,
          x: Math.min(Math.max(room.x / naturalWidth, 0), 1),
          y: Math.min(Math.max(room.y / naturalHeight, 0), 1)
        }));
      }
      
      if (data.waypoints) {
        data.waypoints = data.waypoints.map((waypoint: any) => ({
          ...waypoint,
          x: Math.min(Math.max(waypoint.x / naturalWidth, 0), 1),
          y: Math.min(Math.max(waypoint.y / naturalHeight, 0), 1)
        }));
      }
    }
    
    return data;
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let data = JSON.parse(e.target?.result as string);
        
        // Migrate old coordinate system if needed
        data = migrateCoordinates(data);
        
        if (data.rooms && Array.isArray(data.rooms)) {
          setRooms(data.rooms);
        }
        if (data.waypoints && Array.isArray(data.waypoints)) {
          setWaypoints(data.waypoints);
        }
        
        // Clear current selection and route
        setSelectedStart(null);
        setSelectedEnd(null);
        setRoute([]);
        
        toast({ title: "Floor plan imported successfully" });
      } catch (error) {
        toast({ title: "Failed to import file", variant: "destructive" });
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
              variant={useStrategicWaypoints ? "outline" : (isWaypointMode ? "default" : "outline")}
              size="sm"
              onClick={() => {
                setIsWaypointMode(!isWaypointMode);
                setIsRoomMode(false);
              }}
              disabled={useStrategicWaypoints}
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
            <Button
              variant={useStrategicWaypoints ? "default" : "outline"}
              size="sm"
              onClick={() => setUseStrategicWaypoints(!useStrategicWaypoints)}
            >
              <Navigation className="w-4 h-4 mr-1" />
              {useStrategicWaypoints ? 'Strategic' : 'Manual'}
            </Button>
            <Button
              variant={showCorridors ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCorridors(!showCorridors)}
            >
              {showCorridors ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
              Corridors
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

        {/* Waypoints List */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">
              Waypoints ({useStrategicWaypoints ? strategicWaypoints.length : waypoints.length})
              {useStrategicWaypoints && <Badge variant="secondary" className="ml-2">Strategic</Badge>}
            </h3>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {(useStrategicWaypoints ? strategicWaypoints : waypoints).map(wp => (
              <div key={wp.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                <span>{wp.name}</span>
                {!useStrategicWaypoints && (
                  <Button size="sm" variant="ghost" onClick={() => deleteWaypoint(wp.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
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
            
            {/* Corridor visualization */}
            {showCorridors && schoolCorridors.map(corridor => {
              const topLeft = getDisplayCoordinates(corridor.x, corridor.y);
              const bottomRight = getDisplayCoordinates(
                corridor.x + corridor.width, 
                corridor.y + corridor.height
              );
              
              return (
                <div
                  key={corridor.id}
                  className="absolute border-2 border-yellow-400 bg-yellow-100/20 pointer-events-none"
                  style={{
                    left: topLeft.x,
                    top: topLeft.y,
                    width: bottomRight.x - topLeft.x,
                    height: bottomRight.y - topLeft.y
                  }}
                  title={corridor.name}
                />
              );
            })}
            
            {/* Waypoints */}
            {(useStrategicWaypoints ? strategicWaypoints : waypoints).map(wp => {
              const { x, y } = getDisplayCoordinates(wp.x, wp.y);
              
              return (
                <div
                  key={wp.id}
                  className={`absolute w-3 h-3 border-2 border-white rounded-full shadow-lg pointer-events-none ${
                    useStrategicWaypoints ? 'bg-orange-500' : 'bg-blue-500'
                  }`}
                  style={{ left: x - 6, top: y - 6 }}
                  title={wp.name}
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
