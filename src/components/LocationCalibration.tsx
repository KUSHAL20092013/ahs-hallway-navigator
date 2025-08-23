import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Save, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CalibrationPoint {
  name: string;
  mapX: number;
  mapY: number;
  latitude: number;
  longitude: number;
}

interface LocationCalibrationProps {
  onCalibrationUpdate: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
}

export const LocationCalibration = ({ onCalibrationUpdate }: LocationCalibrationProps) => {
  const [calibrationPoints, setCalibrationPoints] = useState<CalibrationPoint[]>([
    { name: 'Northwest Corner', mapX: 0, mapY: 0, latitude: 0, longitude: 0 },
    { name: 'Southeast Corner', mapX: 1, mapY: 1, latitude: 0, longitude: 0 }
  ]);
  const { toast } = useToast();

  const updateCalibrationPoint = (index: number, field: keyof CalibrationPoint, value: string | number) => {
    const newPoints = [...calibrationPoints];
    newPoints[index] = { ...newPoints[index], [field]: value };
    setCalibrationPoints(newPoints);
  };

  const getCurrentPosition = (index: number) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateCalibrationPoint(index, 'latitude', position.coords.latitude);
          updateCalibrationPoint(index, 'longitude', position.coords.longitude);
          toast({
            title: "Location captured",
            description: `GPS coordinates saved for ${calibrationPoints[index].name}`,
          });
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Could not get GPS coordinates. Please enter them manually.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const saveCalibration = () => {
    if (calibrationPoints.some(point => point.latitude === 0 || point.longitude === 0)) {
      toast({
        title: "Incomplete calibration",
        description: "Please set GPS coordinates for all calibration points.",
        variant: "destructive"
      });
      return;
    }

    // Calculate bounds from calibration points
    const latitudes = calibrationPoints.map(p => p.latitude);
    const longitudes = calibrationPoints.map(p => p.longitude);

    const bounds = {
      north: Math.max(...latitudes),
      south: Math.min(...latitudes),
      east: Math.max(...longitudes),
      west: Math.min(...longitudes)
    };

    // Save to localStorage
    localStorage.setItem('schoolGPSBounds', JSON.stringify(bounds));
    
    onCalibrationUpdate(bounds);

    toast({
      title: "Calibration saved",
      description: "GPS calibration has been saved successfully.",
    });
  };

  const loadSavedCalibration = () => {
    const saved = localStorage.getItem('schoolGPSBounds');
    if (saved) {
      const bounds = JSON.parse(saved);
      toast({
        title: "Calibration loaded",
        description: "Previously saved GPS calibration has been loaded.",
      });
      return bounds;
    }
    return null;
  };

  React.useEffect(() => {
    loadSavedCalibration();
  }, []);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          GPS Calibration Setup
        </CardTitle>
        <CardDescription>
          Set up GPS coordinates to map your school's location to the floor plan image.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            To calibrate GPS positioning, you need to set at least two reference points on your school campus. 
            Go to the northwest and southeast corners of your building and capture GPS coordinates.
          </AlertDescription>
        </Alert>

        {calibrationPoints.map((point, index) => (
          <div key={index} className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">{point.name}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`mapX-${index}`}>Map X Position (0-1)</Label>
                <Input
                  id={`mapX-${index}`}
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={point.mapX}
                  onChange={(e) => updateCalibrationPoint(index, 'mapX', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor={`mapY-${index}`}>Map Y Position (0-1)</Label>
                <Input
                  id={`mapY-${index}`}
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={point.mapY}
                  onChange={(e) => updateCalibrationPoint(index, 'mapY', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`lat-${index}`}>Latitude</Label>
                <Input
                  id={`lat-${index}`}
                  type="number"
                  step="0.000001"
                  value={point.latitude}
                  onChange={(e) => updateCalibrationPoint(index, 'latitude', parseFloat(e.target.value))}
                  placeholder="e.g., 40.123456"
                />
              </div>
              <div>
                <Label htmlFor={`lng-${index}`}>Longitude</Label>
                <Input
                  id={`lng-${index}`}
                  type="number"
                  step="0.000001"
                  value={point.longitude}
                  onChange={(e) => updateCalibrationPoint(index, 'longitude', parseFloat(e.target.value))}
                  placeholder="e.g., -73.123456"
                />
              </div>
            </div>

            <Button 
              onClick={() => getCurrentPosition(index)}
              variant="outline"
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Capture Current GPS Position
            </Button>
          </div>
        ))}

        <Button onClick={saveCalibration} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Calibration
        </Button>
      </CardContent>
    </Card>
  );
};