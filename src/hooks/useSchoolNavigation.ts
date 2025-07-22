
import { useState, useCallback } from 'react';

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  coordinates: [number, number];
  type: 'classroom' | 'lab' | 'office' | 'facility';
}

export interface Route {
  distance: number;
  duration: number;
  start: Room;
  end: Room;
  path?: [number, number][];
}

export const useSchoolNavigation = () => {
  const [selectedStart, setSelectedStart] = useState<Room | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Room | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);

  const calculateDistance = useCallback((room1: Room, room2: Room): number => {
    const dx = room2.coordinates[0] - room1.coordinates[0];
    const dy = room2.coordinates[1] - room1.coordinates[1];
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const calculateRoute = useCallback((start: Room, end: Room): Route => {
    const distance = calculateDistance(start, end);
    return {
      distance: distance * 10, // Convert to approximate meters
      duration: Math.ceil(distance * 2), // Approximate walking time in seconds
      start,
      end,
    };
  }, [calculateDistance]);

  const selectRoom = useCallback((room: Room) => {
    if (!selectedStart) {
      setSelectedStart(room);
    } else if (!selectedEnd && room.id !== selectedStart.id) {
      setSelectedEnd(room);
      const route = calculateRoute(selectedStart, room);
      setCurrentRoute(route);
    }
  }, [selectedStart, selectedEnd, calculateRoute]);

  const clearSelection = useCallback(() => {
    setSelectedStart(null);
    setSelectedEnd(null);
    setCurrentRoute(null);
  }, []);

  return {
    selectedStart,
    selectedEnd,
    currentRoute,
    selectRoom,
    clearSelection,
    calculateRoute,
  };
};
