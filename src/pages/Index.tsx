import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, MapPin, Clock, User, ChevronRight, Activity, Star } from 'lucide-react';
import Header from '../components/Header';
import BookSlotModal from '../components/BookSlotModal';
import { EnterChallengeButton } from '@/components/challenge/EnterChallengeButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { StreakBar } from '@/components/StreakBar';
import { LocationPermissionRequest } from '@/components/LocationPermissionRequest';
import { NearbyVenues } from '@/components/NearbyVenues';
import HomepageAvailabilityWidget from '@/components/HomepageAvailabilityWidget';
import RotatingTypewriter from '@/components/RotatingTypewriter';
import { Typewriter } from '@/components/Typewriter';
import ProgressiveImage from '@/components/ProgressiveImage';
import { AuroraBackgroundDemo } from "@/components/ui/demo";

interface Venue {
  id: string;
  name: string;
  location: string;
  image_url: string;
  rating: number;
  review_count?: number;
  total_bookings?: number;
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
const motivationalLines = [
  "Every champion was once a contender that refused to give up.",
  "The only bad workout is the one you didn't do.",
  "Push your limits, play your best.",
  "Winners train, losers complain.",
  "Greatness starts with a single step onto the court.",
  "Sweat now, shine later.",
  "Your only competition is yourself.",
  "Dream big. Train hard. Play harder.",
  "Hustle, hit, never quit.",
  "The game isn't over until you win."
];
const athleteFeatures = [
  {
    title: "AI Chat Assistant",
    description: "Get instant help, recommendations, and booking support with our smart AI assistant.",
    image: "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20-2.jpg"
  },
  {
    title: "Seamless Bookings",
    description: "Book your favorite sports slots in seconds with real-time availability and secure payments.",
    image: "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20-2.jpg"
  },
  {
    title: "Challenge Mode (Coming Soon!)",
    description: "Compete with friends and teams, climb the leaderboard, and win rewards in our upcoming Challenge Mode.",
    image: "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20-2.jpg"
  },
  {
    title: "Host & Join Tournaments",
    description: "Browse, join, or host tournaments. Manage fixtures, results, and more—all in one place.",
    image: "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20-2.jpg"
  },
  {
    title: "Personalized Experience",
    description: "Enjoy personalized greetings, motivational vibes, and recommendations tailored just for you.",
    image: "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20-2.jpg"
  }
];
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
  const [greeting, setGreeting] = useState('');
  const [mostPlayedSport, setMostPlayedSport] = useState<string | null>(null);
  const [motivationalLine, setMotivationalLine] = useState('');
  
