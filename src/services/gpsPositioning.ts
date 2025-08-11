import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import type { WiFiPositionResult } from '@/types/wifi';

export class GPSPositioningService {
  private lastKnownPosition: WiFiPositionResult | null = null;

  //Checks for geolocation permission
  async isGPSAvailable(): Promise<boolean> {
    try {
      const permissions = await Geolocation.checkPermissions();
      return permissions.location === 'granted' || permissions.location === 'prompt';
    } catch {
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions.location === 'granted';
    } catch {
      return false;
    }
  }

  async getCurrentPosition(): Promise<WiFiPositionResult | null> {
    if (!await this.isGPSAvailable()) {
      if (!await this.requestPermissions()) {
        return null;
      }
    }

    //trying to find geolocation of user. 
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      });

      //finds current latitude and longitude
      const result: WiFiPositionResult = {
        coordinates: [position.coords.longitude, position.coords.latitude],
        accuracy: Math.min(position.coords.accuracy || 100, 100) / 100, // Normalize to 0-1
        method: 'gps'
      };

      //fail case
      this.lastKnownPosition = result;
      return result;
    } catch (error) {
      console.error('GPS positioning failed:', error);
      return this.lastKnownPosition;
    }
  }

  getLastKnownPosition(): WiFiPositionResult | null {
    return this.lastKnownPosition;
  }
}

export const gpsPositioning = new GPSPositioningService();
