import React from 'react';
import { LocationCalibration } from '@/components/LocationCalibration';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Setup = () => {
  const navigate = useNavigate();

  const handleCalibrationUpdate = (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => {
    console.log('GPS bounds updated:', bounds);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Navigation
          </Button>
          <h1 className="text-3xl font-bold">Setup & Calibration</h1>
        </div>

        <div className="flex justify-center">
          <LocationCalibration onCalibrationUpdate={handleCalibrationUpdate} />
        </div>
      </div>
    </div>
  );
};

export default Setup;