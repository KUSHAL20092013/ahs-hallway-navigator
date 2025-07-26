declare module 'capacitor-wifi' {
  export interface WiFiNetworkResult {
    ssid?: string;
    bssid?: string;
    level?: number;
    frequency?: number;
  }

  export interface GetWifiNetworksResult {
    networks: WiFiNetworkResult[];
  }

  export interface CapacitorWifi {
    getWifiNetworks(): Promise<GetWifiNetworksResult>;
  }

  export const CapacitorWifi: CapacitorWifi;
}