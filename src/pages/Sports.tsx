import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
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
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [popularityFilter, setPopularityFilter] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);

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
        });
        
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

  const filteredSports = sports.filter(sport => {
    const matchesSearch = sport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (sport.description && sport.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPopularity = popularityFilter.length === 0 || 
                             popularityFilter.includes(sport.popularity || 'Low');
    
    return matchesSearch && matchesPopularity;
  });

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <Header />
      
      <div className="bg-[#1e3b2c] pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4">
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
              <div className="mt-4 bg-white backdrop-blur-md p-6 rounded-md shadow-lg animate-fade-in border border-[#1e3b2c]/30">
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
          <h2 className="text-2xl font-bold text-[#1e3b2c]">{filteredSports.length} Sports Available</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1e3b2c]"></div>
          </div>
        ) : filteredSports.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#1e3b2c]/20">
            <h3 className="text-2xl font-semibold text-[#1e3b2c] mb-2">No sports found</h3>
            <p className="text-[#1e3b2c]/80 mb-6">Try adjusting your filters or search term</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-[#1e3b2c] text-white rounded-md hover:bg-[#2a4d3a] transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredSports.map((sport) => (
              <div
                key={sport.id}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 flex flex-col h-full border border-[#1e3b2c]/10"
              >
                <div className="h-32 relative overflow-hidden">
                  <img 
                    src={sport.image_url || 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=1000'} 
                    alt={sport.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white px-2 py-0.5 rounded text-xs font-medium">
                    {sport.venues_count || 0} venues
                  </div>
                </div>
                
                <div className="p-3 flex-grow">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-base font-semibold text-[#1e3b2c]">{sport.name}</h3>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      sport.popularity === 'High' 
                        ? 'bg-green-100 text-green-800'
                        : sport.popularity === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {sport.popularity}
                    </span>
                  </div>
                  
                  <div className="flex mt-2 gap-1">
                    <button
                      onClick={() => handleBookNow(sport.id)}
                      className="flex-1 py-1 bg-[#1e3b2c] text-white rounded text-xs font-medium hover:bg-[#2a4d3a] transition-colors"
                    >
                      Book Now
                    </button>
                    <Link
                      to={`/venues?sport=${sport.id}`}
                      className="flex-1 py-1 border border-[#1e3b2c] text-[#1e3b2c] rounded text-xs font-medium text-center hover:bg-[#1e3b2c] hover:text-white transition-colors"
                    >
                      Find Venues
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <footer className="bg-[#1e3b2c] text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 SportySlot. All rights reserved.</p>
        </div>
      </footer>
      
      {isBookModalOpen && (
        <BookSlotModal 
          onClose={() => setIsBookModalOpen(false)} 
          sportId={selectedSportId}
        />
      )}
    </div>
  );
};

export default Sports;
