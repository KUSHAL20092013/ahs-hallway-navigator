// if you are not using a json file for your project, you can write coordinates in a typescript file which is more complex. 
import { Room } from '@/hooks/useSchoolNavigation';

export type { Room };

export const schoolRooms: Room[] = [
  // Building 1 Level 1 - Classrooms
  { id: '101', name: 'Room 101', building: 'Building 1', floor: 1, coordinates: [25, 45], type: 'classroom' },
  { id: '102', name: 'Room 102', building: 'Building 1', floor: 1, coordinates: [30, 45], type: 'classroom' },
  { id: '103', name: 'Room 103', building: 'Building 1', floor: 1, coordinates: [35, 45], type: 'classroom' },
  { id: '104', name: 'Room 104', building: 'Building 1', floor: 1, coordinates: [25, 50], type: 'classroom' },
  { id: '105', name: 'Room 105', building: 'Building 1', floor: 1, coordinates: [30, 50], type: 'classroom' },

  // Building 1 Level 2 - Classrooms
  { id: '201', name: 'Room 201', building: 'Building 1', floor: 2, coordinates: [25, 35], type: 'classroom' },
  { id: '202', name: 'Room 202', building: 'Building 1', floor: 2, coordinates: [30, 35], type: 'classroom' },
  { id: '203', name: 'Room 203', building: 'Building 1', floor: 2, coordinates: [35, 35], type: 'classroom' },
  { id: '204', name: 'Room 204', building: 'Building 1', floor: 2, coordinates: [25, 40], type: 'classroom' },
  { id: '205', name: 'Room 205', building: 'Building 1', floor: 2, coordinates: [30, 40], type: 'classroom' },

  // Building 2 Level 1 - Classrooms
  { id: '301', name: 'Room 301', building: 'Building 2', floor: 1, coordinates: [65, 45], type: 'classroom' },
  { id: '302', name: 'Room 302', building: 'Building 2', floor: 1, coordinates: [70, 45], type: 'classroom' },
  { id: '303', name: 'Room 303', building: 'Building 2', floor: 1, coordinates: [75, 45], type: 'classroom' },
  { id: '304', name: 'Room 304', building: 'Building 2', floor: 1, coordinates: [65, 50], type: 'classroom' },
  { id: '305', name: 'Room 305', building: 'Building 2', floor: 1, coordinates: [70, 50], type: 'classroom' },

  // Building 2 Level 2 - Classrooms
  { id: '401', name: 'Room 401', building: 'Building 2', floor: 2, coordinates: [65, 35], type: 'classroom' },
  { id: '402', name: 'Room 402', building: 'Building 2', floor: 2, coordinates: [70, 35], type: 'classroom' },
  { id: '403', name: 'Room 403', building: 'Building 2', floor: 2, coordinates: [75, 35], type: 'classroom' },

  // 500s Wing - Science Classrooms
  { id: '501', name: 'Room 501', building: 'Science Wing', floor: 1, coordinates: [40, 20], type: 'classroom' },
  { id: '502', name: 'Room 502', building: 'Science Wing', floor: 1, coordinates: [45, 20], type: 'classroom' },
  { id: '503', name: 'Room 503', building: 'Science Wing', floor: 1, coordinates: [50, 20], type: 'classroom' },
  { id: '504', name: 'Room 504', building: 'Science Wing', floor: 1, coordinates: [55, 20], type: 'classroom' },

  // 700s Wing - Upper Level Classrooms
  { id: '701', name: 'Room 701', building: 'Main Building', floor: 1, coordinates: [45, 25], type: 'classroom' },
  { id: '702', name: 'Room 702', building: 'Main Building', floor: 1, coordinates: [50, 25], type: 'classroom' },
  { id: '703', name: 'Room 703', building: 'Main Building', floor: 1, coordinates: [55, 25], type: 'classroom' },
  { id: '704', name: 'Room 704', building: 'Main Building', floor: 1, coordinates: [60, 25], type: 'classroom' },

  // Science Labs
  { id: 'CHEM1', name: 'Chemistry Lab 1', building: 'Science Wing', floor: 1, coordinates: [40, 35], type: 'lab' },
  { id: 'CHEM2', name: 'Chemistry Lab 2', building: 'Science Wing', floor: 1, coordinates: [45, 35], type: 'lab' },
  { id: 'BIO1', name: 'Biology Lab 1', building: 'Science Wing', floor: 1, coordinates: [50, 35], type: 'lab' },
  { id: 'BIO2', name: 'Biology Lab 2', building: 'Science Wing', floor: 1, coordinates: [55, 35], type: 'lab' },
  { id: 'PHYS', name: 'Physics Lab', building: 'Science Wing', floor: 1, coordinates: [60, 35], type: 'lab' },

  // Special Facilities
  { id: 'POOL', name: 'Swimming Pool', building: 'Athletics', floor: 1, coordinates: [80, 60], type: 'facility' },
  { id: 'THEATRE', name: 'Theatre', building: 'Arts Building', floor: 1, coordinates: [20, 60], type: 'facility' },
  { id: 'LIBRARY', name: 'Library', building: 'Main Building', floor: 1, coordinates: [45, 50], type: 'facility' },
  { id: 'GYM', name: 'Gymnasium', building: 'Athletics', floor: 1, coordinates: [85, 45], type: 'facility' },
  { id: 'CAFE', name: 'Cafeteria', building: 'Main Building', floor: 1, coordinates: [50, 55], type: 'facility' },
  { id: 'OLDCAFE', name: 'Old Cafeteria', building: 'Main Building', floor: 1, coordinates: [45, 55], type: 'facility' },
  { id: 'SAC', name: 'Student Activity Center', building: 'Main Building', floor: 1, coordinates: [55, 55], type: 'facility' },
  { id: 'COMMONS', name: 'Faculty Commons', building: 'Main Building', floor: 1, coordinates: [50, 50], type: 'facility' },

  // Administrative Offices
  { id: 'ADMIN', name: 'Main Office', building: 'Main Building', floor: 1, coordinates: [45, 45], type: 'office' },
  { id: 'PRINCIPAL', name: 'Principal Office', building: 'Main Building', floor: 1, coordinates: [47, 45], type: 'office' },
  { id: 'COUNSELOR', name: 'Counseling Office', building: 'Main Building', floor: 1, coordinates: [43, 45], type: 'office' },
  { id: 'NURSE', name: 'Nurse Office', building: 'Main Building', floor: 1, coordinates: [49, 45], type: 'office' },
];

export const getRoomsByType = (type: Room['type']): Room[] => {
  return schoolRooms.filter(room => room.type === type);
};

export const getRoomsByBuilding = (building: string): Room[] => {
  return schoolRooms.filter(room => room.building === building);
};

export const getRoomsByFloor = (floor: number): Room[] => {
  return schoolRooms.filter(room => room.floor === floor);
};

export const findRoomById = (id: string): Room | undefined => {
  return schoolRooms.find(room => room.id === id);
};

export const searchRooms = (query: string): Room[] => {
  const lowercaseQuery = query.toLowerCase();
  return schoolRooms.filter(room =>
    room.name.toLowerCase().includes(lowercaseQuery) ||
    room.id.toLowerCase().includes(lowercaseQuery) ||
    room.building.toLowerCase().includes(lowercaseQuery)
  );
};
