import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, ArrowLeft, MessageCircle, Navigation, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useGeolocation, calculateDistance } from '@/hooks/use-geolocation';
import { format } from 'date-fns';
import Header from '../components/Header';
import { BookSlotModal } from '../components/BookSlotModal';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart } from 'lucide-react';

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
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [showSubSuccess, setShowSubSuccess] = useState(false);
  const [showUnsubModal, setShowUnsubModal] = useState(false);
  const [unsubReason, setUnsubReason] = useState('');

  // Use isMobile to conditionally apply mobile-optimized classes
  const containerClass = isMobile ? 'max-w-screen-sm mx-auto px-2' : 'container mx-auto px-4';

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

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !id) return;
      const { data, error } = await supabase
        .from('venue_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('venue_id', id)
        .single();
      setIsSubscribed(!!data && !error);
    };
    checkSubscription();
  }, [user, id]);

  useEffect(() => {
    if (!id) return;
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('venue_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('venue_id', id);
      setSubscriberCount(count || 0);
    };
    fetchCount();
  }, [id, isSubscribed]);

  const handleSubscribe = async () => {
    setSubLoading(true);
    if (!user || !id) return;
    if (isSubscribed) {
      // Unsubscribe
      const { error } = await supabase
        .from('venue_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('venue_id', id);
      if (!error) {
        setIsSubscribed(false);
        toast.success('Unsubscribed from this venue.');
      } else {
        toast.error('Failed to unsubscribe.');
      }
    } else {
      // Subscribe
      const { error } = await supabase
        .from('venue_subscriptions')
        .insert({ user_id: user.id, venue_id: id });
      if (!error) {
        setIsSubscribed(true);
        toast.success('Subscribed to this venue!');
        setShowSubSuccess(true);
      } else {
        toast.error('Failed to subscribe.');
      }
    }
    setSubLoading(false);
    setIsSubscribeModalOpen(false);
  };

  if (loading) {
    return (
      <div className={containerClass + ' min-h-screen bg-black'}>
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
      <div className={containerClass + ' min-h-screen bg-black'}>
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
            <>
              <Button
                onClick={() => setIsChatModalOpen(true)}
                variant="outline"
                className="w-full mt-3 flex items-center justify-center border-gray-600 text-gray-300 hover:bg-navy hover:text-white"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat with Venue
              </Button>
              <Button
                onClick={() => user ? (isSubscribed ? setShowUnsubModal(true) : setIsSubscribeModalOpen(true)) : navigate('/login')}
                variant={isSubscribed ? "secondary" : "default"}
                className="w-full mt-3 flex items-center justify-center border-indigo-600 text-indigo-300 hover:bg-indigo hover:text-white relative group"
                disabled={subLoading}
              >
                <span className="mr-2">
                  <Heart className={`w-5 h-5 transition-transform duration-300 ${isSubscribed ? 'fill-pink-500 scale-110' : 'stroke-pink-500 group-hover:scale-110'}`} />
                </span>
                <span>{isSubscribed ? "Unsubscribe" : "Subscribe"}</span>
                {/* Tooltip */}
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10">
                  {isSubscribed ? "Stop receiving updates from this venue" : "Get updates, offers, and more from this venue!"}
                </span>
              </Button>
              {/* Subscriber count and avatars - always visible */}
              <div className="flex items-center mt-2 gap-1">
                {subscriberCount === 0 ? (
                  <span className="text-xs text-gray-400">Be the first to subscribe!</span>
                ) : (
                  <span className="text-xs text-pink-400 font-semibold animate-pulse">{subscriberCount} people have already subscribed. Join them for exclusive updates!</span>
                )}
              </div>
            </>
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
              <>
                <Button
                  onClick={() => setIsChatModalOpen(true)}
                  variant="outline"
                  className="w-full mt-3 flex items-center justify-center border-gray-600 text-gray-300 hover:bg-navy hover:text-white"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat with Venue
                </Button>
                <Button
                  onClick={() => user ? (isSubscribed ? setShowUnsubModal(true) : setIsSubscribeModalOpen(true)) : navigate('/login')}
                  variant={isSubscribed ? "secondary" : "default"}
                  className="w-full mt-3 flex items-center justify-center border-indigo-600 text-indigo-300 hover:bg-indigo hover:text-white relative group"
                  disabled={subLoading}
                >
                  <span className="mr-2">
                    <Heart className={`w-5 h-5 transition-transform duration-300 ${isSubscribed ? 'fill-pink-500 scale-110' : 'stroke-pink-500 group-hover:scale-110'}`} />
                  </span>
                  <span>{isSubscribed ? "Unsubscribe" : "Subscribe"}</span>
                  {/* Tooltip */}
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10">
                    {isSubscribed ? "Stop receiving updates from this venue" : "Get updates, offers, and more from this venue!"}
                  </span>
                </Button>
                {/* Subscriber count and avatars - always visible */}
                <div className="flex items-center mt-2 gap-1">
                  {subscriberCount === 0 ? (
                    <span className="text-xs text-gray-400">Be the first to subscribe!</span>
                  ) : (
                    <span className="text-xs text-pink-400 font-semibold animate-pulse">{subscriberCount} people have already subscribed. Join them for exclusive updates!</span>
                  )}
                </div>
              </>
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
                        ? `${(distance * 1000).toFixed(0)}m away` 
                        : `${distance.toFixed(1)}km away`}
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
    <div className={containerClass + ' min-h-screen bg-navy-dark'}>
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
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/70 to-transparent" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="absolute bottom-20 md:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
            <CarouselPrevious className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-white/20" />
            <CarouselNext className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-white/20" />
          </div>
        </Carousel>
        
        {/* Venue Title Overlay - Improved mobile visibility */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-navy-dark via-navy-dark/90 to-transparent">
          <div className="container mx-auto p-4 md:p-6">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-lg">
              {venue?.name}
            </h1>
            <div className="flex flex-col md:flex-row md:items-center text-gray-200 md:space-x-4 space-y-2 md:space-y-0">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1 drop-shadow" />
                <span className="text-sm md:text-base drop-shadow-lg">{venue?.location}</span>
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1 text-[#2def80] drop-shadow" />
                <span className="text-sm md:text-base drop-shadow-lg">{venue?.rating?.toFixed(1) || '4.5'}</span>
              </div>
              {distance !== null && (
                <div className="flex items-center">
                  <Navigation className="w-4 h-4 mr-1 text-[#2def80] drop-shadow" />
                  <span className="text-sm md:text-base drop-shadow-lg">
                    {distance < 1 
                      ? `${(distance * 1000).toFixed(0)}m away` 
                      : `${distance.toFixed(1)}km away`}
                  </span>
                </div>
              )}
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
          open={isBookModalOpen}
          onOpenChange={setIsBookModalOpen}
          selectedDate={new Date()}
          selectedCourt={null}
          hourlyRate={null}
          onBookingComplete={() => {}}
          allowCashPayments={true}
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
      {isSubscribeModalOpen && (
        <Dialog open={isSubscribeModalOpen} onOpenChange={setIsSubscribeModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isSubscribed ? "Unsubscribe from Venue" : "Subscribe to Venue"}</DialogTitle>
            </DialogHeader>
            <div className="py-2 text-gray-200 text-sm">
              {isSubscribed
                ? "Are you sure you want to unsubscribe from this venue? You will stop receiving updates and notifications."
                : "Subscribing means you'll receive notifications and updates from this venue, such as offers or important announcements. Continue?"}
            </div>
            <DialogFooter>
              <Button onClick={handleSubscribe} disabled={subLoading}>
                {isSubscribed ? "Yes, Unsubscribe" : "Yes, Subscribe"}
              </Button>
              <Button variant="ghost" onClick={() => setIsSubscribeModalOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Subscribe confirmation modal with confetti/checkmark */}
      <Dialog open={showSubSuccess} onOpenChange={setShowSubSuccess}>
        <DialogContent className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            {/* Confetti/checkmark animation (SVG or Lottie placeholder) */}
            <svg className="w-16 h-16 text-green-400 mx-auto animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <DialogTitle className="text-green-500">Subscribed!</DialogTitle>
          <p className="text-gray-300 mt-2">You'll now get updates, offers, and more from this venue.</p>
          <Button onClick={() => setShowSubSuccess(false)} className="mt-4">Close</Button>
        </DialogContent>
      </Dialog>
      {/* Unsubscribe feedback modal */}
      <Dialog open={showUnsubModal} onOpenChange={setShowUnsubModal}>
        <DialogContent>
          <DialogTitle>Unsubscribe from this venue?</DialogTitle>
          <p className="text-gray-400 mb-2">We'd love to know why (optional):</p>
          <textarea className="w-full rounded border border-gray-300 p-2 mb-4" rows={3} value={unsubReason} onChange={e => setUnsubReason(e.target.value)} placeholder="Your feedback helps us improve" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowUnsubModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { setShowUnsubModal(false); await handleSubscribe(); }}>{subLoading ? 'Unsubscribing...' : 'Unsubscribe'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VenueDetails;
