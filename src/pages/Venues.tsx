
import React, { useState, useEffect } from 'react';
import { MapPin, Star, Filter, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import BookSlotModal from '../components/BookSlotModal';
import { supabase } from '@/integrations/supabase/client';

interface Venue {
  id: string;
  name: string;
  location: string;
  description: string;
  image_url: string;
  rating: number;
  facilities?: string[];
  distance?: string;
}

interface Sport {
  id: string;
  name: string;
}

const Venues: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);

  // Parse URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sportId = params.get('sport');
    
    if (sportId) {
      setSelectedSports([sportId]);
    }
    
    fetchVenues();
    fetchSports();
  }, [location.search]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      
      // Get the sport filter from URL if it exists
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
          rating
        `)
        .eq('is_active', true);
      
      // Apply sport filter if present
      if (sportId) {
        // We need to find venues that have courts for this sport
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
          // No courts for this sport
          setVenues([]);
          setLoading(false);
          return;
        }
      }
        
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        // Add distance attribute (mock data for now)
        const venuesWithDistance = data.map(venue => ({
          ...venue,
          distance: `${(Math.random() * 10).toFixed(1)} km`
        }));
        
        // Get court data to determine facilities (sports available)
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
            // Extract unique sports as facilities
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
    
    // Also clear from URL
    navigate('/venues');
  };

  const applyFilters = () => {
    setIsFilterOpen(false);
    
    // If there's one sport selected, update URL
    if (selectedSports.length === 1) {
      navigate(`/venues?sport=${selectedSports[0]}`);
    } else {
      // For now, just close the filter panel
      // In a real app, we might want to handle multiple sport filtering in the URL too
      fetchVenues();
    }
  };

  const filteredVenues = venues.filter(venue => {
    // Apply search term filter
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (venue.description && venue.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply sports filter (if not already filtered at the database level)
    const matchesSport = selectedSports.length === 0 || 
                        (venue.facilities && venue.facilities.some(facility => 
                          sports
                            .filter(sport => selectedSports.includes(sport.id))
                            .map(sport => sport.name)
                            .includes(facility)
                        ));
    
    // Apply rating filter
    const matchesRating = venue.rating >= ratingFilter;
    
    return matchesSearch && matchesSport && matchesRating;
  });

  return (
    <div className="min-h-screen bg-sport-gray-light">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-sport-green pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">Explore Venues</h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto text-center mb-8">
            Find the perfect sports venue for your next game or training session
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-sport-green" />
              </div>
              <input
                type="text"
                placeholder="Search venues by name, location, or facilities"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full p-4 rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green-dark"
              />
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="absolute inset-y-0 right-0 px-4 flex items-center bg-sport-green-dark text-white rounded-r-md hover:bg-sport-green transition-colors"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </button>
            </div>
            
            {/* Filter Panel */}
            {isFilterOpen && (
              <div className="mt-4 bg-white p-6 rounded-md shadow-lg animate-fade-in">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-sport-gray-dark mb-3">Filter by Sport</h3>
                  <div className="flex flex-wrap gap-2">
                    {sports.map(sport => (
                      <button
                        key={sport.id}
                        onClick={() => toggleSportFilter(sport.id)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedSports.includes(sport.id)
                            ? 'bg-sport-green text-white'
                            : 'bg-gray-100 text-sport-gray-dark hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {sport.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-sport-gray-dark mb-3">Minimum Rating</h3>
                  <div className="flex items-center space-x-2">
                    {[0, 3, 3.5, 4, 4.5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setRatingFilter(rating)}
                        className={`px-3 py-1 rounded-md ${
                          ratingFilter === rating
                            ? 'bg-sport-green text-white'
                            : 'bg-gray-100 text-sport-gray-dark hover:bg-gray-200'
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
                    className="px-4 py-2 text-sport-gray-dark mr-2 hover:text-sport-green transition-colors"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Venues Listing */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-sport-gray-dark">
            {loading ? 'Loading venues...' : `${filteredVenues.length} Venues Found`}
          </h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-sport-gray rounded-md text-sport-gray-dark hover:bg-sport-gray-light transition-colors">
              Sort by Distance
            </button>
            <button className="px-3 py-1 border border-sport-gray rounded-md text-sport-gray-dark hover:bg-sport-gray-light transition-colors">
              Sort by Rating
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo"></div>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-2xl font-semibold text-sport-gray-dark mb-2">No venues found</h3>
            <p className="text-sport-gray mb-6">Try adjusting your filters or search term</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => (
              <div
                key={venue.id}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={venue.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'} 
                    alt={venue.name} 
                    className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md shadow flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-bold text-sport-gray-dark">{venue.rating ? venue.rating.toFixed(1) : '4.5'}</span>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-sport-gray-dark">{venue.name}</h3>
                    <span className="text-sm text-sport-gray bg-sport-gray-light px-2 py-1 rounded">
                      {venue.distance}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sport-gray mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{venue.location}</span>
                  </div>
                  
                  <p className="text-sport-gray-dark mb-4">{venue.description || 'No description available'}</p>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium text-sport-gray-dark mb-2">Facilities:</p>
                    <div className="flex flex-wrap gap-1">
                      {venue.facilities && venue.facilities.map(facility => (
                        <span
                          key={facility}
                          className="text-xs bg-sport-gray-light text-sport-gray-dark px-2 py-1 rounded"
                        >
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate(`/venues/${venue.id}`)}
                      className="py-2 border border-sport-green text-sport-green rounded-md font-semibold hover:bg-sport-green hover:text-white transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => setIsBookModalOpen(true)}
                      className="py-2 bg-sport-green text-white rounded-md font-semibold hover:bg-sport-green-dark transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="bg-sport-gray-dark text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 SportySlot. All rights reserved.</p>
        </div>
      </footer>
      
      {/* Book Slot Modal */}
      {isBookModalOpen && (
        <BookSlotModal onClose={() => setIsBookModalOpen(false)} />
      )}
    </div>
  );
};

export default Venues;
