
import React, { useState, useEffect } from 'react';
import { MapPin, Star, Filter, Search, Navigation, Clock, ArrowUpDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { BookSlotModal } from '../components/BookSlotModal';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation, calculateDistance } from '@/hooks/use-geolocation';
import { toast } from 'react-hot-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
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
          toast.success("Location access granted");
          setTimeout(() => fetchVenues(), 1000);
        },
        (error) => {
          toast.error("Location access denied");
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
      
      <div className="bg-gradient-to-b from-emerald-900/20 to-black pt-20 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1485395037613-e83d5c1f5290?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] opacity-5 bg-center bg-cover"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl md:text-5xl'} font-bold text-white mb-2 text-center`}>
            Explore Venues
          </h1>
          <p className={`${isMobile ? 'text-sm' : 'text-xl'} text-gray-300 max-w-2xl mx-auto text-center mb-6`}>
            Find the perfect sports venue for your next game
          </p>
          
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400`} />
              </div>
              <input
                type="text"
                placeholder="Search venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 w-full ${isMobile ? 'p-3 text-sm' : 'p-4'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-900/80 backdrop-blur-sm text-white border border-emerald-900/30`}
              />
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`absolute inset-y-0 right-0 px-3 flex items-center bg-emerald-900/80 text-white rounded-r-lg hover:bg-emerald-800/80 transition-colors border border-emerald-900/30`}
              >
                <Filter className={`${isMobile ? 'h-4 w-4 mr-1' : 'h-5 w-5 mr-2'}`} />
                {!isMobile && 'Filters'}
              </button>
            </div>
            
            {isFilterOpen && (
              <div className="mt-4 bg-gray-900/90 backdrop-blur-md p-4 rounded-lg shadow-lg border border-emerald-900/30">
                <div className="mb-4">
                  <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-emerald-400 mb-3`}>Filter by Sport</h3>
                  <div className="flex flex-wrap gap-2">
                    {sports.map(sport => (
                      <button
                        key={sport.id}
                        onClick={() => toggleSportFilter(sport.id)}
                        className={`px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-sm'} ${
                          selectedSports.includes(sport.id)
                            ? 'bg-emerald-900/80 text-white'
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                        } transition-colors border border-emerald-900/20`}
                      >
                        {sport.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-emerald-400 mb-3`}>Rating</h3>
                  <div className="flex items-center space-x-2">
                    {[0, 3, 3.5, 4, 4.5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setRatingFilter(rating)}
                        className={`px-3 py-1 rounded-md ${isMobile ? 'text-xs' : 'text-sm'} ${
                          ratingFilter === rating
                            ? 'bg-emerald-900/80 text-white'
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                        } transition-colors border border-emerald-900/20`}
                      >
                        {rating === 0 ? 'Any' : `${rating}+`}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <button
                    onClick={clearFilters}
                    className={`px-3 py-1 text-gray-300 hover:text-emerald-400 transition-colors ${isMobile ? 'text-xs' : 'text-sm'}`}
                  >
                    Clear
                  </button>
                  <button
                    onClick={applyFilters}
                    className={`px-4 py-1 bg-emerald-900/80 text-white rounded-md hover:bg-emerald-800/80 transition-colors ${isMobile ? 'text-xs' : 'text-sm'}`}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex justify-between items-center">
          <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-white`}>
            {loading ? 'Loading...' : `${filteredVenues.length} Venues`}
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={toggleSortOption}
              className={`px-3 py-1.5 bg-emerald-900/80 text-white rounded-md hover:bg-emerald-800/80 transition-colors flex items-center ${isMobile ? 'text-xs' : 'text-sm'}`}
            >
              <ArrowUpDown className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
              {isMobile ? (sortOption === 'distance' ? 'Rating' : 'Distance') : `Sort by ${sortOption === 'distance' ? 'Rating' : 'Distance'}`}
            </button>
            
            {!hasPermission && (
              <button
                onClick={enableLocation}
                className={`px-3 py-1.5 border border-emerald-700/50 text-emerald-400 rounded-md hover:bg-emerald-900/20 transition-colors flex items-center ${isMobile ? 'text-xs' : 'text-sm'}`}
              >
                <Navigation className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                {!isMobile && 'Location'}
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-emerald-900/20">
            <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-semibold text-white mb-2`}>No venues found</h3>
            <p className={`text-gray-300 mb-4 ${isMobile ? 'text-sm' : ''}`}>Try adjusting your search</p>
            <button
              onClick={clearFilters}
              className={`px-4 py-2 bg-emerald-900/80 text-white rounded-md hover:bg-emerald-800/80 transition-colors ${isMobile ? 'text-sm' : ''}`}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
            {filteredVenues.map((venue) => (
              <div
                key={venue.id}
                className={`bg-gray-900/50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-emerald-900/20 hover:border-emerald-700/50 ${isMobile ? 'h-auto' : 'h-full'} flex ${isMobile ? 'flex-row' : 'flex-col'} group backdrop-blur-sm`}
              >
                <div className={`${isMobile ? 'w-24 h-20' : 'h-36'} relative overflow-hidden flex-shrink-0`}>
                  <img 
                    src={venue.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'} 
                    alt={venue.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  {!isMobile && (
                    <div className="absolute top-2 right-2 bg-emerald-900/80 backdrop-blur px-2 py-0.5 rounded-full shadow flex items-center">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 mr-1" />
                      <span className="text-xs font-bold text-white">{venue.rating?.toFixed(1) || '4.5'}</span>
                    </div>
                  )}
                </div>
                
                <div className={`${isMobile ? 'p-3 flex-1' : 'p-4'} flex flex-col ${isMobile ? 'justify-center' : 'flex-grow'}`}>
                  <div className="flex-1">
                    <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-white mb-1 line-clamp-1 group-hover:text-emerald-400 transition-colors`}>
                      {venue.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-gray-400 flex-shrink-0`} />
                      <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-300 truncate`}>{venue.location}</span>
                    </div>
                    
                    {isMobile && (
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 mr-1" />
                          <span className="text-xs text-white">{venue.rating?.toFixed(1) || '4.5'}</span>
                        </div>
                        {venue.distance !== null && (
                          <div className="flex items-center">
                            <Navigation className="w-3 h-3 text-emerald-400 mr-1" />
                            <span className="text-xs text-gray-300">
                              {venue.distance < 1 
                                ? `${(venue.distance * 1000).toFixed(0)}m` 
                                : `${venue.distance.toFixed(1)}km`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!isMobile && venue.distance !== null && (
                      <div className="mb-2 flex items-center">
                        <Navigation className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                        <span className="text-sm text-gray-300">
                          {venue.distance < 1 
                            ? `${(venue.distance * 1000).toFixed(0)} m away` 
                            : `${venue.distance.toFixed(1)} km away`}
                        </span>
                      </div>
                    )}
                    
                    {venue.facilities && venue.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {venue.facilities.slice(0, isMobile ? 1 : 2).map(facility => (
                          <span
                            key={facility}
                            className={`inline-block ${isMobile ? 'text-xs' : 'text-xs'} bg-emerald-900/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/30`}
                          >
                            {facility}
                          </span>
                        ))}
                        {venue.facilities.length > (isMobile ? 1 : 2) && (
                          <span className={`inline-block ${isMobile ? 'text-xs' : 'text-xs'} text-gray-400`}>
                            +{venue.facilities.length - (isMobile ? 1 : 2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className={`${isMobile ? 'grid grid-cols-2 gap-1' : 'mt-auto pt-3 grid grid-cols-2 gap-2'}`}>
                    <button
                      onClick={() => navigate(`/venues/${venue.id}`)}
                      className={`${isMobile ? 'py-1.5 text-xs' : 'py-2 text-sm'} border border-emerald-700/50 text-emerald-400 rounded-md font-medium hover:bg-emerald-900/20 transition-all`}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setIsBookModalOpen(true)}
                      className={`${isMobile ? 'py-1.5 text-xs' : 'py-2 text-sm'} bg-emerald-900/80 text-white rounded-md font-medium hover:bg-emerald-800/80 transition-colors`}
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
