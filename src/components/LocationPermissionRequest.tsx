
import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { Card, CardContent } from '@/components/ui/card';

interface LocationPermissionRequestProps {
  onPermissionGranted?: () => void;
}

export function LocationPermissionRequest({ onPermissionGranted }: LocationPermissionRequestProps) {
  const { hasPermission, requestPermission, isLoading } = useGeolocation();

  const handleRequestPermission = () => {
    requestPermission();
    if (onPermissionGranted) {
      onPermissionGranted();
    }
  };

  // Don't show if we already have permission or if it's still determining
  if (hasPermission === true || hasPermission === null) return null;

  return (
    <Card className="bg-gradient-to-r from-navy-dark to-navy-light border-0 shadow-lg overflow-hidden">
      <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-indigo/20 flex items-center justify-center">
            <MapPin className="h-6 w-6 text-indigo-light" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Discover venues near you</h3>
            <p className="text-gray-300">Allow location access to find the closest sports venues</p>
          </div>
        </div>
        <button
          onClick={handleRequestPermission}
          disabled={isLoading}
          className={`flex items-center gap-2 bg-indigo text-white px-4 py-2 rounded-md transition-all hover:bg-indigo-dark ${
            isLoading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          <Navigation className="h-4 w-4" />
          {isLoading ? 'Loading...' : 'Enable Location'}
        </button>
      </CardContent>
    </Card>
  );
}
