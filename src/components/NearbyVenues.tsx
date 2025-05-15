
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, ArrowRight, Navigation, Loader2 } from 'lucide-react';
import { useGeolocation, calculateDistance } from '@/hooks/use-geolocation';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface Venue {
  id: string;
  name: string;
  location: string;
  image_url: string | null;
  rating: number;
  latitude: number | null;
  longitude: number | null;
  distance?: number | null;
}

export function NearbyVenues() {
  const navigate = useNavigate();
  const {
    latitude,
    longitude,
    hasPermission,
    isLoading: locationLoading
  } = useGeolocation();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Only fetch venues if we have the user's location
    if (latitude && longitude) {
      fetchNearbyVenues();
    } else if (hasPermission === false) {
      // If permission denied, still fetch venues but without distance calculation
      fetchNearbyVenues();
    }
  }, [latitude, longitude, hasPermission]);

  const fetchNearbyVenues = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('venues').select('id, name, location, image_url, rating, latitude, longitude').eq('is_active', true).order('created_at', {
        ascending: false
      }).limit(5);
      if (error) throw error;
      if (data) {
        let venuesWithDistance = data.map(venue => {
          // Calculate real distance if we have coordinates
          const distance = calculateDistance(latitude, longitude, venue.latitude, venue.longitude);
          return {
            ...venue,
            distance: distance
          };
        });

        // Sort by distance if we have user location
        if (latitude && longitude) {
          venuesWithDistance.sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
        }
        setVenues(venuesWithDistance.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching nearby venues:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission && !venues.length) return null;

  return (
    <div className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div>
            <h2 className="text-xl md:text-3xl font-bold text-white flex items-center">
              <Navigation className="mr-2 h-5 w-5 md:h-6 md:w-6 text-indigo-light" />
              Near You
            </h2>
            <p className="text-sm md:text-base text-gray-300">Discover sports venues close to your location</p>
          </div>
          <button 
            onClick={() => navigate('/venues')} 
            className="text-indigo-light text-sm md:text-base flex items-center hover:text-white transition-colors"
          >
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </button>
        </div>

        {locationLoading || loading ? (
          <div className="flex justify-center items-center py-8 md:py-12">
            <Loader2 className="h-8 w-8 text-indigo animate-spin" />
          </div>
        ) : venues.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {venues.map(venue => (
              <div 
                key={venue.id} 
                onClick={() => navigate(`/venues/${venue.id}`)}
                className="cursor-pointer group transform transition-transform duration-200 hover:scale-[1.02]"
              >
                <Card className="bg-navy-light border-navy hover:border-indigo transition-all duration-300 overflow-hidden h-full shadow-lg">
                  <div className={`${isMobile ? 'h-32' : 'h-48'} overflow-hidden relative`}>
                    <img 
                      src={venue.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'} 
                      alt={venue.name} 
                      className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-60"></div>
                    
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md flex items-center">
                      <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 fill-current mr-1" />
                      <span className="text-xs md:text-sm font-bold text-navy-dark">{venue.rating?.toFixed(1) || '4.5'}</span>
                    </div>
                  </div>
                  
                  <CardContent className="p-3 md:p-5 text-white">
                    <h3 className="text-sm md:text-xl font-bold mb-1 md:mb-2 text-gradient group-hover:text-indigo-light transition-colors truncate">
                      {venue.name}
                    </h3>
                    
                    <div className="flex items-start gap-1 md:gap-2 mb-2 md:mb-3">
                      <MapPin className="h-3 w-3 md:h-5 md:w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs md:text-sm text-gray-300 line-clamp-1">
                        {venue.location}
                      </span>
                    </div>
                    
                    {venue.distance !== null && (
                      <div className="mt-2 md:mt-4 flex items-center justify-between">
                        <div className="flex items-center bg-indigo/20 px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                          <Navigation className="h-3 w-3 md:h-4 md:w-4 text-indigo-light mr-1" />
                          <span className="text-xs md:text-sm font-medium text-white">
                            {venue.distance < 1 ? `${(venue.distance * 1000).toFixed(0)} m` : `${venue.distance.toFixed(1)} km`} away
                          </span>
                        </div>
                        <span className="text-indigo-light text-xs md:text-sm group-hover:translate-x-1 transition-transform duration-300">
                          Details →
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 md:py-12 bg-navy-light rounded-lg">
            <p className="text-white text-lg mb-4">No nearby venues found</p>
            <button 
              onClick={() => navigate('/venues')} 
              className="px-4 py-2 bg-indigo text-white rounded-md hover:bg-indigo-dark transition-colors"
            >
              Browse All Venues
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
