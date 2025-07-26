import { Capacitor } from '@capacitor/core';
import { wifiPositioning } from './wifiPositioning';
import { gpsPositioning } from './gpsPositioning';
import { mockWiFiData } from './mockWiFiData';
import type { WiFiPositionResult } from '@/types/wifi';

export interface PositioningConfig {
  developmentMode: boolean;
  enableGPS: boolean;
  enableWiFi: boolean;
  preferredMethod: 'wifi' | 'gps' | 'auto';
  mockDataEnabled: boolean;
}

export class HybridPositioningService {
  private config: PositioningConfig = {
    developmentMode: !Capacitor.isNativePlatform(),
    enableGPS: true,
    enableWiFi: true,
    preferredMethod: 'auto',
    mockDataEnabled: !Capacitor.isNativePlatform()
  };

  private lastKnownPosition: WiFiPositionResult | null = null;
  private positionHistory: WiFiPositionResult[] = [];

  constructor() {
    this.initializeMockData();
  }

  private async initializeMockData(): Promise<void> {
    if (this.config.mockDataEnabled) {
      // Load mock fingerprints for development
      const mockFingerprints = mockWiFiData.generateMockFingerprints();
      
      // Clear existing and add mock fingerprints
      wifiPositioning.clearFingerprints();
      for (const fingerprint of mockFingerprints) {
        wifiPositioning['fingerprints'].push(fingerprint);
      }
      wifiPositioning['saveFingerprints']();
    }
  }

  async getCurrentPosition(): Promise<WiFiPositionResult | null> {
    const methods = this.getPositioningMethods();
    
    for (const method of methods) {
      try {
        const result = await this.tryPositioningMethod(method);
        if (result && result.accuracy > 0.1) { // Minimum accuracy threshold
          this.updatePositionHistory(result);
          this.lastKnownPosition = result;
          return result;
        }
      } catch (error) {
        console.warn(`Positioning method ${method} failed:`, error);
        continue;
      }
    }

    // Return last known position if all methods fail
    return this.lastKnownPosition;
  }

  private getPositioningMethods(): ('wifi' | 'gps')[] {
    if (this.config.preferredMethod === 'wifi') {
      return this.config.enableGPS ? ['wifi', 'gps'] : ['wifi'];
    }
    if (this.config.preferredMethod === 'gps') {
      return this.config.enableWiFi ? ['gps', 'wifi'] : ['gps'];
    }
    
    // Auto mode: prefer WiFi for indoor, GPS for outdoor
    return this.config.enableWiFi && this.config.enableGPS 
      ? ['wifi', 'gps'] 
      : this.config.enableWiFi 
        ? ['wifi'] 
        : ['gps'];
  }

  private async tryPositioningMethod(method: 'wifi' | 'gps'): Promise<WiFiPositionResult | null> {
    switch (method) {
      case 'wifi':
        if (this.config.mockDataEnabled) {
          return await this.getMockWiFiPosition();
        }
        return await wifiPositioning.estimatePosition();
      
      case 'gps':
        return await gpsPositioning.getCurrentPosition();
      
      default:
        return null;
    }
  }

  private async getMockWiFiPosition(): Promise<WiFiPositionResult | null> {
    // Simulate WiFi positioning with mock data
    const mockPosition: [number, number] = [400, 300]; // Default mock position
    const mockNetworks = mockWiFiData.simulateWiFiScan(mockPosition);
    
    // Use the existing WiFi positioning algorithm with mock data
    const originalScan = wifiPositioning.scanWiFiNetworks;
    wifiPositioning.scanWiFiNetworks = async () => mockNetworks;
    
    try {
      const result = await wifiPositioning.estimatePosition();
      return result;
    } finally {
      wifiPositioning.scanWiFiNetworks = originalScan;
    }
  }

  private updatePositionHistory(position: WiFiPositionResult): void {
    this.positionHistory.push(position);
    
    // Keep only last 10 positions for smoothing
    if (this.positionHistory.length > 10) {
      this.positionHistory = this.positionHistory.slice(-10);
    }
  }

  // Kalman-like filtering for position smoothing
  getSmoothedPosition(): WiFiPositionResult | null {
    if (this.positionHistory.length === 0) return null;
    if (this.positionHistory.length === 1) return this.positionHistory[0];

    const recent = this.positionHistory.slice(-3); // Use last 3 positions
    const weights = [0.2, 0.3, 0.5]; // Give more weight to recent positions
    
    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;
    let avgAccuracy = 0;

    recent.forEach((pos, index) => {
      const weight = weights[index] * pos.accuracy;
      totalWeight += weight;
      weightedX += pos.coordinates[0] * weight;
      weightedY += pos.coordinates[1] * weight;
      avgAccuracy += pos.accuracy;
    });

    if (totalWeight === 0) return this.lastKnownPosition;

    return {
      coordinates: [weightedX / totalWeight, weightedY / totalWeight],
      accuracy: avgAccuracy / recent.length,
      method: 'hybrid'
    };
  }

  getConfig(): PositioningConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<PositioningConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (updates.mockDataEnabled !== undefined) {
      this.initializeMockData();
    }
  }

  getPositionHistory(): WiFiPositionResult[] {
    return [...this.positionHistory];
  }

  clearHistory(): void {
    this.positionHistory = [];
    this.lastKnownPosition = null;
  }
}

export const hybridPositioning = new HybridPositioningService();
