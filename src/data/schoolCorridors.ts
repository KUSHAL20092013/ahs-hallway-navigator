// Define walkable corridor areas as rectangles (x, y, width, height in percentage coordinates)
export interface Corridor {
  id: string;
  name: string;
  x: number; // top-left x coordinate (0-1)
  y: number; // top-left y coordinate (0-1)
  width: number; // width (0-1)
  height: number; // height (0-1)
}

// Strategic waypoint locations at corridor intersections and key navigation points
export interface StrategicWaypoint {
  id: string;
  name: string;
  x: number; // percentage coordinate (0-1)
  y: number; // percentage coordinate (0-1)
  type: 'intersection' | 'corridor' | 'entrance' | 'turn';
  connections: string[]; // IDs of waypoints this connects to
}

// Define the main corridors based on the school floorplan
export const schoolCorridors: Corridor[] = [
  // Main horizontal hallway (top)
  {
    id: 'main-hall-top',
    name: 'Main Hallway Top',
    x: 0.15,
    y: 0.25,
    width: 0.7,
    height: 0.08
  },
  // Main horizontal hallway (middle)
  {
    id: 'main-hall-middle',
    name: 'Main Hallway Middle',
    x: 0.15,
    y: 0.45,
    width: 0.7,
    height: 0.08
  },
  // Main horizontal hallway (bottom)
  {
    id: 'main-hall-bottom',
    name: 'Main Hallway Bottom',
    x: 0.15,
    y: 0.65,
    width: 0.7,
    height: 0.08
  },
  // Vertical connector (left side)
  {
    id: 'vertical-left',
    name: 'Left Vertical Corridor',
    x: 0.15,
    y: 0.25,
    width: 0.08,
    height: 0.48
  },
  // Vertical connector (right side)
  {
    id: 'vertical-right',
    name: 'Right Vertical Corridor',
    x: 0.77,
    y: 0.25,
    width: 0.08,
    height: 0.48
  },
  // Central vertical connector
  {
    id: 'vertical-center',
    name: 'Center Vertical Corridor',
    x: 0.46,
    y: 0.25,
    width: 0.08,
    height: 0.48
  }
];

// Strategic waypoints placed at key intersections and navigation points
export const strategicWaypoints: StrategicWaypoint[] = [
  // Top hallway waypoints
  {
    id: 'wp-top-left',
    name: 'Top Left Intersection',
    x: 0.19,
    y: 0.29,
    type: 'intersection',
    connections: ['wp-top-center', 'wp-left-middle']
  },
  {
    id: 'wp-top-center',
    name: 'Top Center Intersection',
    x: 0.50,
    y: 0.29,
    type: 'intersection',
    connections: ['wp-top-left', 'wp-top-right', 'wp-center-middle']
  },
  {
    id: 'wp-top-right',
    name: 'Top Right Intersection',
    x: 0.81,
    y: 0.29,
    type: 'intersection',
    connections: ['wp-top-center', 'wp-right-middle']
  },
  
  // Middle hallway waypoints
  {
    id: 'wp-left-middle',
    name: 'Left Middle Intersection',
    x: 0.19,
    y: 0.49,
    type: 'intersection',
    connections: ['wp-top-left', 'wp-center-middle', 'wp-left-bottom']
  },
  {
    id: 'wp-center-middle',
    name: 'Center Middle Intersection',
    x: 0.50,
    y: 0.49,
    type: 'intersection',
    connections: ['wp-top-center', 'wp-left-middle', 'wp-right-middle', 'wp-center-bottom']
  },
  {
    id: 'wp-right-middle',
    name: 'Right Middle Intersection',
    x: 0.81,
    y: 0.49,
    type: 'intersection',
    connections: ['wp-top-right', 'wp-center-middle', 'wp-right-bottom']
  },
  
  // Bottom hallway waypoints
  {
    id: 'wp-left-bottom',
    name: 'Left Bottom Intersection',
    x: 0.19,
    y: 0.69,
    type: 'intersection',
    connections: ['wp-left-middle', 'wp-center-bottom']
  },
  {
    id: 'wp-center-bottom',
    name: 'Center Bottom Intersection',
    x: 0.50,
    y: 0.69,
    type: 'intersection',
    connections: ['wp-center-middle', 'wp-left-bottom', 'wp-right-bottom']
  },
  {
    id: 'wp-right-bottom',
    name: 'Right Bottom Intersection',
    x: 0.81,
    y: 0.69,
    type: 'intersection',
    connections: ['wp-right-middle', 'wp-center-bottom']
  }
];

// Helper function to check if a point is within any corridor
export const isPointInCorridor = (x: number, y: number): boolean => {
  return schoolCorridors.some(corridor => 
    x >= corridor.x && 
    x <= corridor.x + corridor.width &&
    y >= corridor.y && 
    y <= corridor.y + corridor.height
  );
};

// Helper function to check if a line segment stays within corridors
export const isPathInCorridors = (x1: number, y1: number, x2: number, y2: number): boolean => {
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (!isPointInCorridor(x, y)) {
      return false;
    }
  }
  return true;
};