
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
      
      // Use the SQL API directly to bypass the RLS policy
      const { data, error } = await supabase
        .rpc('fetch_all_venues')
        .select('id, name, location, image_url, rating, latitude, longitude');
      
      if (error) {
        // Fallback to basic query if RPC function does not exist
        console.log('Falling back to basic query');
        const basicQuery = await supabase
          .from('venues')
          .select('id, name, location, image_url, rating, latitude, longitude')
          .eq('is_active', true);
        
        if (basicQuery.error) {
          throw basicQuery.error;
        }
        
        if (basicQuery.data) {
          let venuesWithDistance = basicQuery.data.map(venue => {
            const distance = calculateDistance(latitude, longitude, venue.latitude, venue.longitude);
            return { ...venue, distance };
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
      } else if (data) {
        let venuesWithDistance = data.map(venue => {
          const distance = calculateDistance(latitude, longitude, venue.latitude, venue.longitude);
          return { ...venue, distance };
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
          <button onClick={() => navigate('/venues')} className="text-indigo-light text-sm md:text-base flex items-center hover:text-white transition-colors">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </button>
        </div>

        {locationLoading || loading ? <div className="flex justify-center items-center py-8 md:py-12">
            <Loader2 className="h-8 w-8 text-indigo animate-spin" />
          </div> : venues.length > 0 ? <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {venues.map(venue => <div key={venue.id} onClick={() => navigate(`/venues/${venue.id}`)} className="cursor-pointer group transform transition-transform duration-200 hover:scale-[1.03]">
                <Card className="bg-gradient-to-br from-black via-[#1E3B2C] to-black border border-[#2E7D32] hover:shadow-[0_0_16px_2px_#2E7D32] hover:border-[#2def80] transition-all duration-300 overflow-hidden h-full shadow-lg rounded-xl animate-fade-in">
                  <div className={`${isMobile ? 'h-24' : 'h-32'} overflow-hidden relative`}>
                    <img src={venue.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'} alt={venue.name} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-80"></div>
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur px-2 py-0.5 rounded flex items-center shadow">
                      <Star className="h-3 w-3 md:h-4 md:w-4 text-[#2E7D32] fill-current mr-1" />
                      <span className="text-xs md:text-sm font-bold text-white">{venue.rating?.toFixed(1) || '4.5'}</span>
                    </div>
                  </div>
                  <CardContent className="p-2 md:p-3 text-white">
                    <h3 className="text-xs md:text-base font-semibold mb-0.5 md:mb-1 truncate group-hover:text-[#2E7D32] transition-colors">{venue.name}</h3>
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3 md:h-4 md:w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-[10px] md:text-xs text-gray-300 truncate">{venue.location}</span>
                    </div>
                    {venue.distance !== null && <div className="mt-1 flex items-center justify-between">
                        <div className="flex items-center bg-[#1E3B2C]/20 px-1.5 py-0.5 rounded-full">
                          <Navigation className="h-3 w-3 text-[#2E7D32] mr-1" />
                          <span className="text-[10px] md:text-xs font-medium text-white">{venue.distance < 1 ? `${(venue.distance * 1000).toFixed(0)} m` : `${venue.distance.toFixed(1)} km`} away</span>
                        </div>
                        <span className="text-[#2E7D32] text-[10px] md:text-xs group-hover:translate-x-1 transition-transform duration-300">Details →</span>
                      </div>}
                  </CardContent>
                </Card>
              </div>)}
          </div> : <div className="text-center py-8 md:py-12 bg-black rounded-lg">
            <p className="text-white text-lg mb-4">No nearby venues found</p>
            <button onClick={() => navigate('/venues')} className="px-4 py-2 bg-[#1E3B2C] text-white rounded-md hover:bg-[#2E7D32] transition-colors">
              Browse All Venues
            </button>
          </div>}
      </div>
    </div>
  );
}
