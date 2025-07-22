import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NavigationButton } from '@/components/ui/navigation-button';
import { MapPin, Navigation, Search, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  coordinates: [number, number];
  type: 'classroom' | 'lab' | 'office' | 'facility';
}

const schoolRooms: Room[] = [
  { id: 'A101', name: 'Math 101', building: 'A', floor: 1, coordinates: [-122.4194, 37.7749], type: 'classroom' },
  { id: 'A102', name: 'English 102', building: 'A', floor: 1, coordinates: [-122.4184, 37.7759], type: 'classroom' },
  { id: 'A201', name: 'History 201', building: 'A', floor: 2, coordinates: [-122.4174, 37.7769], type: 'classroom' },
  { id: 'B101', name: 'Chemistry Lab', building: 'B', floor: 1, coordinates: [-122.4164, 37.7779], type: 'lab' },
  { id: 'B102', name: 'Physics Lab', building: 'B', floor: 1, coordinates: [-122.4154, 37.7789], type: 'lab' },
  { id: 'C101', name: 'Art Studio', building: 'C', floor: 1, coordinates: [-122.4144, 37.7799], type: 'classroom' },
  { id: 'CAFE', name: 'Cafeteria', building: 'Main', floor: 1, coordinates: [-122.4134, 37.7809], type: 'facility' },
  { id: 'GYM', name: 'Gymnasium', building: 'Athletics', floor: 1, coordinates: [-122.4124, 37.7819], type: 'facility' },
  { id: 'LIB', name: 'Library', building: 'Main', floor: 2, coordinates: [-122.4114, 37.7829], type: 'facility' },
  { id: 'OFF1', name: 'Principal Office', building: 'Admin', floor: 1, coordinates: [-122.4104, 37.7839], type: 'office' },
];

