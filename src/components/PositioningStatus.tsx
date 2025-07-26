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
      case 'wifi': return 'bg-primary';
      case 'gps': return 'bg-accent';
      case 'hybrid': return 'bg-gradient-patriotic';
      default: return 'bg-muted';
    }
  };

  const formatAccuracy = (accuracy: number) => {
    return `${Math.round(accuracy * 100)}%`;
  };

  const smoothedPosition = getSmoothedPosition();

  return (
    <div className="space-y-4">
      {/* Current Position Status */}
      <Card className="card-mobile border-primary/20 shadow-[--shadow-patriotic]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold bg-gradient-patriotic bg-clip-text text-transparent">
              Position Status
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="h-10 w-10 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="h-10 w-10 p-0"
              >
                <History className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <span className="text-sm font-medium text-foreground">Current Method:</span>
            {currentPosition ? (
              <Badge 
                variant="secondary" 
                className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border-primary/20"
              >
                {getMethodIcon(currentPosition.method)}
                {currentPosition.method.toUpperCase()}
              </Badge>
            ) : (
              <Badge variant="outline" className="border-accent/50 text-accent">No Signal</Badge>
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
            variant="patriotic"
            size="mobile"
            className="w-full font-semibold"
          >
            {isScanning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Scanning...
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5 mr-2" />
                Scan Position
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      <Collapsible open={showSettings} onOpenChange={setShowSettings}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            size="mobile"
            className="w-full justify-between border-primary/20 hover:bg-primary/5"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Positioning Settings
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="card-mobile mt-2 border-primary/10">
            <CardContent className="pt-6 space-y-6">
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
          <Button 
            variant="outline" 
            size="mobile"
            className="w-full justify-between border-accent/20 hover:bg-accent/5"
          >
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Position History ({positionHistory.length})
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="card-mobile mt-2 border-accent/10">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent Positions</CardTitle>
                <Button 
                  variant="america" 
                  size="sm" 
                  onClick={clearHistory}
                  className="h-10 px-4"
                >
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