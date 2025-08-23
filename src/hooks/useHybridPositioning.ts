import { useState, useEffect, useCallback } from 'react';
import { hybridPositioning, type PositioningConfig } from '@/services/hybridPositioning';
import type { WiFiPositionResult } from '@/types/wifi';

export const useHybridPositioning = () => {
  const [currentPosition, setCurrentPosition] = useState<WiFiPositionResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [config, setConfig] = useState<PositioningConfig>(hybridPositioning.getConfig());
  const [positionHistory, setPositionHistory] = useState<WiFiPositionResult[]>([]);

  useEffect(() => {
    // Load initial position history
    setPositionHistory(hybridPositioning.getPositionHistory());
  }, []);

  const scanPosition = useCallback(async (): Promise<WiFiPositionResult | null> => {
    setIsScanning(true);
    
    try {
      const position = await hybridPositioning.getCurrentPosition();
      setCurrentPosition(position);
      setPositionHistory(hybridPositioning.getPositionHistory());
      return position;
    } catch (error) {
      console.error('Position scanning failed:', error);
      return null;
    } finally {
      setIsScanning(false);
    }
  }, []);

  const getSmoothedPosition = useCallback((): WiFiPositionResult | null => {
    return hybridPositioning.getSmoothedPosition();
  }, []);

  const updateConfig = useCallback((updates: Partial<PositioningConfig>) => {
    hybridPositioning.updateConfig(updates);
    setConfig(hybridPositioning.getConfig());
  }, []);

  const clearHistory = useCallback(() => {
    hybridPositioning.clearHistory();
    setCurrentPosition(null);
    setPositionHistory([]);
  }, []);

  const startContinuousScanning = useCallback((intervalMs: number = 5000) => {
    const interval = setInterval(async () => {
      if (!isScanning) {
        await scanPosition();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [scanPosition, isScanning]);

  return {
    currentPosition,
    isScanning,
    config,
    positionHistory,
    scanPosition,
    getSmoothedPosition,
    updateConfig,
    clearHistory,
    startContinuousScanning
  };
};