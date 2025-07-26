import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, MapPin, Wifi, Satellite, Settings, History } from 'lucide-react';
import { useHybridPositioning } from '@/hooks/useHybridPositioning';

export function PositioningStatus() {
  const {
    currentPosition,
    isScanning,
    config,
    positionHistory,
    scanPosition,
    getSmoothedPosition,
    updateConfig,
    clearHistory
  } = useHybridPositioning();

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'wifi': return <Wifi className="h-4 w-4" />;
      case 'gps': return <Satellite className="h-4 w-4" />;
      case 'hybrid': return <MapPin className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'wifi': return 'bg-blue-500';
      case 'gps': return 'bg-green-500';
      case 'hybrid': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatAccuracy = (accuracy: number) => {
    return `${Math.round(accuracy * 100)}%`;
  };

  const smoothedPosition = getSmoothedPosition();

  return (
    <div className="space-y-4">
      {/* Current Position Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Position Status</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Method:</span>
            {currentPosition ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                {getMethodIcon(currentPosition.method)}
                {currentPosition.method.toUpperCase()}
              </Badge>
            ) : (
              <Badge variant="outline">No Signal</Badge>
            )}
          </div>

          {currentPosition && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Accuracy:</span>
                <Badge variant="outline">
                  {formatAccuracy(currentPosition.accuracy)}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Coordinates:</span>
                <span className="text-sm font-mono">
                  {currentPosition.coordinates[0].toFixed(1)}, {currentPosition.coordinates[1].toFixed(1)}
                </span>
              </div>

              {smoothedPosition && smoothedPosition !== currentPosition && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Smoothed:</span>
                  <span className="text-sm font-mono">
                    {smoothedPosition.coordinates[0].toFixed(1)}, {smoothedPosition.coordinates[1].toFixed(1)}
                  </span>
                </div>
              )}
            </>
          )}

          <Button 
            onClick={scanPosition} 
            disabled={isScanning}
            className="w-full"
          >
            {isScanning ? 'Scanning...' : 'Scan Position'}
          </Button>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      <Collapsible open={showSettings} onOpenChange={setShowSettings}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            Positioning Settings
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="wifi-enabled">WiFi Positioning</Label>
                <Switch
                  id="wifi-enabled"
                  checked={config.enableWiFi}
                  onCheckedChange={(checked) => updateConfig({ enableWiFi: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="gps-enabled">GPS Positioning</Label>
                <Switch
                  id="gps-enabled"
                  checked={config.enableGPS}
                  onCheckedChange={(checked) => updateConfig({ enableGPS: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="mock-data">Mock Data (Development)</Label>
                <Switch
                  id="mock-data"
                  checked={config.mockDataEnabled}
                  onCheckedChange={(checked) => updateConfig({ mockDataEnabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Preferred Method</Label>
                <Select
                  value={config.preferredMethod}
                  onValueChange={(value: 'wifi' | 'gps' | 'auto') => 
                    updateConfig({ preferredMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="wifi">WiFi</SelectItem>
                    <SelectItem value="gps">GPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Position History */}
      <Collapsible open={showHistory} onOpenChange={setShowHistory}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            Position History ({positionHistory.length})
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Positions</CardTitle>
                <Button variant="outline" size="sm" onClick={clearHistory}>
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {positionHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No position history</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {positionHistory.slice(-10).reverse().map((pos, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(pos.method)}
                        <span className="font-mono">
                          {pos.coordinates[0].toFixed(1)}, {pos.coordinates[1].toFixed(1)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatAccuracy(pos.accuracy)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}