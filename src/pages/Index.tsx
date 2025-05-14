import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, MapPin, Clock, User, ChevronRight, Activity, Star, Search } from 'lucide-react';
import Header from '../components/Header';
import BookSlotModal from '../components/BookSlotModal';
import { EnterChallengeButton } from '@/components/challenge/EnterChallengeButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { StreakBar } from '@/components/StreakBar';
import { LocationPermissionRequest } from '@/components/LocationPermissionRequest';
import { NearbyVenues } from '@/components/NearbyVenues';
import { useInView } from 'react-intersection-observer';

// Lazy load components that are not immediately visible
const HomepageAvailabilityWidget = lazy(() => import('@/components/HomepageAvailabilityWidget'));
const AIChatWidget = lazy(() => import('@/components/AIChatWidget'));

interface Venue {
  id: string;
  name: string;
  location: string;
  image_url: string;
  rating: number;
  total_bookings?: number;
  review_count?: number;
}
interface Sport {
  id: string;
  name: string;
  description: string;
  image_url: string;
}
const sportsQuotes = ["\"The more difficult the victory, the greater the happiness in winning.\" — Pelé", "\"You miss 100% of the shots you don't take.\" — Wayne Gretzky", "\"Champions keep playing until they get it right.\" — Billie Jean King", "\"It ain't over till it's over.\" — Yogi Berra", "\"The difference between the impossible and the possible lies in a person's determination.\" — Tommy Lasorda"];
const athletesBenefits = [{
  title: "Challenge Mode",
  description: "Create your team, challenge rivals, and climb the leaderboard in our competitive arena.",
  image: "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20-3.jpg"
}, {
  title: "Digital Training Log",
  description: "Keep a digital record of all your training sessions and track progress over time",
  image: "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20-2.jpg"
}, {
  title: "Team Communication",
  description: "Stay connected with your team and coaches through our integrated messaging platform",
  image: "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20-4.jpg"
}, {
  title: "Skill Development",
  description: "Access personalized training plans to develop your skills and reach your full potential",
  image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1000&auto=format&fit=crop"
}];

const VenueSkeleton = () => (
  <div className="venue-card animate-pulse rounded-xl overflow-hidden">
    <div className="h-56 bg-navy-light"></div>
    <div className="p-4 bg-navy-light">
      <div className="h-6 w-3/4 bg-navy rounded mb-2"></div>
      <div className="h-4 w-1/2 bg-navy rounded"></div>
      <div className="mt-3 flex items-center justify-between">
        <div className="h-4 w-16 bg-navy rounded"></div>
        <div className="h-4 w-24 bg-navy rounded"></div>
      </div>
    </div>
  </div>
);

const SportSkeleton = () => (
  <div className="sport-card animate-pulse rounded-xl overflow-hidden">
    <div className="h-40 bg-navy-light"></div>
    <div className="p-3 bg-navy-light">
      <div className="h-5 w-2/3 bg-navy rounded mb-2"></div>
      <div className="h-4 w-full bg-navy rounded"></div>
    </div>
  </div>
);

