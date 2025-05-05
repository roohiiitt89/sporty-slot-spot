
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isLoading: boolean;
  hasPermission: boolean | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    isLoading: true,
    hasPermission: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        isLoading: false,
        hasPermission: false
      }));
      return;
    }

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((permissionStatus) => {
        setState(prev => ({
          ...prev,
          hasPermission: permissionStatus.state === 'granted'
        }));

        // Watch for permission changes
        permissionStatus.onchange = () => {
          setState(prev => ({
            ...prev,
            hasPermission: permissionStatus.state === 'granted'
          }));
        };
      });

    const successHandler = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        isLoading: false,
        hasPermission: true
      });
    };

    const errorHandler = (error: GeolocationPositionError) => {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
        hasPermission: false
      }));
    };

    // Get position once
    navigator.geolocation.getCurrentPosition(successHandler, errorHandler);

    // Set up a watcher for position changes
    const watchId = navigator.geolocation.watchPosition(successHandler, errorHandler);

    // Clean up
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const requestPermission = () => {
    setState(prev => ({ ...prev, isLoading: true }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          isLoading: false,
          hasPermission: true
        });
        toast({
          title: "Location access granted",
          description: "We can now show venues near you.",
        });
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error: error.message,
          isLoading: false,
          hasPermission: false
        }));
        toast({
          title: "Location access denied",
          description: "We can't show personalized venue recommendations without your location.",
          variant: "destructive",
        });
      }
    );
  };

  return {
    ...state,
    requestPermission
  };
}

// Function to calculate distance between two points in km using Haversine formula
export function calculateDistance(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number | null {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  
  return distance;
}
