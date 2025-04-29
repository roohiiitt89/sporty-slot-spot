
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '../components/Header';
import BookSlotModal from '../components/BookSlotModal';
import { Card, CardContent } from "@/components/ui/card";
import SportDisplayName from '@/components/SportDisplayName';
import { getVenueSportDisplayNames } from '@/utils/sportDisplayNames';

interface Venue {
  id: string;
  name: string;
  location: string;
  image_url: string;
  description: string;
  rating: number;
  contact_number: string;
  opening_hours: string;
}

interface Sport {
  id: string;
  name: string;
}

interface Court {
  id: string;
  name: string;
  sport_id: string;
  sport: Sport;
}

// Additional interface to match the actual Supabase response
interface CourtWithSports {
  id: string;
  name: string;
  sport_id: string;
  sports: Sport;
}

const VenueDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [sportDisplayNames, setSportDisplayNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchVenueDetails = async () => {
      try {
        if (!id) return;

        // Fetch venue details
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .select('*')
          .eq('id', id)
          .single();

        if (venueError) throw venueError;
        setVenue(venueData);

        // Fetch custom sport display names for this venue
        const customNames = await getVenueSportDisplayNames(id);
        setSportDisplayNames(customNames);

        // Fetch courts for this venue with related sports
        const { data: courtsData, error: courtsError } = await supabase
          .from('courts')
          .select(`
            id, 
            name, 
            sport_id,
            sports:sport_id (id, name)
          `)
          .eq('venue_id', id)
          .eq('is_active', true);

        if (courtsError) throw courtsError;
        
        // Transform the data to match the Court interface
        const transformedCourts = courtsData.map((court: CourtWithSports) => ({
          id: court.id,
          name: court.name,
          sport_id: court.sport_id,
          sport: court.sports
        }));
        
        setCourts(transformedCourts);

        // Extract unique sports from courts
        const uniqueSports = Array.from(
          new Set(courtsData.map(court => court.sports.id))
        ).map(sportId => {
          const court = courtsData.find(c => c.sports.id === sportId);
          return court?.sports || null;
        }).filter(Boolean) as Sport[];

        setSports(uniqueSports);
      } catch (error) {
        console.error('Error fetching venue details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenueDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sport-gray-light">
        <Header />
        <div className="container mx-auto px-4 py-32">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-sport-gray-light">
        <Header />
        <div className="container mx-auto px-4 py-32">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-sport-gray-dark mb-4">Venue not found</h2>
            <button
              onClick={() => navigate('/venues')}
              className="px-4 py-2 bg-indigo text-white rounded-md hover:bg-indigo-dark transition-colors"
            >
              Back to Venues
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sport-gray-light">
      <Header />
      
      {/* Hero Section with Venue Image */}
      <div className="relative h-80 md:h-96">
        <div className="absolute inset-0">
          <img 
            src={venue?.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'} 
            alt={venue?.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="container mx-auto">
            <button 
              onClick={() => navigate('/venues')}
              className="mb-4 flex items-center text-sm font-medium hover:text-indigo-light transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to All Venues
            </button>
            
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{venue?.name}</h1>
                <div className="flex items-center text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{venue?.location}</span>
                </div>
              </div>
              
              <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-navy-dark">
                <Star className="h-5 w-5 text-yellow-500 fill-current mr-1" />
                <span className="font-bold">{venue?.rating?.toFixed(1) || '4.5'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Venue Details */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-sport-gray-dark mb-4">About This Venue</h2>
                <p className="text-sport-gray-dark mb-6">
                  {venue?.description || 'This venue offers state-of-the-art facilities for multiple sports activities. Perfect for both casual play and professional training.'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Opening Hours */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-sport-gray-dark">Opening Hours</h3>
                    <p className="text-sport-gray-dark">
                      {venue?.opening_hours || 'Monday - Friday: 6:00 AM - 10:00 PM\nSaturday - Sunday: 8:00 AM - 8:00 PM'}
                    </p>
                  </div>
                  
                  {/* Contact Info */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-sport-gray-dark">Contact</h3>
                    <p className="text-sport-gray-dark">
                      {venue?.contact_number || 'Phone not available'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Sports Available */}
            <Card className="mt-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-sport-gray-dark mb-4">Sports Available</h2>
                
                {sports.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {sports.map(sport => (
                      <div key={sport.id} className="bg-navy-light text-white p-4 rounded-lg text-center hover:bg-sport-green transition-colors">
                        <h3 className="font-semibold">
                          {id && (
                            <SportDisplayName 
                              venueId={id} 
                              sportId={sport.id} 
                              defaultName={sport.name} 
                            />
                          )}
                        </h3>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sport-gray-dark">No sports information available for this venue.</p>
                )}
              </CardContent>
            </Card>
            
            {/* Courts Available */}
            <Card className="mt-8">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-sport-gray-dark mb-4">Courts Available</h2>
                
                {courts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courts.map(court => (
                      <div key={court.id} className="border border-gray-200 rounded-lg p-4 hover:border-sport-green transition-colors">
                        <h3 className="font-semibold text-sport-gray-dark">{court.name}</h3>
                        <p className="text-sport-gray-dark text-sm">
                          Sport: {id && (
                            <SportDisplayName
                              venueId={id}
                              sportId={court.sport_id}
                              defaultName={court.sport?.name || 'N/A'}
                            />
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sport-gray-dark">No court information available for this venue.</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Booking Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-sport-gray-dark mb-4">Book this Venue</h2>
                <p className="text-sport-gray-dark mb-6">Ready to play? Book a slot at this venue now.</p>
                
                <button
                  onClick={() => setIsBookModalOpen(true)}
                  className="w-full py-3 bg-sport-green text-white rounded-md font-semibold hover:bg-sport-green-dark transition-colors"
                >
                  Book Now
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-sport-gray-dark text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 SportySlot. All rights reserved.</p>
        </div>
      </footer>
      
      {/* Book Slot Modal - Pass the current venue ID */}
      {isBookModalOpen && (
        <BookSlotModal 
          onClose={() => setIsBookModalOpen(false)} 
          venueId={id} 
        />
      )}
    </div>
  );
};

export default VenueDetails;