// Progressive Image component
const ProgressiveImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
}> = ({ src, alt, className, placeholderSrc }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjAyMDIwIi8+PC9zdmc+`);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`${className} transition-all duration-500 ${isLoaded ? 'blur-0' : 'blur-sm'}`}
      loading="lazy"
    />
  );
};

const Index: React.FC = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [visibleSections, setVisibleSections] = useState({
    venues: false,
    sports: false,
    athletes: false,
    forYou: false,
    quotes: false
  });
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState({
    venues: true,
    sports: true
  });
  const [locationPermissionHandled, setLocationPermissionHandled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyViewed, setRecentlyViewed] = useState<Venue[]>([]);
  const [visibleVenueCount, setVisibleVenueCount] = useState(4);
  
  const venuesRef = useRef<HTMLDivElement>(null);
  const sportsRef = useRef<HTMLDivElement>(null);
  const athletesRef = useRef<HTMLDivElement>(null);
  const forYouRef = useRef<HTMLDivElement>(null);
  const quotesRef = useRef<HTMLDivElement>(null);
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  useEffect(() => {
    // Fetch real data from Supabase
    fetchVenues();
    fetchSports();
    fetchRecentlyViewed();
    const quoteInterval = setInterval(() => {
      setActiveQuoteIndex(prev => (prev + 1) % sportsQuotes.length);
    }, 5000);
    return () => clearInterval(quoteInterval);
  }, []);

  useEffect(() => {
    if (inView) {
      setVisibleVenueCount(prev => Math.min(prev + 4, venues.length));
    }
  }, [inView, venues.length]);

  const fetchVenues = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('venues').select('id, name, location, image_url, rating').eq('is_active', true).order('rating', {
        ascending: false
      }).limit(4);
      if (error) throw error;
      if (data) {
        setVenues(data);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(prev => ({
        ...prev,
        venues: false
      }));
    }
  };
  const fetchSports = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('sports').select('id, name, description, image_url').eq('is_active', true).limit(4);
      if (error) throw error;
      if (data) {
        setSports(data);
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
    } finally {
      setLoading(prev => ({
        ...prev,
        sports: false
      }));
    }
  };
  const fetchRecentlyViewed = async () => {
    try {
      // In a real app, this would be fetched from user's history in the database
      const { data, error } = await supabase
        .from('user_venue_history')
        .select('venue_id, venues(*)')
        .eq('user_id', user?.id)
        .order('viewed_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      if (data) {
        setRecentlyViewed(data.map(item => item.venues));
      }
    } catch (error) {
      console.error('Error fetching recently viewed venues:', error);
    }
  };
  useEffect(() => {
    const observerOptions = {
      threshold: 0.2
    };
    const observerCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          setVisibleSections(prev => ({
            ...prev,
            [sectionId]: true
          }));
        }
      });
    };
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    if (venuesRef.current) observer.observe(venuesRef.current);
    if (sportsRef.current) observer.observe(sportsRef.current);
    if (athletesRef.current) observer.observe(athletesRef.current);
    if (forYouRef.current) observer.observe(forYouRef.current);
    if (quotesRef.current) observer.observe(quotesRef.current);
    return () => observer.disconnect();
  }, []);
  const handleSportCardClick = (sportId: string) => {
    navigate(`/venues?sport=${sportId}`);
  };
  const handleLocationPermissionGranted = () => {
    setLocationPermissionHandled(true);
    console.log("Location permission granted");
  };
  
  const handleLocationPermissionDenied = () => {
    setLocationPermissionHandled(true);
    console.log("Location permission denied");
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/venues?search=${encodeURIComponent(searchQuery)}`);
  };

  return <div className="min-h-screen bg-navy-dark text-card-foreground">
      <Header />
      
<section className="hero-section">
  <video 
    autoPlay 
    muted 
    loop 
    playsInline 
    className="hero-video"
    poster="https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/vedios/poster.jpg"
  >
    <source 
      src="https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/vedios//mixkit-one-on-one-in-a-soccer-game-43483-full-hd%20(1).mp4" 
      type="video/mp4" 
    />
    Your browser does not support the video tag.
  </video>
  <div className="hero-overlay dark-gradient-overlay"></div>
  <div className="hero-content container mx-auto text-center">
    <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 animate-fade-in">
  Book Now for Your{' '}
  <Typewriter 
    texts={["Game On!", "Perfect Match!", "Training!", "Tournament!"]}
    delay={80}
  />
