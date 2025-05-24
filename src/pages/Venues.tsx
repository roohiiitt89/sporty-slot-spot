import React, { useState, useEffect } from 'react';
import { MapPin, Star, Filter, Search, Navigation, Clock, ArrowUpDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { BookSlotModal } from '../components/BookSlotModal';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation, calculateDistance } from '@/hooks/use-geolocation';
import { toast } from '@/components/ui/use-toast';

interface Venue {
  id: string;
  name: string;
  location: string;
  description: string;
  image_url: string;
  rating: number;
  latitude: number | null;
  longitude: number | null;
  facilities?: string[];
  distance?: number | null;
}

interface Sport {
  id: string;
  name: string;
}

const Venues: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { latitude, longitude, hasPermission } = useGeolocation();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<'distance' | 'rating'>('distance');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sportId = params.get('sport');
    
    if (sportId) {
      setSelectedSports([sportId]);
    }
    
    fetchVenues();
    fetchSports();
  }, [location.search, latitude, longitude]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams(location.search);
      const sportId = params.get('sport');
      
      let query = supabase
        .from('venues')
        .select(`
          id, 
          name, 
          location, 
          description, 
          image_url, 
          rating,
          latitude,
          longitude
        `)
        .eq('is_active', true);
      
      if (sportId) {
        const { data: courtData, error: courtError } = await supabase
          .from('courts')
          .select('venue_id')
          .eq('sport_id', sportId)
          .eq('is_active', true);
        
        if (courtError) throw courtError;
        
        if (courtData && courtData.length > 0) {
          const venueIds = courtData.map(court => court.venue_id);
          query = query.in('id', venueIds);
        } else {
          setVenues([]);
          setLoading(false);
          return;
        }
      }
        
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        const venuesWithDistance = data.map(venue => {
          // Calculate real distance if we have coordinates
          const distance = calculateDistance(
            latitude,
            longitude,
            venue.latitude,
            venue.longitude
          );

          return {
            ...venue,
            distance: distance,
            facilities: [] as string[]
          };
        });
        
        // Sort by distance if we have user location and by rating otherwise
        if (latitude && longitude) {
          venuesWithDistance.sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
        } else {
          venuesWithDistance.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }
        
        for (const venue of venuesWithDistance) {
          const { data: courtsData, error: courtsError } = await supabase
            .from('courts')
            .select(`
              sports:sport_id (
                id, 
                name
              )
            `)
            .eq('venue_id', venue.id)
            .eq('is_active', true);
            
          if (!courtsError && courtsData) {
            const facilities = Array.from(
              new Set(courtsData.map(court => court.sports?.name || ''))
            ).filter(Boolean);
            
            venue.facilities = facilities as string[];
          }
        }
        
        setVenues(venuesWithDistance);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name')
        .eq('is_active', true);
        
      if (error) throw error;
      
      if (data) {
        setSports(data);
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
    }
  };

  const toggleSportFilter = (sport: string) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter(s => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const clearFilters = () => {
    setSelectedSports([]);
    setRatingFilter(0);
    setSearchTerm('');
    navigate('/venues');
  };

  const applyFilters = () => {
    setIsFilterOpen(false);
    if (selectedSports.length === 1) {
      navigate(`/venues?sport=${selectedSports[0]}`);
    } else {
      fetchVenues();
    }
  };

  const toggleSortOption = () => {
    const newSortOption = sortOption === 'distance' ? 'rating' : 'distance';
    setSortOption(newSortOption);
    
    const sortedVenues = [...venues];
    if (newSortOption === 'distance' && latitude && longitude) {
      sortedVenues.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else {
      sortedVenues.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    
    setVenues(sortedVenues);
  };

  const enableLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast({
            title: "Location access granted",
            description: "We can now show venues near you.",
          });
          setTimeout(() => fetchVenues(), 1000); // Refresh venues after getting position
        },
        (error) => {
          toast({
            title: "Location access denied",
            description: "We can't sort venues by distance without your location.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (venue.description && venue.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSport = selectedSports.length === 0 || 
                        (venue.facilities && venue.facilities.some(facility => 
                          sports
                            .filter(sport => selectedSports.includes(sport.id))
                            .map(sport => sport.name)
                            .includes(facility)
                        ));
    
    const matchesRating = venue.rating >= ratingFilter;
    
    return matchesSearch && matchesSport && matchesRating;
  });

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="bg-gradient-to-b from-[#1e3b2c] to-black pt-32 pb-12 md:pb-16 relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1485395037613-e83d5c1f5290?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] opacity-10 bg-center bg-cover"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">Explore Venues</h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto text-center mb-8">
            Find the perfect sports venue for your next game or training session
          </p>
          
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[#1e3b2c]" />
              </div>
              <input
                type="text"
                placeholder="Search venues by name, location, or facilities"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full p-4 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e3b2c] bg-white backdrop-blur-sm"
              />
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="absolute inset-y-0 right-0 px-4 flex items-center bg-[#1e3b2c] text-white rounded-r-md hover:bg-[#2a4d3a] transition-colors border border-[#1e3b2c]"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>
            
            {isFilterOpen && (
              <div className="mt-4 bg-white/90 backdrop-blur-md p-6 rounded-md shadow-lg animate-fade-in border border-[#1e3b2c]/30">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#1e3b2c] mb-3">Filter by Sport</h3>
                  <div className="flex flex-wrap gap-2">
                    {sports.map(sport => (
                      <button
                        key={sport.id}
                        onClick={() => toggleSportFilter(sport.id)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedSports.includes(sport.id)
                            ? 'bg-[#1e3b2c] text-white'
                            : 'bg-gray-100 text-[#1e3b2c] hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {sport.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#1e3b2c] mb-3">Minimum Rating</h3>
                  <div className="flex items-center space-x-2">
                    {[0, 3, 3.5, 4, 4.5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setRatingFilter(rating)}
                        className={`px-3 py-1 rounded-md ${
                          ratingFilter === rating
                            ? 'bg-[#1e3b2c] text-white'
                            : 'bg-gray-100 text-[#1e3b2c] hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {rating === 0 ? 'Any' : `${rating}+`}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-gray-700 mr-2 hover:text-[#1e3b2c] transition-colors"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-[#1e3b2c] text-white rounded-md hover:bg-[#2a4d3a] transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            {loading ? 'Loading venues...' : `${filteredVenues.length} Venues Found`}
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={toggleSortOption}
              className="px-3 py-1.5 bg-[#1e3b2c] text-white rounded-md hover:bg-[#2a4d3a] transition-colors flex items-center"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Sort by {sortOption === 'distance' ? 'Rating' : 'Distance'}
            </button>
            
            {!hasPermission && (
              <button
                onClick={enableLocation}
                className="px-3 py-1.5 border border-[#1e3b2c] text-[#1e3b2c] rounded-md hover:bg-[#1e3b2c]/10 transition-colors flex items-center"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Enable Location
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1e3b2c]"></div>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="text-center py-16 bg-navy-light rounded-xl border border-[#1e3b2c]/20">
            <h3 className="text-2xl font-semibold text-white mb-2">No venues found</h3>
            <p className="text-gray-300 mb-6">Try adjusting your filters or search term</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-[#1e3b2c] text-white rounded-md hover:bg-[#2a4d3a] transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVenues.map((venue) => (
              <div
                key={venue.id}
                className="bg-navy-light rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-navy/30 hover:border-[#1e3b2c]/50 h-full flex flex-col group"
              >
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={venue.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'} 
                    alt={venue.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full shadow flex items-center">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 mr-1" />
                    <span className="text-xs font-bold text-navy">{venue.rating?.toFixed(1) || '4.5'}</span>
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-[#2def80] transition-colors">
                    {venue.name}
                  </h3>
                  <div className="flex items-center gap-1 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300 truncate">{venue.location}</span>
                  </div>
                  {venue.distance !== null && (
                    <div className="mb-2 flex items-center">
                      <Navigation className="w-3.5 h-3.5 text-[#2def80] mr-1" />
                      <span className="text-sm text-gray-300">
                        {venue.distance < 1 
                          ? `${(venue.distance * 1000).toFixed(0)} m away` 
                          : `${venue.distance.toFixed(1)} km away`}
                      </span>
                    </div>
                  )}
                  {venue.facilities && venue.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {venue.facilities.slice(0, 2).map(facility => (
                        <span
                          key={facility}
                          className="inline-block text-xs bg-navy/60 text-[#2def80] px-2 py-0.5 rounded-full border border-[#1e3b2c]/30"
                        >
                          {facility}
                        </span>
                      ))}
                      {venue.facilities.length > 2 && (
                        <span className="inline-block text-xs text-gray-400">
                          +{venue.facilities.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate(`/venues/${venue.id}`)}
                      className="py-2 border border-[#1e3b2c] text-[#2def80] rounded-md text-sm font-medium hover:bg-[#1e3b2c]/20 transition-all"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setIsBookModalOpen(true)}
                      className="py-2 bg-[#1e3b2c] text-white rounded-md text-sm font-medium hover:bg-[#2a4d3a] transition-colors"
                    >
                      Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <footer className="bg-[#1e3b2c] text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 Grid2Play. All rights reserved.</p>
        </div>
      </footer>
      
      {isBookModalOpen && (
        <BookSlotModal 
          open={isBookModalOpen}
          onOpenChange={setIsBookModalOpen}
          selectedDate={new Date()}
          selectedCourt={null}
          hourlyRate={null}
          onBookingComplete={() => {}}
          allowCashPayments={true}
          onClose={() => setIsBookModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Venues;