  const venuesRef = useRef<HTMLDivElement>(null);
  const sportsRef = useRef<HTMLDivElement>(null);
  const athletesRef = useRef<HTMLDivElement>(null);
  const forYouRef = useRef<HTMLDivElement>(null);
  const quotesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Fetch real data from Supabase
    fetchVenues();
    fetchSports();
    const quoteInterval = setInterval(() => {
      setActiveQuoteIndex(prev => (prev + 1) % sportsQuotes.length);
    }, 5000);
    return () => clearInterval(quoteInterval);
  }, []);
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
  
  // Update VenueSkeleton component
  const VenueSkeleton = () => (
    <div className="venue-card animate-pulse rounded-lg overflow-hidden">
      <div className="h-44 bg-navy-light"></div>
      <div className="p-3 bg-navy">
        <div className="h-5 w-3/4 bg-navy-light rounded mb-2"></div>
        <div className="h-4 w-1/2 bg-navy-light rounded"></div>
      </div>
    </div>
  );
  
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    let timeGreeting = 'Welcome back';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 18) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    if (user) {
      const name = user?.user_metadata?.full_name || '';
      setGreeting(`${timeGreeting}${name ? ', ' + name : ''}!`);
      setMotivationalLine(motivationalLines[Math.floor(Math.random() * motivationalLines.length)]);
    } else {
      setGreeting("Welcome, Athlete!");
      setMotivationalLine("Ready to play? Sign in and join the action!");
    }
  }, [user]);

  useEffect(() => {
    // Fetch user's most played sport
    const fetchMostPlayedSport = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('bookings')
        .select('court:courts(sport:sports(name, id))')
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'completed']);
      if (error || !data) return;
      const sportCount: Record<string, { name: string; count: number }> = {};
      data.forEach((b: any) => {
        const sport = b.court?.sport;
        if (sport && sport.id) {
          if (!sportCount[sport.id]) sportCount[sport.id] = { name: sport.name, count: 0 };
          sportCount[sport.id].count++;
        }
      });
      const sorted = Object.values(sportCount).sort((a, b) => b.count - a.count);
      if (sorted.length > 0) {
        setMostPlayedSport(sorted[0].name);
        setMotivationalLine(`Keep dominating the field, ${user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || ''}! You're a true ${sorted[0].name} star.`);
      } else {
        setMostPlayedSport(null);
        setMotivationalLine('Ready to play? Book your favorite sport and get started!');
      }
    };
    fetchMostPlayedSport();
  }, [user]);
  
  return (
    <div className="min-h-screen bg-navy-dark text-card-foreground">
      <Header />
      
<section className="hero-section">
  <AuroraBackgroundDemo />
</section>

      {/* Personalized Greeting Section (replaces Discover venues near you) */}
      {!locationPermissionHandled && (
        <div className="container mx-auto px-4 -mt-6 sm:mt-16 relative z-10">
          <div className="bg-gradient-to-r from-indigo-500/10 to-green-500/10 rounded-xl p-4 mb-4 border border-indigo-500/20 flex flex-col items-center text-center">
            <h2 className="text-xl font-semibold text-white mb-1">{greeting}</h2>
            <p className="text-green-300 text-sm mb-2">{motivationalLine}</p>
            {!user && (
              <button
                className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Near You Section after the hero section */}
      <div className="pt-0">
        <NearbyVenues />
      </div>

      <section id="venues" ref={venuesRef} className="py-16 bg-gradient-to-b from-black/90 to-navy-dark">
        <div className="container mx-auto px-4 pb-24">
          <div className={`flex justify-between items-center mb-8 ${visibleSections.venues ? 'animate-reveal' : 'opacity-0'}`}>
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
                  {venues.map((venue, index) => (
                    <CarouselItem key={venue.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
                      <div 
                        className="venue-card group cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-black via-[#1E3B2C] to-black border border-[#2E7D32] hover:shadow-[0_0_16px_2px_#2E7D32] hover:border-[#2def80] shadow-lg animate-fade-in transition-all duration-300" 
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
                        <div className="h-24 md:h-32 overflow-hidden relative">
                          <img src={venue.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'} alt={venue.name} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-80"></div>
                          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur px-2 py-0.5 rounded flex items-center shadow">
                            <Star className="h-3 w-3 md:h-4 md:w-4 text-[#2E7D32] fill-current mr-1" />
                            <span className="text-xs md:text-sm font-bold text-white">{venue.rating.toFixed(1)}</span>
                            {venue.review_count && (
                              <span className="text-gray-400 ml-1">({venue.review_count})</span>
                            )}
                          </div>
                        </div>
                        <div className="p-2 md:p-3">
                          <h3 className="text-xs md:text-base font-semibold text-white mb-0.5 md:mb-1 truncate group-hover:text-[#2E7D32] transition-colors">{venue.name}</h3>
                          <p className="text-[10px] md:text-xs text-gray-300 mb-1 truncate">{venue.location || 'Find a venue near you'}</p>
                          <div className="flex items-center justify-between text-[10px] md:text-xs">
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-[#2E7D32]" />
                              <span className="text-white">{venue.rating.toFixed(1)}</span>
                            </div>
                            {venue.total_bookings && (
                              <span className="text-[#2E7D32]/80">{venue.total_bookings} bookings</span>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1E3B2C] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : (
              <div className="text-center py-8 md:py-12 bg-black rounded-lg">
                <p className="text-white text-lg mb-4">No venues found</p>
                <button onClick={() => navigate('/venues')} className="px-4 py-2 bg-[#1E3B2C] text-white rounded-md hover:bg-[#2E7D32] transition-colors">
                  Browse All Venues
                </button>
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
      {loading.sports ? <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo"></div>
        </div> : sports.length > 0 ? <Carousel className="w-full">
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
              Discover what makes our platform unique and perfect for your sports journey.
            </p>
          </div>
          {/* Desktop Grid */}
          <div className={`hidden md:grid md:grid-cols-2 lg:grid-cols-5 gap-6 ${visibleSections.athletes ? 'animate-reveal' : 'opacity-0'}`}> 
            {athleteFeatures.map((feature, index) => (
              <div key={index} className="group" style={{ animationDelay: `${0.15 * (index + 1)}s` }}>
                <div className="overflow-hidden rounded-lg bg-navy relative h-80">
                  <img src={feature.image} alt={feature.title} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy to-transparent opacity-70" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <h3 className="text-xl font-bold group-hover:text-white transition-colors">{feature.title}</h3>
                    <p className="text-gray-300 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Mobile Carousel */}
          <div className={`md:hidden ${visibleSections.athletes ? 'animate-reveal' : 'opacity-0'}`}> 
            <Carousel className="w-full">
              <CarouselContent className="gap-4">
                {athleteFeatures.map((feature, index) => (
                  <CarouselItem
                    key={index}
                    className="basis-[80%] px-2"
                    style={{ scrollSnapAlign: 'center' }}
                  >
                    <div className="relative h-[300px] rounded-xl overflow-hidden bg-navy group active:scale-95 transition-all duration-300">
                      <img src={feature.image} alt={feature.title} className="w-full h-full object-cover brightness-90 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent opacity-90" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <div className="bg-navy/80 backdrop-blur-sm rounded-lg p-4 border-t border-indigo/20 transform translate-y-0 group-hover:-translate-y-2 transition-transform duration-300">
                          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#2def80] transition-colors">{feature.title}</h3>
                          <p className="text-sm text-gray-300 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
                <CarouselPrevious className="relative inset-0 translate-y-0 h-8 w-8 rounded-full bg-navy hover:bg-indigo text-white border border-indigo/20 hover:border-indigo transition-colors" />
                <CarouselNext className="relative inset-0 translate-y-0 h-8 w-8 rounded-full bg-navy hover:bg-indigo text-white border border-indigo/20 hover:border-indigo transition-colors" />
              </div>
            </Carousel>
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
          <h2 className={`section-title text-center text-white mb-8 ${visibleSections.forYou ? 'animate-reveal' : 'opacity-0'}`}>
            For You
            <span className="block w-20 h-1 bg-indigo-light mx-auto mt-2"></span>
          </h2>
          
          <div className={`max-w-4xl mx-auto ${visibleSections.forYou ? 'animate-reveal' : 'opacity-0'}`} style={{
            animationDelay: '0.2s'
          }}>
            <div className="glass-card shadow-2xl overflow-hidden bg-navy/50">
              <div className="p-6">
                <div className="mb-6 flex items-center">
                  <Activity className="w-6 h-6 text-indigo-light mr-3" />
                  <h3 className="text-xl font-bold text-white">Recommended For You</h3>
                </div>
                
                <StreakBar />
                
                <div className="my-6">
                  <Suspense fallback={<div className="h-[200px] bg-navy animate-pulse rounded-lg"></div>}>
                    <HomepageAvailabilityWidget />
                  </Suspense>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col items-center text-center p-4 rounded-lg border border-indigo/30 hover:border-indigo-light bg-navy/50 hover:bg-navy transition-all">
                    <Calendar className="w-8 h-8 mb-3 text-indigo-light" />
                    <h4 className="text-base font-semibold mb-1 text-white">Quick Booking</h4>
                    <p className="text-sm text-gray-400">Based on your preferences</p>
                    <button onClick={() => setIsBookModalOpen(true)} className="mt-3 py-1.5 px-4 bg-indigo hover:bg-indigo-dark text-white text-sm rounded-full transition-colors">
                      Book Now
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4 rounded-lg border border-indigo/30 hover:border-indigo-light bg-navy/50 hover:bg-navy transition-all">
                    <Clock className="w-8 h-8 mb-3 text-indigo-light" />
                    <h4 className="text-base font-semibold mb-1 text-white">Upcoming Event</h4>
                    <p className="text-sm text-gray-400">Community tournament</p>
                    <button className="mt-3 py-1.5 px-4 bg-indigo hover:bg-indigo-dark text-white text-sm rounded-full transition-colors">
                      Learn More
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4 rounded-lg border border-indigo/30 hover:border-indigo-light bg-navy/50 hover:bg-navy transition-all">
                    <User className="w-8 h-8 mb-3 text-indigo-light" />
                    <h4 className="text-base font-semibold mb-1 text-white">Complete Profile</h4>
                    <p className="text-sm text-gray-400">Get recommendations</p>
                    <Link to="/register" className="mt-3 py-1.5 px-4 bg-indigo hover:bg-indigo-dark text-white text-sm rounded-full transition-colors">
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
              <h3 className="text-xl font-bold mb-4">Grid2Play</h3>
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
                <li><Link to="/help" className="hover:text-indigo-light transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-indigo-light transition-colors">Contact Us</Link></li>
                <li><Link to="/privacy" className="hover:text-indigo-light transition-colors">Privacy Policy</Link></li>
                <li><Link to="/faq" className="hover:text-indigo-light transition-colors">FAQs</Link></li>
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
            <p>&copy; 2025 Grid2Play. All rights reserved.</p>
          </div>
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
        />
      )}
    </div>
  );
};

export default Index;
