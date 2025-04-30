
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { EnterChallengeButton } from "@/components/challenge/EnterChallengeButton";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sports, setSports] = useState([]);
  const [venues, setVenues] = useState([]);
  
  useEffect(() => {
    fetchFeatured();
  }, []);
  
  const fetchFeatured = async () => {
    // Fetch featured sports
    const { data: sportsData } = await supabase
      .from('sports')
      .select('*')
      .eq('is_active', true)
      .limit(4);
      
    if (sportsData) {
      setSports(sportsData);
    }
    
    // Fetch featured venues
    const { data: venuesData } = await supabase
      .from('venues')
      .select('*')
      .eq('is_active', true)
      .limit(4);
      
    if (venuesData) {
      setVenues(venuesData);
    }
  };
  
  const handleSportClick = (sport) => {
    navigate(`/venues?sport=${sport.id}`);
  };
  
  const handleVenueClick = (venue) => {
    navigate(`/venues/${venue.id}`);
  };
  
  return (
    <div>
      <Header />

      {/* Hero section with video background */}
      <div className="hero-section">
        <video autoPlay loop muted className="hero-video">
          <source src="/videos/sports-bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="hero-overlay"></div>
        
        <div className="hero-content">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 text-white">Find and Book Sports Venues</h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Discover the perfect spots for your favorite sports activities.
                Book courts, fields, and facilities with just a few clicks.
              </p>
              
              {/* Challenge Mode Button */}
              {user && <EnterChallengeButton />}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Display featured sports */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-emerald-400">Popular Sports</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {sports.map(sport => (
                <div 
                  key={sport.id} 
                  className="bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow hover:shadow-emerald-800/30"
                  onClick={() => handleSportClick(sport)}
                >
                  <div className="h-40 bg-gray-700 flex items-center justify-center">
                    {sport.image_url ? (
                      <img 
                        src={sport.image_url} 
                        alt={sport.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-4xl">{sport.icon || '🏆'}</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-white">{sport.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Display featured venues */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-emerald-400">Featured Venues</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {venues.map(venue => (
                <div 
                  key={venue.id} 
                  className="bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow hover:shadow-emerald-800/30"
                  onClick={() => handleVenueClick(venue)}
                >
                  <div className="h-48 bg-gray-700">
                    {venue.image_url ? (
                      <img 
                        src={venue.image_url} 
                        alt={venue.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-1 text-white">{venue.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{venue.location}</p>
                    {venue.rating && (
                      <div className="flex items-center">
                        <div className="text-yellow-400">★</div>
                        <span className="ml-1 text-gray-300">{venue.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
