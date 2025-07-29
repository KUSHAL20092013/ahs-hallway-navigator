import defaultData from '@/data/defaultNavigationData.json';

export interface NavigationData {
  waypoints: Array<{
    id: string;
    name: string;
    coordinates: [number, number];
    type: string;
  }>;
  rooms: Array<{
    id: string;
    name: string;
    building: string;
    floor: number;
    coordinates: [number, number];
    type: string;
  }>;
  paths: Array<{
    id: string;
    from: string;
    to: string;
    waypoints: Array<[number, number]>;
    bidirectional: boolean;
  }>;
  version: string;
}

const STORAGE_KEY = 'school-navigation-data';

export class NavigationDataService {
  static loadData(): NavigationData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate data structure
        if (parsed.waypoints && parsed.rooms && parsed.paths && parsed.version) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load stored navigation data:', error);
    }
    
    // Return default data if nothing stored or invalid
    return defaultData as NavigationData;
  }

  static saveData(data: NavigationData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save navigation data:', error);
    }
  }

  static exportData(data: NavigationData): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'school-navigation-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  static async importData(file: File): Promise<NavigationData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.waypoints && data.rooms && data.paths) {
            resolve(data);
          } else {
            reject(new Error('Invalid navigation data format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }

  static resetToDefault(): NavigationData {
    const data = defaultData as NavigationData;
    this.saveData(data);
    return data;
  }

  static clearData(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}