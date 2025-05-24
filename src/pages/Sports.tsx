
import React, { useState, useEffect } from 'react';
import { Star, Filter, Search, ArrowUpDown, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { BookSlotModal } from '../components/BookSlotModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface Sport {
  id: string;
  name: string;
  description: string;
  image_url: string;
  popularity?: string;
  venues_count?: number;
}

const Sports: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [popularityFilter, setPopularityFilter] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<'popularity' | 'venues'>('popularity');

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      setLoading(true);
      
      const { data: sportsData, error: sportsError } = await supabase
        .from('sports')
        .select('id, name, description, image_url')
        .eq('is_active', true);
      
      if (sportsError) throw sportsError;
      
      if (sportsData) {
        const sportsWithVenueCounts = await Promise.all(sportsData.map(async (sport) => {
          try {
            const { data: courts, error: courtsError } = await supabase
              .from('courts')
              .select('venue_id')
              .eq('sport_id', sport.id)
              .eq('is_active', true);
              
            if (courtsError) throw courtsError;
            
            const uniqueVenueIds = new Set();
            courts?.forEach(court => uniqueVenueIds.add(court.venue_id));
            
            let popularity = 'Low';
            const venueCount = uniqueVenueIds.size;
            if (venueCount > 8) popularity = 'High';
            else if (venueCount > 4) popularity = 'Medium';
            
            return {
              ...sport,
              venues_count: venueCount,
              popularity
            };
          } catch (error) {
            console.error(`Error getting venues for sport ${sport.id}:`, error);
            return {
              ...sport,
              venues_count: 0,
              popularity: 'Low'
            };
          }
        }));
        
        setSports(sportsWithVenueCounts);
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
      toast.error('Failed to load sports data');
    } finally {
      setLoading(false);
    }
  };

  const togglePopularityFilter = (popularity: string) => {
    if (popularityFilter.includes(popularity)) {
      setPopularityFilter(popularityFilter.filter(p => p !== popularity));
    } else {
      setPopularityFilter([...popularityFilter, popularity]);
    }
  };

  const clearFilters = () => {
    setPopularityFilter([]);
    setSearchTerm('');
  };

  const handleBookNow = (sportId: string) => {
    setSelectedSportId(sportId);
    setIsBookModalOpen(true);
  };

  const toggleSortOption = () => {
    setSortOption(sortOption === 'popularity' ? 'venues' : 'popularity');
  };

  const filteredSports = sports.filter(sport => {
    const matchesSearch = sport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (sport.description && sport.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPopularity = popularityFilter.length === 0 || 
                             popularityFilter.includes(sport.popularity || 'Low');
    
    return matchesSearch && matchesPopularity;
  }).sort((a, b) => {
    if (sortOption === 'venues') {
      return (b.venues_count || 0) - (a.venues_count || 0);
    } else {
      const popularityOrder = { High: 3, Medium: 2, Low: 1 };
      return popularityOrder[b.popularity || 'Low'] - popularityOrder[a.popularity || 'Low'];
    }
  });

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="bg-gradient-to-b from-emerald-900/20 to-black pt-20 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1485395037613-e83d5c1f5290?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] opacity-5 bg-center bg-cover"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl md:text-5xl'} font-bold text-white mb-2 text-center`}>
            Explore Sports
          </h1>
          <p className={`${isMobile ? 'text-sm' : 'text-xl'} text-gray-300 max-w-2xl mx-auto text-center mb-6`}>
            Find the perfect sport for your interests and book available venues
          </p>
          
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400`} />
              </div>
              <input
                type="text"
                placeholder="Search sports..."
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
                  <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-emerald-400 mb-3`}>Filter by Popularity</h3>
                  <div className="flex flex-wrap gap-2">
                    {['High', 'Medium', 'Low'].map(popularity => (
                      <button
                        key={popularity}
                        onClick={() => togglePopularityFilter(popularity)}
                        className={`px-3 py-1 rounded-full ${isMobile ? 'text-xs' : 'text-sm'} ${
                          popularityFilter.includes(popularity)
                            ? 'bg-emerald-900/80 text-white'
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                        } transition-colors border border-emerald-900/20`}
                      >
                        {popularity}
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
                    onClick={() => setIsFilterOpen(false)}
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
            {loading ? 'Loading...' : `${filteredSports.length} Sports`}
          </h2>
          <button 
            onClick={toggleSortOption}
            className={`px-3 py-1.5 bg-emerald-900/80 text-white rounded-md hover:bg-emerald-800/80 transition-colors flex items-center ${isMobile ? 'text-xs' : 'text-sm'}`}
          >
            <ArrowUpDown className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
            {isMobile ? (sortOption === 'popularity' ? 'Venues' : 'Popular') : `Sort by ${sortOption === 'popularity' ? 'Venues' : 'Popularity'}`}
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredSports.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-emerald-900/20">
            <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-semibold text-white mb-2`}>No sports found</h3>
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
            {filteredSports.map((sport) => (
              <div
                key={sport.id}
                className={`bg-gray-900/50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-emerald-900/20 hover:border-emerald-700/50 ${isMobile ? 'h-auto' : 'h-full'} flex ${isMobile ? 'flex-row' : 'flex-col'} group backdrop-blur-sm`}
              >
                <div className={`${isMobile ? 'w-24 h-20' : 'h-36'} relative overflow-hidden flex-shrink-0`}>
                  <img 
                    src={sport.image_url || 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=1000'} 
                    alt={sport.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {!isMobile && (
                    <div className="absolute top-2 right-2 bg-emerald-900/80 backdrop-blur px-2 py-0.5 rounded-full shadow-sm flex items-center">
                      <MapPin className="w-3 h-3 text-white mr-1" />
                      <span className="text-xs font-bold text-white">
                        {sport.venues_count || 0}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className={`${isMobile ? 'p-3 flex-1' : 'p-4'} flex flex-col ${isMobile ? 'justify-center' : 'flex-grow'}`}>
                  <div className="flex-1">
                    <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-white mb-1 line-clamp-1 group-hover:text-emerald-400 transition-colors`}>
                      {sport.name}
                    </h3>
                    
                    {isMobile && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          sport.popularity === 'High' 
                            ? 'bg-green-900/50 text-green-300 border border-green-700/30'
                            : sport.popularity === 'Medium'
                            ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/30'
                            : 'bg-blue-900/50 text-blue-300 border border-blue-700/30'
                        }`}>
                          {sport.popularity}
                        </span>
                        <div className="flex items-center text-xs text-gray-400">
                          <MapPin className="w-3 h-3 mr-1" />
                          {sport.venues_count || 0} venues
                        </div>
                      </div>
                    )}
                    
                    {!isMobile && (
                      <div className="mb-3 flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sport.popularity === 'High' 
                            ? 'bg-green-900/50 text-green-300 border border-green-700/30'
                            : sport.popularity === 'Medium'
                            ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/30'
                            : 'bg-blue-900/50 text-blue-300 border border-blue-700/30'
                        }`}>
                          {sport.popularity}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className={`${isMobile ? 'grid grid-cols-2 gap-1' : 'mt-auto pt-3 grid grid-cols-2 gap-2'}`}>
                    <Link
                      to={`/venues?sport=${sport.id}`}
                      className={`${isMobile ? 'py-1.5 text-xs' : 'py-2 text-sm'} border border-emerald-700/50 text-emerald-400 rounded-md font-medium hover:bg-emerald-900/20 transition-all text-center`}
                    >
                      Find Venues
                    </Link>
                    <button
                      onClick={() => handleBookNow(sport.id)}
                      className={`${isMobile ? 'py-1.5 text-xs' : 'py-2 text-sm'} bg-emerald-900/80 text-white rounded-md font-medium hover:bg-emerald-800/80 transition-colors`}
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
          sportId={selectedSportId}
        />
      )}
    </div>
  );
};

export default Sports;