export const SchoolMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedStart, setSelectedStart] = useState<Room | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Room | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [mapboxToken, setMapboxToken] = useState('');
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

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-122.4194, 37.7749], // School center
      zoom: 17,
      pitch: 0,
      bearing: 0,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      // Add hallway network visualization first
      addHallwayNetworkVisualization();
      
      // Add room markers
      schoolRooms.forEach(room => {
        const color = getRoomColor(room.type);
        
        // Create custom marker
        const el = document.createElement('div');
        el.className = 'room-marker';
        el.style.backgroundColor = color;
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        const marker = new mapboxgl.Marker(el)
          .setLngLat(room.coordinates)
          .addTo(map.current!);

        // Add popup
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-2">
              <h3 class="font-semibold text-primary">${room.name}</h3>
              <p class="text-sm text-muted-foreground">Room ${room.id} • ${room.building} Building • Floor ${room.floor}</p>
            </div>
          `);

        marker.setPopup(popup);

        // Add click handler
        el.addEventListener('click', () => {
          if (!selectedStart) {
            setSelectedStart(room);
            toast.success(`Starting point set: ${room.name}`);
          } else if (!selectedEnd && room.id !== selectedStart.id) {
            setSelectedEnd(room);
            toast.success(`Destination set: ${room.name}`);
          }
        });
      });

      toast.success('School map loaded! Blue dots show hallway network.');
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  const addHallwayNetworkVisualization = () => {
    if (!map.current) return;

    // Add hallway points as small blue markers
    hallwayNetwork.forEach((coord, index) => {
      const el = document.createElement('div');
      el.className = 'hallway-marker';
      el.style.backgroundColor = 'hsl(214, 84%, 56%)';
      el.style.width = '8px';
      el.style.height = '8px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
      el.style.opacity = '0.8';

      const marker = new mapboxgl.Marker(el)
        .setLngLat(coord)
        .addTo(map.current!);

      // Add popup showing hallway point info
      const popup = new mapboxgl.Popup({ offset: 15 })
        .setHTML(`
          <div class="p-2">
            <h4 class="font-semibold text-primary">Hallway Point ${index + 1}</h4>
            <p class="text-xs text-muted-foreground">Corridor coordinates</p>
          </div>
        `);

      marker.setPopup(popup);
    });
  };

  const getRoomColor = (type: Room['type']) => {
    switch (type) {
      case 'classroom': return 'hsl(214, 84%, 56%)';
      case 'lab': return 'hsl(43, 96%, 56%)';
      case 'office': return 'hsl(142, 76%, 36%)';
      case 'facility': return 'hsl(0, 84%, 60%)';
      default: return 'hsl(214, 84%, 56%)';
    }
  };

  const calculateRoute = () => {
    if (!selectedStart || !selectedEnd) {
      toast.error('Please select both starting point and destination');
      return;
    }

// Calculate route that follows hallways instead of going through walls
    const pathCoordinates = calculateHallwayPath(selectedStart.coordinates, selectedEnd.coordinates);
    const totalDistance = calculatePathDistance(pathCoordinates);
    
    const route = {
      distance: totalDistance,
      duration: Math.ceil(totalDistance * 1000 / 1.4), // 1.4 m/s walking speed
      start: selectedStart,
      end: selectedEnd,
      path: pathCoordinates
    };

    setCurrentRoute(route);

    // Draw route line on map
    if (map.current) {
      // Remove existing route
      if (map.current.getSource('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }

      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: pathCoordinates
          }
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': 'hsl(214, 84%, 56%)',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      // Fit map to show entire route
      const bounds = new mapboxgl.LngLatBounds();
      pathCoordinates.forEach(coord => bounds.extend(coord));
      map.current.fitBounds(bounds, { padding: 50 });
    }

    toast.success(`Route calculated! ${Math.round(route.distance * 1000)}m, ${route.duration} seconds`);
  };

  const getDistance = (coord1: [number, number], coord2: [number, number]) => {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Define hallway network based on actual floor plan corridors
  const hallwayNetwork: [number, number][] = [
    // Main central corridor (horizontal)
    [-122.4200, 37.7749], // West end of main corridor
    [-122.4194, 37.7749], // Central junction
    [-122.4188, 37.7749], // East main corridor
    [-122.4182, 37.7749], // Further east
    
    // North corridor from central junction
    [-122.4194, 37.7749], // Central junction
    [-122.4194, 37.7755], // North corridor
    [-122.4194, 37.7761], // Further north
    [-122.4194, 37.7767], // North end
    
    // South corridor from central junction  
    [-122.4194, 37.7749], // Central junction
    [-122.4194, 37.7743], // South corridor
    [-122.4194, 37.7737], // Further south
    
    // East wing corridor
    [-122.4182, 37.7749], // From main corridor
    [-122.4176, 37.7755], // East wing junction
    [-122.4170, 37.7761], // East wing north
    [-122.4164, 37.7767], // East wing far north
    
    // West wing corridor
    [-122.4200, 37.7749], // From main corridor
    [-122.4206, 37.7755], // West wing junction
    [-122.4212, 37.7761], // West wing north
    [-122.4218, 37.7767], // West wing far north
    
    // Additional connecting corridors
    [-122.4188, 37.7755], // Mid-corridor north connection
    [-122.4188, 37.7743], // Mid-corridor south connection
  ];

  const calculateHallwayPath = (start: [number, number], end: [number, number]): [number, number][] => {
    // Use A* pathfinding algorithm to find route through hallway network
    const path = findPathThroughHallways(start, end);
    return path;
  };

  const findPathThroughHallways = (start: [number, number], end: [number, number]): [number, number][] => {
    // Find the closest hallway points to start and end locations
    const startHallway = findClosestHallwayPoint(start);
    const endHallway = findClosestHallwayPoint(end);
    
    if (!startHallway || !endHallway) {
      return [start, end]; // Fallback to direct path
    }
    
    // Build path: start -> closest hallway -> navigate through hallways -> end hallway -> end
    const hallwayPath = findHallwayRoute(startHallway, endHallway);
    
    const fullPath: [number, number][] = [start];
    
    // Add path to first hallway point (if not already there)
    if (!coordinatesEqual(start, startHallway)) {
      fullPath.push(startHallway);
    }
    
    // Add the hallway navigation path (excluding start point to avoid duplicates)
    if (hallwayPath.length > 1) {
      fullPath.push(...hallwayPath.slice(1));
    }
    
    // Add path from last hallway point to destination (if not already there)
    if (!coordinatesEqual(end, endHallway)) {
      fullPath.push(end);
    }
    
    return fullPath;
  };

  const findHallwayRoute = (start: [number, number], end: [number, number]): [number, number][] => {
    // Simple pathfinding through the hallway network
    // In a real implementation, you'd use A* or Dijkstra's algorithm
    
    // For now, route through central junction for cross-wing navigation
    const center: [number, number] = [-122.4194, 37.7749];
    
    if (coordinatesEqual(start, end)) {
      return [start];
    }
    
    // Check if both points are in the same corridor section
    if (areInSameCorridor(start, end)) {
      return [start, end];
    }
    
    // Route through center for different corridor sections
    return [start, center, end];
  };

  const areInSameCorridor = (coord1: [number, number], coord2: [number, number]): boolean => {
    // Check if both coordinates are in the same corridor (same x or y within tolerance)
    const tolerance = 0.0008;
    return (Math.abs(coord1[0] - coord2[0]) < tolerance) || (Math.abs(coord1[1] - coord2[1]) < tolerance);
  };

  const findClosestHallwayPoint = (coord: [number, number]): [number, number] | null => {
    let closest = hallwayNetwork[0];
    let minDistance = getDistance(coord, closest);
    
    for (const hallwayPoint of hallwayNetwork) {
      const distance = getDistance(coord, hallwayPoint);
      if (distance < minDistance) {
        minDistance = distance;
        closest = hallwayPoint;
      }
    }
    
    return closest;
  };

  const coordinatesEqual = (coord1: [number, number], coord2: [number, number]): boolean => {
    return Math.abs(coord1[0] - coord2[0]) < 0.0001 && Math.abs(coord1[1] - coord2[1]) < 0.0001;
  };

  const calculatePathDistance = (path: [number, number][]): number => {
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      totalDistance += getDistance(path[i], path[i + 1]);
    }
    return totalDistance;
  };

  const clearRoute = () => {
    setSelectedStart(null);
    setSelectedEnd(null);
    setCurrentRoute(null);
    
    if (map.current && map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    
    toast.success('Route cleared');
  };

  const selectRoom = (room: Room) => {
    if (!selectedStart) {
      setSelectedStart(room);
      toast.success(`Starting point: ${room.name}`);
    } else if (!selectedEnd && room.id !== selectedStart.id) {
      setSelectedEnd(room);
      toast.success(`Destination: ${room.name}`);
    }
    setSearchQuery('');
    setShowSearch(false);
  };

  if (!mapboxToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <Card className="w-full max-w-md p-6 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Setup Required</h2>
          <p className="text-muted-foreground mb-4">
            Please enter your Mapbox public token to use the school navigation system.
          </p>
          <Input
            type="text"
            placeholder="Mapbox public token"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="mb-4"
          />
          <p className="text-xs text-muted-foreground">
            Get your token from <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-background">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />
      
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
                        {room.id} • {room.building} Building • Floor {room.floor}
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Route Info */}
      {(selectedStart || selectedEnd) && (
        <Card className="absolute top-32 left-4 right-4 z-10 p-4">
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
                  Distance: {Math.round(currentRoute.distance * 1000)}m • 
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