
import React, { useState } from 'react';
import { MapPin, Star, Filter, Search } from 'lucide-react';
import Header from '../components/Header';
import BookSlotModal from '../components/BookSlotModal';

// Mock data (would come from API in production)
const venuesData = [
  {
    id: 1,
    name: 'Urban Sports Center',
    location: 'Downtown',
    description: 'Modern sports complex with state-of-the-art facilities',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000',
    rating: 4.8,
    facilities: ['Basketball', 'Tennis', 'Swimming', 'Gym'],
    distance: '2.3 km'
  },
  {
    id: 2,
    name: 'Green Field Complex',
    location: 'West Side',
    description: 'Sprawling outdoor venues with multiple sports fields',
    image: 'https://images.unsplash.com/photo-1526232636376-53d03f24f092?q=80&w=1000',
    rating: 4.6,
    facilities: ['Football', 'Cricket', 'Athletics'],
    distance: '5.1 km'
  },
  {
    id: 3,
    name: 'Elite Training Center',
    location: 'North District',
    description: 'Professional training center with expert coaching staff',
    image: 'https://images.unsplash.com/photo-1478472160422-12f051d9800d?q=80&w=1000',
    rating: 4.9,
    facilities: ['Tennis', 'Squash', 'Badminton'],
    distance: '3.7 km'
  },
  {
    id: 4,
    name: 'Community Sports Hub',
    location: 'East End',
    description: 'Family-friendly sports center for all ages',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000',
    rating: 4.7,
    facilities: ['Basketball', 'Volleyball', 'Table Tennis'],
    distance: '1.9 km'
  },
  {
    id: 5,
    name: 'Riverside Sports Arena',
    location: 'Waterfront District',
    description: 'Beautiful venue with panoramic river views',
    image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=1000',
    rating: 4.5,
    facilities: ['Swimming', 'Yoga', 'Fitness Classes'],
    distance: '6.2 km'
  },
  {
    id: 6,
    name: 'Central Stadium',
    location: 'City Center',
    description: 'Large stadium with multiple courts and pitches',
    image: 'https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?q=80&w=1000',
    rating: 4.8,
    facilities: ['Football', 'Athletics', 'Basketball'],
    distance: '4.3 km'
  },
  {
    id: 7,
    name: 'Mountain View Club',
    location: 'Northern Hills',
    description: 'Exclusive sports club with breathtaking mountain views',
    image: 'https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?q=80&w=1000',
    rating: 4.9,
    facilities: ['Tennis', 'Golf', 'Swimming'],
    distance: '8.5 km'
  },
  {
    id: 8,
    name: 'Youth Sports Complex',
    location: 'University District',
    description: 'Modern facilities focused on youth and student sports',
    image: 'https://images.unsplash.com/photo-1594470117722-de4b9a02ebed?q=80&w=1000',
    rating: 4.6,
    facilities: ['Basketball', 'Volleyball', 'Badminton'],
    distance: '3.1 km'
  },
];

// Available sports for filtering
const availableSports = ['Basketball', 'Tennis', 'Football', 'Swimming', 'Cricket', 'Volleyball', 'Badminton', 'Squash', 'Athletics', 'Gym', 'Yoga', 'Table Tennis', 'Golf'];

const Venues: React.FC = () => {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(0);

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
  };

  const filteredVenues = venuesData.filter(venue => {
    // Apply search term filter
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply sports filter
    const matchesSport = selectedSports.length === 0 || 
                        venue.facilities.some(facility => selectedSports.includes(facility));
    
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
                    {availableSports.map(sport => (
                      <button
                        key={sport}
                        onClick={() => toggleSportFilter(sport)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          selectedSports.includes(sport)
                            ? 'bg-sport-green text-white'
                            : 'bg-gray-100 text-sport-gray-dark hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {sport}
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
      
      {/* Venues Listing */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-sport-gray-dark">{filteredVenues.length} Venues Found</h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-sport-gray rounded-md text-sport-gray-dark hover:bg-sport-gray-light transition-colors">
              Sort by Distance
            </button>
            <button className="px-3 py-1 border border-sport-gray rounded-md text-sport-gray-dark hover:bg-sport-gray-light transition-colors">
              Sort by Rating
            </button>
          </div>
        </div>
        
        {filteredVenues.length === 0 ? (
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
                    src={venue.image} 
                    alt={venue.name} 
                    className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md shadow flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-bold text-sport-gray-dark">{venue.rating}</span>
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
                  
                  <p className="text-sport-gray-dark mb-4">{venue.description}</p>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium text-sport-gray-dark mb-2">Facilities:</p>
                    <div className="flex flex-wrap gap-1">
                      {venue.facilities.map(facility => (
                        <span
                          key={facility}
                          className="text-xs bg-sport-gray-light text-sport-gray-dark px-2 py-1 rounded"
                        >
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsBookModalOpen(true)}
                    className="w-full py-2 bg-sport-green text-white rounded-md font-semibold hover:bg-sport-green-dark transition-colors"
                  >
                    Book Slot
                  </button>
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
