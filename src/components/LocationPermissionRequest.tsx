import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface LocationPermissionRequestProps {
  onPermissionGranted: () => void;
  onPermissionDenied?: () => void;
}

export const LocationPermissionRequest: React.FC<LocationPermissionRequestProps> = ({
  onPermissionGranted,
  onPermissionDenied
}) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = () => {
    setIsRequesting(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
          console.log('Location permission granted:', position);
          setIsRequesting(false);
          if (onPermissionGranted) {
            onPermissionGranted();
          }
        },
        // Error callback
        (error) => {
          console.error('Error getting location:', error);
          setIsRequesting(false);
          if (onPermissionDenied) {
            onPermissionDenied();
          }
        },
        { timeout: 10000, maximumAge: 60000 }
      );
    } else {
      console.error('Geolocation is not supported by this browser');
      setIsRequesting(false);
      if (onPermissionDenied) {
        onPermissionDenied();
      }
    }
  };

  const handleSkip = () => {
    if (onPermissionDenied) {
      onPermissionDenied();
    }
  };

  return (
    <Card className="border-none bg-black animate-fade-in shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-shrink-0 bg-[#1E3B2C]/80 p-3 rounded-full">
            <MapPin className="h-6 w-6 text-[#2def80]" />
          </div>
          
          <div className="flex-grow text-center sm:text-left">
            <h3 className="font-semibold text-[#2def80]">Discover venues near you</h3>
            <p className="text-sm text-gray-300">
              Allow location access to see sports venues in your area
            </p>
          </div>
          
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button 
              variant="outline"
              onClick={handleSkip}
              className="px-4 border-[#1E3B2C] text-[#2def80] hover:bg-[#1E3B2C]/10 hover:text-white transition-colors"
            >
              Skip
            </Button>
            
            <Button 
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="bg-[#1E3B2C] hover:bg-[#2def80] text-white px-4 transition-colors"
            >
              {isRequesting ? 'Requesting...' : 'Allow Location'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