</h1>
    <p className="text-xl md:text-2xl text-white mb-10 max-w-3xl mx-auto animate-fade-in" style={{
      animationDelay: '0.2s'
    }}>
      Find and book your favorite sports venues easily. Multiple sports, venues, and flexible time slots all in one place.
    </p>
    
    {/* New Search Bar */}
    <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for venues, sports, or locations..."
          className="w-full px-6 py-4 rounded-full bg-white/10 backdrop-blur-md text-white placeholder-white/70 border border-white/20 focus:border-indigo-light focus:ring-2 focus:ring-indigo-light/50 outline-none transition-all"
        />
        <button type="submit" className="absolute right-2 p-3 text-white hover:text-indigo-light transition-colors">
          <Search className="w-6 h-6" />
        </button>
      </div>
    </form>

    <div className="flex flex-col md:flex-row justify-center gap-4 animate-fade-in" style={{
      animationDelay: '0.4s'
    }}>
      <button onClick={() => setIsBookModalOpen(true)} className="dynamic-button flex items-center justify-center">
        Book A Slot Now
        <ArrowRight className="ml-2 w-5 h-5" />
      </button>
      <Link to="/venues" className="nike-button bg-white text-indigo border border-indigo">
        Browse Venues
      </Link>
    </div>
          
          <EnterChallengeButton />
        </div>
      </section>

      {/* Add Location Permission Request here */}
      {!locationPermissionHandled && (
        <div className="container mx-auto px-4 -mt-6 relative z-10">
          <LocationPermissionRequest
            onPermissionGranted={handleLocationPermissionGranted}
          />
        </div>
      )}

      {/* Add Near You Section after the hero section */}
      <div className="pt-0">
        <NearbyVenues />
      </div>

      {/* Recently Viewed Section */}
      {user && recentlyViewed.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-navy-dark to-black/90">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-10">
              <h2 className="section-title text-white relative">
                Recently Viewed
                <span className="absolute -bottom-2 left-0 w-20 h-1 bg-indigo-light"></span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentlyViewed.map((venue) => (
                <div
                  key={venue.id}
                  className="venue-card group cursor-pointer overflow-hidden rounded-xl bg-navy-light hover:bg-indigo transition-all duration-300"
                  onClick={() => navigate(`/venues/${venue.id}`)}
                >
                  <div className="relative h-48">
                    <img
                      src={venue.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-white mb-2">{venue.name}</h3>
                    <p className="text-gray-300 text-sm mb-3">{venue.location}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-white">{venue.rating.toFixed(1)}</span>
                        {venue.review_count && (
                          <span className="text-gray-400 ml-1">({venue.review_count})</span>
                        )}
                      </div>
                      {venue.total_bookings && (
                        <span className="text-gray-400">{venue.total_bookings} bookings</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="venues" ref={venuesRef} className="py-16 bg-gradient-to-b from-black/90 to-navy-dark">
        <div className="container mx-auto px-4">
          <div className={`flex justify-between items-center mb-10 ${visibleSections.venues ? 'animate-reveal' : 'opacity-0'}`}>
            <h2 className="section-title text-white relative">
              Featured Venues
              <span className="absolute -bottom-2 left-0 w-20 h-1 bg-indigo-light"></span>
            </h2>
            <Link to="/venues" className="text-indigo-light font-semibold flex items-center group hover:text-indigo-dark transition-colors">
              View All <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className={`${visibleSections.venues ? 'animate-reveal' : 'opacity-0'}`}>
            {loading.venues ? (
              <Carousel className="w-full">
                <CarouselContent className="-ml-2 md:-ml-4">
                  {[1, 2, 3, 4].map((_, index) => (
                    <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
                      <VenueSkeleton />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : venues.length > 0 ? (
              <Carousel className="w-full">
                <CarouselContent className="-ml-2 md:-ml-4">
                  {venues.slice(0, visibleVenueCount).map((venue, index) => (
                    <CarouselItem key={venue.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
                      <div 
                        className="venue-card group cursor-pointer overflow-hidden rounded-xl" 
                        style={{animationDelay: `${0.1 * (index + 1)}s`}} 
                        onClick={() => navigate(`/venues/${venue.id}`)}
                        role="button"
                        tabIndex={0}
                        aria-label={`Book ${venue.name} - Rating: ${venue.rating.toFixed(1)}, Location: ${venue.location}`}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            navigate(`/venues/${venue.id}`);
                          }
                        }}
                      >
                        <div className="h-56 overflow-hidden relative">
                          <ProgressiveImage
                            src={venue.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'}
                            alt={venue.name}
                            className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-30 group-hover:opacity-70 transition-opacity"></div>
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <div className="bg-indigo/80 backdrop-blur-sm p-3 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                              <Link to={`/venues/${venue.id}`} className="text-white font-semibold">
                                Details
                              </Link>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-navy-light text-white relative overflow-hidden group-hover:bg-indigo transition-colors duration-500">
                          <h3 className="text-xl font-bold group-hover:text-white transition-colors">
                            {venue.name}
                          </h3>
                          <p className="text-gray-300 mt-2 line-clamp-2">{venue.location || 'Find a venue near you'}</p>
                          
                          {/* Add social proof elements */}
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              <span className="text-white">{venue.rating.toFixed(1)}</span>
                              {venue.review_count && (
                                <span className="text-gray-400 ml-1">({venue.review_count})</span>
                              )}
                            </div>
                            {venue.total_bookings && (
                              <span className="text-gray-400">{venue.total_bookings} bookings</span>
                            )}
                          </div>
                          
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                          
                          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-indigo-light rounded-full opacity-0 group-hover:opacity-20 transform translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700"></div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-end mt-6 gap-2">
                  <CarouselPrevious 
                    className="relative inset-0 translate-y-0 bg-navy-light hover:bg-indigo hover:text-white text-white"
                    aria-label="View previous venues"
                  />
                  <CarouselNext 
                    className="relative inset-0 translate-y-0 bg-navy-light hover:bg-indigo hover:text-white text-white"
                    aria-label="View next venues"
                  />
                </div>
              </Carousel>
            ) : (
              <div className="text-center py-12">
                <p className="text-white text-lg">No venues available at the moment. Please check back later.</p>
              </div>
            )}
          </div>
        </div>
      </section>

     <section id="sports" ref={sportsRef} className="py-16 bg-gradient-to-b from-navy-dark to-black/90">
  <div className="container mx-auto px-4">
    <div className={`flex justify-between items-center mb-10 ${visibleSections.sports ? 'animate-reveal' : 'opacity-0'}`}>
      <h2 className="section-title text-white relative">
        Featured Sports
        <span className="absolute -bottom-2 left-0 w-20 h-1 bg-indigo-light"></span>
      </h2>
      <Link to="/sports" className="text-indigo-light font-semibold flex items-center group hover:text-indigo-dark transition-colors">
        View All <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
    
    <div className={`${visibleSections.sports ? 'animate-reveal' : 'opacity-0'}`}>
      {loading.sports ? (
        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {[1, 2, 3, 4].map((_, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
                <SportSkeleton />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : sports.length > 0 ? <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {sports.map((sport, index) => <CarouselItem key={sport.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
              <div className="sport-card group cursor-pointer overflow-hidden rounded-xl" style={{
          animationDelay: `${0.1 * (index + 1)}s`
        }} onClick={() => handleSportCardClick(sport.id)}>
                <div className="h-40 overflow-hidden relative"> {/* Changed from h-56 to h-40 */}
                  <img src={sport.image_url || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000'} alt={sport.name} className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-30 group-hover:opacity-70 transition-opacity"></div>
                  
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="bg-indigo/80 backdrop-blur-sm p-3 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* Reduced icon size */}
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-navy-light text-white relative overflow-hidden group-hover:bg-indigo transition-colors duration-500"> {/* Reduced padding */}
                  <h3 className="text-lg font-bold group-hover:text-white transition-colors"> {/* Reduced text size */}
                    {sport.name}
                  </h3>
                  <p className="text-gray-300 mt-1 text-sm line-clamp-2">{sport.description || 'Find venues for this sport'}</p> {/* Reduced text size and margin */}
                  
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                  
                  <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-indigo-light rounded-full opacity-0 group-hover:opacity-20 transform translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700"></div>
                </div>
              </div>
            </CarouselItem>)}
        </CarouselContent>
        <div className="flex justify-end mt-6 gap-2">
          <CarouselPrevious className="relative inset-0 translate-y-0 bg-navy-light hover:bg-indigo hover:text-white text-white" />
          <CarouselNext className="relative inset-0 translate-y-0 bg-navy-light hover:bg-indigo hover:text-white text-white" />
        </div>
      </Carousel> : <div className="text-center py-12">
        <p className="text-white text-lg">No sports available at the moment. Please check back later.</p>
      </div>}
    </div>
  </div>
</section>

      <section id="athletes" ref={athletesRef} className="py-16 bg-gradient-to-b from-black/90 to-navy-dark">
        <div className="container mx-auto px-4">
          <div className={`mb-10 ${visibleSections.athletes ? 'animate-reveal' : 'opacity-0'}`}>
            <h2 className="section-title text-white text-center relative">
              For Athletes
              <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-indigo-light"></span>
            </h2>
            <p className="text-gray-300 text-center max-w-3xl mx-auto mt-4">
              Enhance your athletic journey with our advanced features designed specifically for players and teams
            </p>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${visibleSections.athletes ? 'animate-reveal' : 'opacity-0'}`}>
            {athletesBenefits.map((benefit, index) => <div key={index} className="group" style={{
            animationDelay: `${0.15 * (index + 1)}s`
          }}>
                <div className="overflow-hidden rounded-lg bg-navy relative h-80">
                  <img src={benefit.image} alt={benefit.title} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500" />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent opacity-70"></div>
                  
                  <div className="absolute inset-0">
                    <svg className="w-full h-full opacity-0 group-hover:opacity-40 transition-opacity duration-700" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="2" fill="#4CAF50" className="animate-pulse-light" />
                      <circle cx="80" cy="30" r="2" fill="#4CAF50" className="animate-pulse-light" style={{
                    animationDelay: '0.5s'
                  }} />
                      <circle cx="65" cy="65" r="2" fill="#4CAF50" className="animate-pulse-light" style={{
                    animationDelay: '1s'
                  }} />
                      <circle cx="30" cy="75" r="2" fill="#4CAF50" className="animate-pulse-light" style={{
                    animationDelay: '1.5s'
                  }} />
                      <line x1="20" y1="20" x2="80" y2="30" stroke="#4CAF50" strokeWidth="0.5" strokeDasharray="2" />
                      <line x1="80" y1="30" x2="65" y2="65" stroke="#4CAF50" strokeWidth="0.5" strokeDasharray="2" />
                      <line x1="65" y1="65" x2="30" y2="75" stroke="#4CAF50" strokeWidth="0.5" strokeDasharray="2" />
                      <line x1="30" y1="75" x2="20" y2="20" stroke="#4CAF50" strokeWidth="0.5" strokeDasharray="2" />
                    </svg>
                  </div>
                  
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                    <p className="text-gray-300 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">{benefit.description}</p>
                  </div>
                </div>
              </div>)}
          </div>
          
          <div className="mt-10 text-center">
            <Link to="/register" className="inline-flex items-center px-6 py-3 bg-indigo text-white rounded-md hover:bg-indigo-dark transition-colors">
              Join Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section id="forYou" ref={forYouRef} className="py-16 bg-gradient-to-r from-navy-light to-navy-dark">
        <div className="container mx-auto px-4">
          <h2 className={`section-title text-center text-white ${visibleSections.forYou ? 'animate-reveal' : 'opacity-0'}`}>For You</h2>
          
          <div className={`max-w-4xl mx-auto ${visibleSections.forYou ? 'animate-reveal' : 'opacity-0'}`} style={{
          animationDelay: '0.2s'
        }}>
            <div className="glass-card shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="mb-6 flex items-center">
                  <Activity className="w-8 h-8 text-indigo-light mr-3" />
                  <h3 className="text-2xl font-bold text-white">Recommended For You</h3>
                </div>
                
                {/* Added StreakBar component here */}
                <StreakBar />
                
                {/* Add Real-Time Availability Widget Here */}
                <div className="my-8">
                  <Suspense fallback={<div className="h-[200px] bg-navy-light animate-pulse rounded-lg"></div>}>
                    <HomepageAvailabilityWidget />
                  </Suspense>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center text-center p-4 rounded-lg border border-indigo-light hover:bg-indigo hover:text-white transition-all">
                    <Calendar className="w-10 h-10 mb-3" />
                    <h4 className="text-lg font-semibold mb-1">Quick Booking</h4>
                    <p className="text-sm">Based on your preferences</p>
                    <button onClick={() => setIsBookModalOpen(true)} className="mt-4 py-2 px-4 bg-indigo text-white rounded-md hover:bg-indigo-dark transition-colors">
                      Book Now
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4 rounded-lg border border-navy hover:bg-navy hover:text-white transition-all">
                    <Clock className="w-10 h-10 mb-3" />
                    <h4 className="text-lg font-semibold mb-1">Upcoming Event</h4>
                    <p className="text-sm">Community basketball tournament</p>
                    <button className="mt-4 py-2 px-4 bg-navy-dark text-white rounded-md hover:bg-black transition-colors">
                      Learn More
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4 rounded-lg border border-navy hover:bg-navy hover:text-white transition-all">
                    <User className="w-10 h-10 mb-3" />
                    <h4 className="text-lg font-semibold mb-1">Complete Profile</h4>
                    <p className="text-sm">Get personalized recommendations</p>
                    <Link to="/register" className="mt-4 py-2 px-4 bg-navy-dark text-white rounded-md hover:bg-black transition-colors">
                      Sign Up
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="partners" ref={quotesRef} className="py-16 bg-indigo relative overflow-hidden">
  <div className="absolute inset-0 pattern-dots pattern-opacity-10 bg-navy-dark"></div>
  <div className="container mx-auto px-4 relative z-10">
    <h2 className={`text-3xl font-bold text-center text-white mb-10 ${visibleSections.quotes ? 'animate-reveal' : 'opacity-0'}`}>
      Become A Partner
      <span className="block w-20 h-1 bg-white mt-2 mx-auto"></span>
    </h2>
    
    <div className="relative w-full max-w-6xl mx-auto overflow-hidden">
      {/* Gradient fade edges */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-indigo to-transparent z-10"></div>
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-indigo to-transparent z-10"></div>
      
      {/* Infinite scrolling carousel */}
      <div className="flex overflow-x-hidden group hover:[animation-play-state:paused]">
        <div className="flex animate-infinite-scroll whitespace-nowrap">
          {[
            "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20-3.jpg",
            "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20.jpg",
            "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//ChatGPT%20Image%20Apr%2018,%202025,%2001_59_47%20AM.png",
            "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//3e6653285e2d08a596a15f28e50d2735.jpg"
          ].map((img, idx) => (
            <div key={idx} className="inline-flex items-center justify-center mx-4">
              <img 
                src={img} 
                alt={`Partner ${idx + 1}`}
                className="h-32 w-auto object-contain max-w-[200px] md:max-w-[300px] rounded-lg shadow-md hover:scale-105 transition-transform"
                loading="lazy"
              />
            </div>
          ))}
          {/* Duplicate for seamless looping */}
          {[
            "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20-3.jpg",
            "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20.jpg",
            "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//ChatGPT%20Image%20Apr%2018,%202025,%2001_59_47%20AM.png",
            "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//3e6653285e2d08a596a15f28e50d2735.jpg"
          ].map((img, idx) => (
            <div key={`dup-${idx}`} className="inline-flex items-center justify-center mx-4">
              <img 
                src={img} 
                alt={`Partner ${idx + 1}`}
                className="h-32 w-auto object-contain max-w-[200px] md:max-w-[300px] rounded-lg shadow-md hover:scale-105 transition-transform"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</section>

      <footer className="bg-navy-dark text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SportySlot</h3>
              <p className="text-gray-300 mb-4">Book your sports venues easily and quickly. Multiple sports, venues, and flexible time slots all in one place.</p>
              <div className="flex space-x-4">
                {/* Social media icons would go here */}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="hover:text-indigo-light transition-colors">Home</Link></li>
                <li><Link to="/venues" className="hover:text-indigo-light transition-colors">Venues</Link></li>
                <li><Link to="/sports" className="hover:text-indigo-light transition-colors">Sports</Link></li>
                <li><Link to="/bookings" className="hover:text-indigo-light transition-colors">My Bookings</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-indigo-light transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-indigo-light transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-indigo-light transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-indigo-light transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
              <p className="text-gray-300 mb-4">Subscribe to get updates on new venues and special offers.</p>
              <form className="flex">
                <input type="email" placeholder="Your email" className="px-4 py-2 rounded-l-md w-full focus:outline-none text-navy-dark" />
                <button className="bg-indigo px-4 py-2 rounded-r-md hover:bg-indigo-dark transition-colors">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-navy text-center text-gray-400">
            <p>&copy; 2025 SportySlot. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {isBookModalOpen && <BookSlotModal onClose={() => setIsBookModalOpen(false)} />}
      
      {/* Lazy load components that are not immediately visible */}
      <Suspense fallback={null}>
        <AIChatWidget />
      </Suspense>

      {/* Add infinite scroll trigger */}
      {venues.length > visibleVenueCount && (
        <div ref={loadMoreRef} className="h-10" />
      )}
    </div>;
};
export default Index;
