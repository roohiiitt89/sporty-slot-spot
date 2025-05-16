import React, { useState, useEffect } from 'react';
import { Star, Filter, Search, ArrowUpDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BookSlotModal from '../components/BookSlotModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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
      toast({
        title: 'Error',
        description: 'Failed to load sports data',
        variant: 'destructive',
      });
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
      // Sort by popularity (High > Medium > Low)
      const popularityOrder = { High: 3, Medium: 2, Low: 1 };
      return popularityOrder[b.popularity || 'Low'] - popularityOrder[a.popularity || 'Low'];
    }
  });

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="bg-gradient-to-b from-[#1e3b2c] to-black pt-32 pb-12 md:pb-16 relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1485395037613-e83d5c1f5290?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] opacity-10 bg-center bg-cover"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">Explore Sports</h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto text-center mb-8">
            Find the perfect sport for your interests and book available venues
          </p>
          
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[#1e3b2c]" />
              </div>
              <input
                type="text"
                placeholder="Search sports by name or description"
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
                  <h3 className="text-lg font-semibold text-[#1e3b2c] mb-3">Filter by Popularity</h3>
                  <div className="flex flex-wrap gap-2">
                    {['High', 'Medium', 'Low'].map(popularity => (
                      <button
                        key={popularity}
                        onClick={() => togglePopularityFilter(popularity)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          popularityFilter.includes(popularity)
                            ? 'bg-[#1e3b2c] text-white'
                            : 'bg-gray-100 text-[#1e3b2c] hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {popularity}
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
                    onClick={() => setIsFilterOpen(false)}
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
            {loading ? 'Loading sports...' : `${filteredSports.length} Sports Found`}
          </h2>
          <button 
            onClick={toggleSortOption}
            className="px-3 py-1.5 bg-[#1e3b2c] text-white rounded-md hover:bg-[#2a4d3a] transition-colors flex items-center"
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Sort by {sortOption === 'popularity' ? 'Venues' : 'Popularity'}
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1e3b2c]"></div>
          </div>
        ) : filteredSports.length === 0 ? (
          <div className="text-center py-16 bg-navy-light rounded-xl border border-[#1e3b2c]/20">
            <h3 className="text-2xl font-semibold text-white mb-2">No sports found</h3>
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
            {filteredSports.map((sport) => (
              <div
                key={sport.id}
                className="bg-navy-light rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-navy/30 hover:border-[#1e3b2c]/50 h-full flex flex-col group"
              >
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={sport.image_url || 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=1000'} 
                    alt={sport.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full shadow-sm flex items-center">
                    <span className="text-xs font-bold text-navy">
                      {sport.venues_count || 0} venues
                    </span>
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-[#2def80] transition-colors">
                    {sport.name}
                  </h3>
                  
                  <div className="mb-3 flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sport.popularity === 'High' 
                        ? 'bg-green-100 text-green-800'
                        : sport.popularity === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {sport.popularity}
                    </span>
                  </div>
                  
                  <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
                    <Link
                      to={`/venues?sport=${sport.id}`}
                      className="py-2 border border-[#1e3b2c] text-[#2def80] rounded-md text-sm font-medium hover:bg-[#1e3b2c]/20 transition-all text-center"
                    >
                      Find Venues
                    </Link>
                    <button
                      onClick={() => handleBookNow(sport.id)}
                      className="py-2 bg-[#1e3b2c] text-white rounded-md text-sm font-medium hover:bg-[#2a4d3a] transition-colors"
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
          sportId={selectedSportId}
        />
      )}
    </div>
  );
};

export default Sports;
