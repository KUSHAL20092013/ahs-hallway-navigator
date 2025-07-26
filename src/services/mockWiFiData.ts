import type { WiFiNetwork, WiFiFingerprint } from '@/types/wifi';
import { schoolRooms } from '@/data/schoolRooms';

// Mock school WiFi networks
const MOCK_SCHOOL_NETWORKS: Omit<WiFiNetwork, 'timestamp'>[] = [
  { ssid: 'AHS-MainNet', bssid: '00:1A:2B:3C:4D:01', rssi: -45, frequency: 2400 },
  { ssid: 'AHS-Guest', bssid: '00:1A:2B:3C:4D:02', rssi: -55, frequency: 2400 },
  { ssid: 'AHS-Admin', bssid: '00:1A:2B:3C:4D:03', rssi: -65, frequency: 5000 },
  { ssid: 'AHS-Labs', bssid: '00:1A:2B:3C:4D:04', rssi: -50, frequency: 5000 },
  { ssid: 'AHS-Library', bssid: '00:1A:2B:3C:4D:05', rssi: -60, frequency: 2400 },
  { ssid: 'AHS-Cafeteria', bssid: '00:1A:2B:3C:4D:06', rssi: -70, frequency: 2400 },
  { ssid: 'AHS-Gym', bssid: '00:1A:2B:3C:4D:07', rssi: -75, frequency: 5000 },
  { ssid: 'AHS-Office', bssid: '00:1A:2B:3C:4D:08', rssi: -58, frequency: 2400 }
];

export class MockWiFiDataService {
  // Generate realistic WiFi data based on location
  generateMockNetworks(coordinates: [number, number]): WiFiNetwork[] {
    const timestamp = Date.now();
    
    return MOCK_SCHOOL_NETWORKS.map(network => {
      // Calculate distance-based RSSI variation
      const baseRssi = network.rssi;
      const variation = (Math.random() - 0.5) * 20; // ±10 dBm variation
      const rssi = Math.max(-100, Math.min(-20, baseRssi + variation));

      return {
        ...network,
        rssi,
        timestamp
      };
    });
  }

  // Generate mock fingerprints for all school rooms
  generateMockFingerprints(): WiFiFingerprint[] {
    return schoolRooms.map(room => ({
      id: `mock_fp_${room.id}_${Date.now()}`,
      locationId: room.id,
      coordinates: room.coordinates,
      networks: this.generateMockNetworks(room.coordinates),
      timestamp: Date.now() - Math.random() * 86400000 // Random time in last 24h
    }));
  }

  // Simulate WiFi scan with position-aware signal strength
  simulateWiFiScan(userPosition: [number, number]): WiFiNetwork[] {
    const timestamp = Date.now();
    
    // Find nearest rooms to adjust signal strength
    const nearestRooms = schoolRooms
      .map(room => ({
        room,
        distance: this.calculateDistance(userPosition, room.coordinates)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

    return MOCK_SCHOOL_NETWORKS.map(network => {
      // Base signal strength with distance-based attenuation
      let rssi = network.rssi;
      
      // Adjust based on proximity to rooms
      if (nearestRooms.length > 0) {
        const nearestDistance = nearestRooms[0].distance;
        const distanceAttenuation = Math.min(nearestDistance * 2, 30); // Max 30 dBm attenuation
        rssi -= distanceAttenuation;
      }

      // Add realistic noise
      const noise = (Math.random() - 0.5) * 10;
      rssi = Math.max(-100, Math.min(-20, rssi + noise));

      return {
        ...network,
        rssi,
        timestamp
      };
    });
  }

  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const dx = coord2[0] - coord1[0];
    const dy = coord2[1] - coord1[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
}

export const mockWiFiData = new MockWiFiDataService();