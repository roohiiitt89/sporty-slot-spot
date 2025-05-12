
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import CustomHeader from '@/components/CustomHeader';
import { LocationPermissionRequest } from '@/components/LocationPermissionRequest';
import { NearbyVenues } from '@/components/NearbyVenues';
import HomepageAvailabilityWidget from '@/components/HomepageAvailabilityWidget';
import VenueCard from '@/components/VenueCard';
import ImprovedBookSlotModal from '@/components/ImprovedBookSlotModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';

// Define proper types to avoid recursion issues
interface VenueData {
  id: string;
  name: string;
  address?: string;
  featured_image_url?: string;
  is_featured?: boolean;
  avg_rating?: number;
}

interface SportData {
  id: string;
  name: string;
  icon_url?: string;
}

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [featuredVenues, setFeaturedVenues] = useState<VenueData[]>([]);
  const [popularSports, setPopularSports] = useState<SportData[]>([]);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<string | undefined>(undefined);
  const [selectedSport, setSelectedSport] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    fetchFeaturedVenues();
    fetchPopularSports();
  }, []);
  
  const fetchFeaturedVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          id,
          name,
          address,
          featured_image_url,
          is_featured,
          avg_rating
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(6);
        
      if (error) throw error;
      setFeaturedVenues(data || []);
    } catch (error) {
      console.error('Error fetching featured venues:', error);
    }
  };
  
  const fetchPopularSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sports')
        .select(`
          id,
          name,
          icon_url
        `)
        .eq('is_active', true)
        .eq('is_popular', true)
        .limit(6);
        
      if (error) throw error;
      setPopularSports(data || []);
    } catch (error) {
      console.error('Error fetching popular sports:', error);
    }
  };
  
  const handleBookClick = (venueId?: string, sportId?: string) => {
    setSelectedVenue(venueId);
    setSelectedSport(sportId);
    setIsBookModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-dark">
      <CustomHeader />
      
      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 pb-12 lg:pb-20 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="w-full lg:w-1/2 mb-10 lg:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Find and Book <span className="text-indigo-light">Sports Venues</span> Near You
              </h1>
              
              <p className="mt-6 text-xl text-gray-300">
                Book badminton courts, football fields, and more with just a few clicks.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => navigate('/venues')}
                  className="nike-button bg-indigo hover:bg-indigo-dark"
                  size="lg"
                >
                  Explore Venues
                </Button>
                
                {!user && (
                  <Button 
                    onClick={() => navigate('/register')}
                    variant="outline"
                    className="bg-transparent border-2 border-indigo-light text-indigo-light hover:bg-indigo-light hover:text-navy font-bold py-3 px-6 rounded-md"
                    size="lg"
                  >
                    Sign Up Free
                  </Button>
                )}
              </div>
              
              <div className="mt-8 flex items-center">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-navy bg-indigo-dark flex items-center justify-center text-xs text-white">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="ml-4">
                  <p className="text-gray-300 text-sm">Join <span className="text-indigo-light font-bold">5000+</span> players</p>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 relative">
              <div className="rounded-2xl overflow-hidden shadow-xl relative">
                <img 
                  src="https://images.unsplash.com/photo-1592656094259-947a41fd1599?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                  alt="Sports Venue" 
                  className="w-full h-[300px] lg:h-[400px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Location Permission Request */}
      <LocationPermissionRequest />
      
      {/* Near You Section */}
      <NearbyVenues />
      
      {/* Featured Venues */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Featured Venues</h2>
            <Link to="/venues" className="text-indigo-light hover:text-white text-sm font-semibold">
              View all
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredVenues.map((venue) => (
              <VenueCard
                key={venue.id}
                id={venue.id}
                name={venue.name}
                image={venue.featured_image_url}
                address={venue.address}
                rating={venue.avg_rating}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Real-Time Availability */}
      <section className="py-12 px-4 bg-navy-light">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-white">Check Real-Time Availability</h2>
            <p className="mt-2 text-gray-300">View and book available slots instantly</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <HomepageAvailabilityWidget />
          </div>
        </div>
      </section>
      
      {/* Popular Sports */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Popular Sports</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularSports.map((sport) => (
              <div
                key={sport.id}
                className="bg-navy-light p-4 rounded-lg text-center hover:bg-navy-dark transition-colors cursor-pointer"
                onClick={() => navigate(`/sports?sport=${sport.id}`)}
              >
                <div className="w-12 h-12 bg-indigo/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  {sport.icon_url ? (
                    <img src={sport.icon_url} alt={sport.name} className="w-6 h-6" />
                  ) : (
                    <span className="text-indigo-light text-xl">{sport.name.charAt(0)}</span>
                  )}
                </div>
                <h3 className="text-white font-medium text-sm">{sport.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-navy-dark py-12 px-4 border-t border-navy-light/20">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </div>
                <div className="text-white font-bold">Grid2Play</div>
              </div>
              <p className="text-gray-400 text-sm">
                Find and book sports venues easily.
              </p>
              <div className="mt-4">
                <p className="text-gray-400 text-sm">Contact us:</p>
                <a href="mailto:support@grid2play.com" className="text-indigo-light text-sm hover:text-white transition-colors">
                  support@grid2play.com
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/venues" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Find Venues
                  </Link>
                </li>
                <li>
                  <Link to="/sports" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Sports
                  </Link>
                </li>
                {user && (
                  <li>
                    <Link to="/bookings" className="text-gray-400 hover:text-white text-sm transition-colors">
                      My Bookings
                    </Link>
                  </li>
                )}
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-bold mb-4">Newsletter</h3>
              <p className="text-gray-400 text-sm mb-2">
                Subscribe for updates and offers.
              </p>
              <form className="flex">
                <input 
                  type="email"
                  placeholder="Your email"
                  className="flex-1 py-2 px-3 bg-navy-light text-white text-sm rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-light"
                />
                <button
                  type="submit"
                  className="bg-indigo px-3 py-2 text-white text-sm font-medium rounded-r-md hover:bg-indigo-dark"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          
          <div className="border-t border-navy-light/20 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2025 Grid2Play. All rights reserved.
            </p>
            
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Book Modal */}
      {isBookModalOpen && (
        <ImprovedBookSlotModal 
          onClose={() => setIsBookModalOpen(false)}
          venueId={selectedVenue}
          sportId={selectedSport}
        />
      )}
    </div>
  );
};

export default Index;
