//irrelevant currently
// import { useState, useEffect, useCallback } from 'react';
// import { wifiPositioning } from '@/services/wifiPositioning';
// import type { WiFiPositionResult, WiFiFingerprint } from '@/types/wifi';

// export const useWiFiPositioning = () => {
//   const [isAvailable, setIsAvailable] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [currentPosition, setCurrentPosition] = useState<WiFiPositionResult | null>(null);
//   const [fingerprints, setFingerprints] = useState<WiFiFingerprint[]>([]);

//   useEffect(() => {
//     const checkAvailability = async () => {
//       const available = await wifiPositioning.isWiFiAvailable();
//       setIsAvailable(available);
//     };

//     wifiPositioning.loadFingerprints();
//     setFingerprints(wifiPositioning.getFingerprints());
//     checkAvailability();
//   }, []);

//   const scanCurrentPosition = useCallback(async (): Promise<WiFiPositionResult | null> => {
//     if (!isAvailable) return null;

//     setIsScanning(true);
//     try {
//       const position = await wifiPositioning.estimatePosition();
//       setCurrentPosition(position);
//       return position;
//     } catch (error) {
//       console.error('WiFi positioning failed:', error);
//       return null;
//     } finally {
//       setIsScanning(false);
//     }
//   }, [isAvailable]);

//   const collectFingerprint = useCallback(async (
//     locationId: string, 
//     coordinates: [number, number]
//   ): Promise<WiFiFingerprint | null> => {
//     if (!isAvailable) return null;

//     try {
//       const fingerprint = await wifiPositioning.collectFingerprint(locationId, coordinates);
//       if (fingerprint) {
//         setFingerprints(wifiPositioning.getFingerprints());
//       }
//       return fingerprint;
//     } catch (error) {
//       console.error('Fingerprint collection failed:', error);
//       return null;
//     }
//   }, [isAvailable]);

//   const clearAllFingerprints = useCallback(() => {
//     wifiPositioning.clearFingerprints();
//     setFingerprints([]);
//     setCurrentPosition(null);
//   }, []);

//   return {
//     isAvailable,
//     isScanning,
//     currentPosition,
//     fingerprints,
//     scanCurrentPosition,
//     collectFingerprint,
//     clearAllFingerprints
//   };
// };
