import { Capacitor } from '@capacitor/core';
import { CapacitorWifi } from 'capacitor-wifi';
import type { WiFiNetwork, WiFiFingerprint, WiFiPositionResult, LocationWaypoint } from '@/types/wifi';

export class WiFiPositioningService {
  private fingerprints: WiFiFingerprint[] = [];
  private isScanning = false;

  async isWiFiAvailable(): Promise<boolean> {
    return Capacitor.isNativePlatform();
  }

  async scanWiFiNetworks(): Promise<WiFiNetwork[]> {
    if (!await this.isWiFiAvailable()) {
      throw new Error('WiFi scanning only available on native platforms');
    }

    try {
      const result = await CapacitorWifi.getWifiNetworks();
      return result.networks.map(network => ({
        ssid: network.ssid || 'Hidden Network',
        bssid: network.bssid || '',
        rssi: network.level || -100,
        frequency: network.frequency || 2400,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('WiFi scan failed:', error);
      throw error;
    }
  }

  async collectFingerprint(locationId: string, coordinates: [number, number]): Promise<WiFiFingerprint | null> {
    const networks = await this.scanWiFiNetworks();
    
    if (networks.length === 0) {
      return null;
    }

    const fingerprint: WiFiFingerprint = {
      id: `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      locationId,
      coordinates,
      networks,
      timestamp: Date.now()
    };

    this.fingerprints.push(fingerprint);
    this.saveFingerprints();
    
    return fingerprint;
  }

  async estimatePosition(): Promise<WiFiPositionResult | null> {
    const currentNetworks = await this.scanWiFiNetworks();
    
    if (currentNetworks.length === 0 || this.fingerprints.length === 0) {
      return null;
    }

    // Simple weighted k-nearest neighbors algorithm
    const similarities = this.fingerprints.map(fp => ({
      fingerprint: fp,
      similarity: this.calculateSimilarity(currentNetworks, fp.networks)
    }));

    // Sort by similarity and take top 3
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topMatches = similarities.slice(0, 3).filter(s => s.similarity > 0);

    if (topMatches.length === 0) {
      return null;
    }

    // Calculate weighted average position
    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;

    topMatches.forEach(match => {
      const weight = match.similarity;
      totalWeight += weight;
      weightedX += match.fingerprint.coordinates[0] * weight;
      weightedY += match.fingerprint.coordinates[1] * weight;
    });

    const estimatedCoords: [number, number] = [
      weightedX / totalWeight,
      weightedY / totalWeight
    ];

    const accuracy = Math.min(topMatches[0].similarity, 1);

    return {
      coordinates: estimatedCoords,
      accuracy,
      method: 'wifi'
    };
  }

  private calculateSimilarity(networks1: WiFiNetwork[], networks2: WiFiNetwork[]): number {
    const bssidMap1 = new Map(networks1.map(n => [n.bssid, n.rssi]));
    const bssidMap2 = new Map(networks2.map(n => [n.bssid, n.rssi]));
    
    const commonBssids = [...bssidMap1.keys()].filter(bssid => bssidMap2.has(bssid));
    
    if (commonBssids.length === 0) {
      return 0;
    }

    let totalDifference = 0;
    commonBssids.forEach(bssid => {
      const rssi1 = bssidMap1.get(bssid)!;
      const rssi2 = bssidMap2.get(bssid)!;
      totalDifference += Math.abs(rssi1 - rssi2);
    });

    // Normalize similarity (lower difference = higher similarity)
    const avgDifference = totalDifference / commonBssids.length;
    const similarity = Math.max(0, 1 - (avgDifference / 100)); // Assume max difference is 100 dBm
    
    return similarity;
  }

  private saveFingerprints(): void {
    try {
      localStorage.setItem('wifi_fingerprints', JSON.stringify(this.fingerprints));
    } catch (error) {
      console.error('Failed to save fingerprints:', error);
    }
  }

  loadFingerprints(): void {
    try {
      const stored = localStorage.getItem('wifi_fingerprints');
      if (stored) {
        this.fingerprints = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load fingerprints:', error);
      this.fingerprints = [];
    }
  }

  getFingerprints(): WiFiFingerprint[] {
    return [...this.fingerprints];
  }

  clearFingerprints(): void {
    this.fingerprints = [];
    localStorage.removeItem('wifi_fingerprints');
  }
}

export const wifiPositioning = new WiFiPositioningService();