import type { WiFiPositionResult } from '@/types/wifi';

export interface IPLocationResult {
  lat: number;
  lon: number;
  city: string;
  country: string;
  region: string;
  success: boolean;
}

export class IPGeolocationService {
  private lastKnownPosition: WiFiPositionResult | null = null;

  async getCurrentPosition(): Promise<WiFiPositionResult | null> {
    try {
      console.log('Getting location via IP geolocation...');
      
      // Try ipapi.co first (HTTPS)
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          console.log('IP geolocation result (ipapi.co):', data);
          
          if (data.latitude && data.longitude) {
            const result: WiFiPositionResult = {
              coordinates: [data.longitude, data.latitude],
              accuracy: 0.05, // ~20km accuracy for IP geolocation
              method: 'ip-geolocation'
            };
            
            this.lastKnownPosition = result;
            return result;
          }
        }
      } catch (apiError) {
        console.log('ipapi.co failed, trying backup...');
      }

      // Fallback to ipwho.is (HTTPS)
      const response = await fetch('https://ipwho.is/');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('IP geolocation result (ipwho.is):', data);
      
      if (data.success && data.latitude && data.longitude) {
        const result: WiFiPositionResult = {
          coordinates: [data.longitude, data.latitude],
          accuracy: 0.05, // ~20km accuracy for IP geolocation
          method: 'ip-geolocation'
        };
        
        this.lastKnownPosition = result;
        return result;
      } else {
        console.error('IP geolocation failed:', data);
        return this.lastKnownPosition;
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