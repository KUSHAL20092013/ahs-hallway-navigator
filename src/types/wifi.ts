export interface WiFiNetwork {
  ssid: string;
  bssid: string;
  rssi: number; // Signal strength in dBm
  frequency: number;
  timestamp: number;
}

export interface WiFiFingerprint {
  id: string;
  locationId: string;
  coordinates: [number, number];
  networks: WiFiNetwork[];
  timestamp: number;
  collectedBy?: string;
}

export interface LocationWaypoint {
  id: string;
  name: string;
  coordinates: [number, number];
  type: 'entrance' | 'hallway' | 'room' | 'junction';
  building: string;
  floor: number;
}

export interface WiFiPositionResult {
  coordinates: [number, number];
  accuracy: number; // Confidence level 0-1
  nearestWaypoint?: LocationWaypoint;
  method: 'wifi' | 'gps' | 'manual' | 'hybrid' | 'browser';
}