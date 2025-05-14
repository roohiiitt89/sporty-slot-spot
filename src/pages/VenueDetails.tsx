import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, ArrowLeft, MessageCircle, Navigation, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useGeolocation, calculateDistance } from '@/hooks/use-geolocation';
import { format } from 'date-fns';
import Header from '../components/Header';
import BookSlotModal from '../components/BookSlotModal';
import ChatModal from '../components/ChatModal';
import { ReviewModal } from '@/components/ReviewModal';
import { VenueReviews } from '@/components/VenueReviews';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SportDisplayName from '@/components/SportDisplayName';
import { getVenueSportDisplayNames } from '@/utils/sportDisplayNames';
import AvailabilityWidget from '@/components/AvailabilityWidget';
import VenueImageCarousel from '@/components/VenueImageCarousel';
import { useIsMobile } from '@/hooks/use-mobile';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface Venue {
  id: string;
  name: string;
  location: string;
  image_url: string;
  images: string[] | null;
  description: string;
  rating: number;
  contact_number: string;
  opening_hours: string;
  latitude: number | null;
  longitude: number | null;
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
  const { user } = useAuth();
  const { latitude, longitude } = useGeolocation();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [sportDisplayNames, setSportDisplayNames] = useState<Record<string, string>>({});
  const [distance, setDistance] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const [venueImages, setVenueImages] = useState<string[]>([]);

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
        
        // Set up venue images - from images array if exists, or from single image_url
        if (venueData.images && Array.isArray(venueData.images) && venueData.images.length > 0) {
          setVenueImages(venueData.images);
        } else if (venueData.image_url) {
          setVenueImages([venueData.image_url]);
        } else {
          // Fallback image
          setVenueImages(['https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000']);
        }

        // Calculate distance if we have coordinates
        if (latitude && longitude && venueData.latitude && venueData.longitude) {
          const calculatedDistance = calculateDistance(
            latitude,
            longitude,
            venueData.latitude,
            venueData.longitude
          );
          setDistance(calculatedDistance);
        }

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
  }, [id, latitude, longitude]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
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
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-32">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Venue not found</h2>
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

  const MobileLayout = () => (
    <>
      {/* Booking Section - Now at the top for mobile */}
      <Card className="bg-navy-light border-navy shadow-lg mb-6">
        <CardContent className="p-4">
          <h2 className="text-xl font-bold text-white mb-3">Book this Venue</h2>
          <Button
            onClick={() => setIsBookModalOpen(true)}
            className="w-full py-6 bg-[#1e3b2c] text-white font-semibold hover:bg-[#2a4d3a] transition-colors"
          >
            Book Now
          </Button>
          
          {user && (
            <Button
              onClick={() => setIsChatModalOpen(true)}
              variant="outline"
              className="w-full mt-3 flex items-center justify-center border-gray-600 text-gray-300 hover:bg-navy hover:text-white"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat with Venue
            </Button>
          )}
          
          {/* Info Card */}
          <div className="mt-4 bg-navy/50 rounded-lg p-3 border border-indigo/20">
            <h3 className="font-medium text-white mb-2 text-sm">Venue Highlights</h3>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 text-[#2def80] flex-shrink-0 mt-0.5" />
                <span>Rated {venue?.rating?.toFixed(1) || '4.5'}/5.0 by users</span>
              </li>
              {distance !== null && (
                <li className="flex items-start gap-2">
                  <Navigation className="h-4 w-4 text-[#2def80] flex-shrink-0 mt-0.5" />
                  <span>
                    {distance < 1 
                      ? `${(distance * 1000).toFixed(0)} meters from you` 
                      : `${distance.toFixed(1)} km from you`}
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-[#2def80] flex-shrink-0 mt-0.5" />
                <span>Booking slots available daily</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Regular content */}
      <Card className="bg-navy-light border-navy shadow-lg mb-6">
        <CardContent className="p-4">
          <h2 className="text-xl font-bold text-white mb-3">About This Venue</h2>
          <p className="text-gray-300 mb-4 text-sm">
            {venue?.description || 'This venue offers state-of-the-art facilities for multiple sports activities.'}
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            {/* Opening Hours */}
            <div>
              <h3 className="font-semibold text-base mb-1 text-white">Opening Hours</h3>
              <p className="text-gray-300 whitespace-pre-line text-sm">
                {venue?.opening_hours || 'Monday - Friday: 6:00 AM - 10:00 PM\nSaturday - Sunday: 8:00 AM - 8:00 PM'}
              </p>
            </div>
            
            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-base mb-1 text-white">Contact</h3>
              <p className="text-gray-300 text-sm">
                {venue?.contact_number || 'Phone not available'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Sports Available */}
      <Card className="bg-navy-light border-navy shadow-lg mb-6">
        <CardContent className="p-4">
          <h2 className="text-xl font-bold text-white mb-3">Sports Available</h2>
          
          {sports.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {sports.map(sport => (
                <div key={sport.id} className="bg-navy/70 text-white p-2 rounded-lg text-center hover:bg-[#1e3b2c] transition-colors border border-navy">
                  <h3 className="font-semibold text-xs">
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
            <p className="text-gray-300 text-sm">No sports information available for this venue.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Courts Available */}
      <Card className="bg-navy-light border-navy shadow-lg mb-6">
        <CardContent className="p-4">
          <h2 className="text-xl font-bold text-white mb-3">Courts Available</h2>
          
          {courts.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {courts.map(court => (
                <div key={court.id} className="border border-navy bg-navy/50 rounded-lg p-3 hover:border-[#1e3b2c] transition-colors">
                  <h3 className="font-semibold text-white text-xs">{court.name}</h3>
                  <p className="text-gray-300 text-xs mt-1">
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
            <p className="text-gray-300 text-sm">No court information available for this venue.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Reviews Section */}
      <Card className="bg-navy-light border-navy shadow-lg">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-white">Reviews</h2>
            {user && (
              <Button
                onClick={() => setIsReviewModalOpen(true)}
                className="bg-[#1e3b2c] hover:bg-[#2a4d3a] text-white text-xs px-2 py-1 h-auto"
              >
                Write a Review
              </Button>
            )}
          </div>
          
          <div className="bg-navy/50 rounded-lg p-3 border border-navy">
            <VenueReviews venueId={id || ''} />
          </div>
        </CardContent>
      </Card>
    </>
  );

  const DesktopLayout = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="bg-navy-light border-navy shadow-lg mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">About This Venue</h2>
            <p className="text-gray-300 mb-6">
              {venue?.description || 'This venue offers state-of-the-art facilities for multiple sports activities. Perfect for both casual play and professional training.'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Opening Hours */}
              <div>
                <h3 className="font-semibold text-lg mb-2 text-white">Opening Hours</h3>
                <p className="text-gray-300 whitespace-pre-line">
                  {venue?.opening_hours || 'Monday - Friday: 6:00 AM - 10:00 PM\nSaturday - Sunday: 8:00 AM - 8:00 PM'}
                </p>
              </div>
              
              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-lg mb-2 text-white">Contact</h3>
                <p className="text-gray-300">
                  {venue?.contact_number || 'Phone not available'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Sports Available */}
        <Card className="bg-navy-light border-navy shadow-lg mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Sports Available</h2>
            
            {sports.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {sports.map(sport => (
                  <div key={sport.id} className="bg-navy/70 text-white p-3 rounded-lg text-center hover:bg-[#1e3b2c] transition-colors border border-navy">
                    <h3 className="font-semibold text-sm">
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
              <p className="text-gray-300">No sports information available for this venue.</p>
            )}
          </CardContent>
        </Card>
        
        {/* Courts Available */}
        <Card className="bg-navy-light border-navy shadow-lg mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Courts Available</h2>
            
            {courts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {courts.map(court => (
                  <div key={court.id} className="border border-navy bg-navy/50 rounded-lg p-4 hover:border-[#1e3b2c] transition-colors">
                    <h3 className="font-semibold text-white text-sm">{court.name}</h3>
                    <p className="text-gray-300 text-xs mt-1">
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
              <p className="text-gray-300">No court information available for this venue.</p>
            )}
          </CardContent>
        </Card>
        
        {/* Reviews Section */}
        <Card className="bg-navy-light border-navy shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Reviews</h2>
              {user && (
                <Button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="bg-[#1e3b2c] hover:bg-[#2a4d3a] text-white"
                >
                  Write a Review
                </Button>
              )}
            </div>
            
            <div className="bg-navy/50 rounded-lg p-4 border border-navy">
              <VenueReviews venueId={id || ''} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Booking Section */}
      <div className="lg:col-span-1">
        <Card className="bg-navy-light border-navy shadow-lg sticky top-24">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Book this Venue</h2>
            <p className="text-gray-300 mb-6">Ready to play? Book a slot at this venue now.</p>
            
            <Button
              onClick={() => setIsBookModalOpen(true)}
              className="w-full py-6 bg-[#1e3b2c] text-white font-semibold hover:bg-[#2a4d3a] transition-colors"
            >
              Book Now
            </Button>
            
            {user && (
              <Button
                onClick={() => setIsChatModalOpen(true)}
                variant="outline"
                className="w-full mt-3 flex items-center justify-center border-gray-600 text-gray-300 hover:bg-navy hover:text-white"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat with Venue
              </Button>
            )}
            
            {/* Info Card */}
            <div className="mt-6 bg-navy/50 rounded-lg p-4 border border-navy">
              <h3 className="font-medium text-white mb-2">Venue Highlights</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-[#2def80] flex-shrink-0 mt-0.5" />
                  <span>Rated {venue?.rating?.toFixed(1) || '4.5'}/5.0 by users</span>
                </li>
                {distance !== null && (
                  <li className="flex items-start gap-2">
                    <Navigation className="h-4 w-4 text-[#2def80] flex-shrink-0 mt-0.5" />
                    <span>
                      {distance < 1 
                        ? `${(distance * 1000).toFixed(0)} meters from your location` 
                        : `${distance.toFixed(1)} km from your location`}
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-[#2def80] flex-shrink-0 mt-0.5" />
                  <span>Booking slots available daily</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-navy-dark">
      <Header />
      
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <button
          onClick={() => navigate('/venues')}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Venues
        </button>
      </div>

      {/* Hero Section with Image Carousel */}
      <div className="relative w-full h-[40vh] md:h-[50vh] lg:h-[60vh] mb-8 overflow-hidden">
        <Carousel className="w-full h-full">
          <CarouselContent>
            {venueImages.map((image, index) => (
              <CarouselItem key={index} className="w-full h-full">
                <div className="relative w-full h-full">
                  <img
                    src={image}
                    alt={`${venue?.name} - View ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-transparent to-transparent opacity-90" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            <CarouselPrevious className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white" />
            <CarouselNext className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white" />
          </div>
        </Carousel>
        
        {/* Venue Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-navy-dark to-transparent">
          <div className="container mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
              {venue?.name}
            </h1>
            <div className="flex items-center text-gray-300 space-x-4">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{venue?.location}</span>
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1 text-[#2def80]" />
                <span>{venue?.rating?.toFixed(1) || '4.5'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        {isMobile ? <MobileLayout /> : <DesktopLayout />}
      </div>

      {/* Modals */}
      {isBookModalOpen && (
        <BookSlotModal
          onClose={() => setIsBookModalOpen(false)}
          venueId={id || ''}
        />
      )}
      {isChatModalOpen && venue && (
        <ChatModal
          onClose={() => setIsChatModalOpen(false)}
          venueId={id || ''}
          venueName={venue.name}
        />
      )}
      {isReviewModalOpen && venue && (
        <ReviewModal
          venueId={id || ''}
          venueName={venue.name}
          onClose={() => setIsReviewModalOpen(false)}
          bookingId=""
        />
      )}
    </div>
  );
};

export default VenueDetails;
