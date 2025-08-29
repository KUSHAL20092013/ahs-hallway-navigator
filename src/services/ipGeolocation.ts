import type { WiFiPositionResult } from '@/types/wifi';

export interface IPLocationResult {
  lat: number;
  lon: number;
  city: string;
  country: string;
  region: string;
  accuracy: string;
  status: string;
}

export class IPGeolocationService {
  private lastKnownPosition: WiFiPositionResult | null = null;

  async getCurrentPosition(): Promise<WiFiPositionResult | null> {
    try {
      console.log('Getting location via IP geolocation...');
      
      // Using ip-api.com free service (no API key required)
      const response = await fetch('http://ip-api.com/json/?fields=status,message,country,region,city,lat,lon,accuracy');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: IPLocationResult = await response.json();
      console.log('IP geolocation result:', data);
      
      if (data.status === 'success') {
        const result: WiFiPositionResult = {
          coordinates: [data.lon, data.lat],
          accuracy: 0.3, // IP geolocation is generally less accurate
          method: 'ip-geolocation'
        };
        
        this.lastKnownPosition = result;
        return result;
      } else {
        console.error('IP geolocation failed:', data);
        return null;
      }
    } catch (error) {
      console.error('IP geolocation service error:', error);
      return this.lastKnownPosition;
    }
  }

  getLastKnownPosition(): WiFiPositionResult | null {
    return this.lastKnownPosition;
  }
}

export const ipGeolocation = new IPGeolocationService();