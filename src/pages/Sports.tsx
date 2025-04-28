
import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import BookSlotModal from '../components/BookSlotModal';

// Mock sports data (would come from API in production)
const sportsData = [
  {
    id: 1,
    name: 'Basketball',
    description: 'Fast-paced indoor court game played by two teams',
    image: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=1000',
    venues: 6,
    popularity: 'High'
  },
  {
    id: 2,
    name: 'Tennis',
    description: 'Racket sport played on a rectangular court',
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1000',
    venues: 8,
    popularity: 'Medium'
  },
  {
    id: 3,
    name: 'Football',
    description: 'Team sport played with a spherical ball',
    image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1000',
    venues: 10,
    popularity: 'High'
  },
  {
    id: 4,
    name: 'Swimming',
    description: 'Water-based sport in lanes for speed and technique',
    image: 'https://images.unsplash.com/photo-1600965962351-9a42dd4deb86?q=80&w=1000',
    venues: 5,
    popularity: 'Medium'
  },
  {
    id: 5,
    name: 'Volleyball',
    description: 'Team sport where two teams hit a ball over a net',
    image: 'https://images.unsplash.com/photo-1562552052-2d02ff8d6eb5?q=80&w=1000',
    venues: 7,
    popularity: 'Medium'
  },
  {
    id: 6,
    name: 'Badminton',
    description: 'Racket sport played using rackets to hit a shuttlecock across a net',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1000',
    venues: 6,
    popularity: 'Low'
  },
  {
    id: 7,
    name: 'Table Tennis',
    description: 'Fast indoor sport played on a hard table divided by a net',
    image: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?q=80&w=1000',
    venues: 4,
    popularity: 'Low'
  },
  {
    id: 8,
    name: 'Cricket',
    description: 'Bat-and-ball game played between two teams on a cricket field',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1000',
    venues: 3,
    popularity: 'Medium'
  }
];

const Sports: React.FC = () => {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [popularityFilter, setPopularityFilter] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const togglePopularityFilter = (popularity: string) => {
    if (popularityFilter.includes(popularity)) {
      setPopularityFilter(popularityFilter.filter(p => p !== popularity));
    } else {
      setPopularityFilter([...popularityFilter, popularity]);
    }
  };

  const clearFilters = () => {
    setPopularityFilter([]);
  };

  const filteredSports = sportsData.filter(sport => {
    // Apply search term filter
    const matchesSearch = sport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sport.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply popularity filter
    const matchesPopularity = popularityFilter.length === 0 || 
                             popularityFilter.includes(sport.popularity);
    
    return matchesSearch && matchesPopularity;
  });

  return (
    <div className="min-h-screen bg-sport-gray-light">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-sport-green pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">Explore Sports</h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto text-center mb-8">
            Find the perfect sport for your interests and book available venues
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-sport-green" />
              </div>
              <input
                type="text"
                placeholder="Search sports by name or description"
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
                  <h3 className="text-lg font-semibold text-sport-gray-dark mb-3">Filter by Popularity</h3>
                  <div className="flex flex-wrap gap-2">
                    {['High', 'Medium', 'Low'].map(popularity => (
                      <button
                        key={popularity}
                        onClick={() => togglePopularityFilter(popularity)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          popularityFilter.includes(popularity)
                            ? 'bg-sport-green text-white'
                            : 'bg-gray-100 text-sport-gray-dark hover:bg-gray-200'
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
                    className="px-4 py-2 text-sport-gray-dark mr-2 hover:text-sport-green transition-colors"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(false)}
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
      
      {/* Sports Listing */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-sport-gray-dark">{filteredSports.length} Sports Available</h2>
        </div>
        
        {filteredSports.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-2xl font-semibold text-sport-gray-dark mb-2">No sports found</h3>
            <p className="text-sport-gray mb-6">Try adjusting your filters or search term</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredSports.map((sport) => (
              <div
                key={sport.id}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-48 relative overflow-hidden">
                  <img 
                    src={sport.image} 
                    alt={sport.name} 
                    className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md shadow">
                    <span className="font-medium text-sport-gray-dark">
                      {sport.venues} venues
                    </span>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-sport-gray-dark">{sport.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sport.popularity === 'High' 
                        ? 'bg-green-100 text-green-800'
                        : sport.popularity === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {sport.popularity} popularity
                    </span>
                  </div>
                  
                  <p className="text-sport-gray-dark mb-4">{sport.description}</p>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsBookModalOpen(true)}
                      className="flex-1 py-2 bg-sport-green text-white rounded-md font-semibold hover:bg-sport-green-dark transition-colors"
                    >
                      Book Now
                    </button>
                    <Link
                      to="/venues"
                      className="flex-1 py-2 border border-sport-green text-sport-green rounded-md font-semibold text-center hover:bg-sport-green-light hover:text-white transition-colors"
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

export default Sports;
