import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Navigation, Trash2, Edit3, Download, Upload, Search, ZoomIn, ZoomOut } from 'lucide-react';
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
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState('');
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [zoom, setZoom] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

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
    } else if (isRoomMode) {
      const roomNumber = rooms.length + 1;
      const room: Room = {
        id: `room-${Date.now()}`,
        name: roomNumber.toString(),
        x,
        y
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
      exportDate: new Date().toISOString()
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

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
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
          
          {isWaypointMode && (
            <div className="flex gap-2">
              <Input
                placeholder="Waypoint name"
                value={newPointName}
                onChange={(e) => setNewPointName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && setNewPointName('')}
              />
            </div>
          )}
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
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative max-w-full max-h-full">
            <img 
              ref={imageRef}
              src="/school-floorplan.jpg" 
              alt="School Floor Plan"
              className="max-w-full max-h-full object-contain cursor-crosshair transition-transform duration-200"
              onClick={handleImageClick}
              draggable={false}
              style={{ transform: `scale(${zoom})` }}
            />
            
            {/* Waypoints */}
            {waypoints.map(wp => (
              <div
                key={wp.id}
                className="absolute w-3 h-3 bg-orange-500 border-2 border-white rounded-full shadow-lg"
                style={{ left: wp.x * zoom - 6, top: wp.y * zoom - 6 }}
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
                style={{ left: room.x * zoom - 8, top: room.y * zoom - 8 }}
                onClick={() => selectRoom(room)}
                title={room.name}
              />
            ))}
            
            {/* Route Line */}
            {route.length > 1 && (
              <svg className="absolute inset-0 pointer-events-none">
                <polyline
                  points={route.map(wp => `${wp.x * zoom},${wp.y * zoom}`).join(' ')}
                  fill="none"
                  stroke="hsl(214, 84%, 56%)"
                  strokeWidth="3"
                  strokeOpacity="0.8"
                />
              </svg>
            )}
          </div>
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
            {isWaypointMode ? 'Enter waypoint name, then click to place corridor points' :
             isRoomMode ? 'Click to place rooms (auto-numbered 1, 2, 3...)' :
             'Select mode to start placing points'}
          </p>
        </div>
      </div>
    </div>
  );
};