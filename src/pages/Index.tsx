import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, MapPin, Clock, User, ChevronRight, Activity, Star } from 'lucide-react';
import Header from '../components/Header';
import BookSlotModal from '../components/BookSlotModal';
import { supabase } from '@/integrations/supabase/client';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";

interface Venue {
  id: string;
  name: string;
  location: string;
  image_url: string;
  rating: number;
}

interface Sport {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

const sportsQuotes = [
  "\"The more difficult the victory, the greater the happiness in winning.\" — Pelé",
  "\"You miss 100% of the shots you don't take.\" — Wayne Gretzky",
  "\"Champions keep playing until they get it right.\" — Billie Jean King",
  "\"It ain't over till it's over.\" — Yogi Berra",
  "\"The difference between the impossible and the possible lies in a person's determination.\" — Tommy Lasorda",
];

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [visibleSections, setVisibleSections] = useState({
    venues: false,
    sports: false,
    forYou: false,
    quotes: false
  });
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState({
    venues: true,
    sports: true
  });

  const venuesRef = useRef<HTMLDivElement>(null);
  const sportsRef = useRef<HTMLDivElement>(null);
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
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, location, image_url, rating')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(4);
        
      if (error) throw error;
      
      if (data) {
        setVenues(data);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(prev => ({ ...prev, venues: false }));
    }
  };

  const fetchSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sports')
        .select('id, name, description, image_url')
        .eq('is_active', true)
        .limit(4);
        
      if (error) throw error;
      
      if (data) {
        setSports(data);
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
    } finally {
      setLoading(prev => ({ ...prev, sports: false }));
    }
  };

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
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
    if (forYouRef.current) observer.observe(forYouRef.current);
    if (quotesRef.current) observer.observe(quotesRef.current);

    return () => observer.disconnect();
  }, []);

  const handleSportCardClick = (sportId: string) => {
    navigate(`/venues?sport=${sportId}`);
  };

  return (
    <div className="min-h-screen bg-card text-card-foreground">
      <Header />
      
      <section className="hero-section">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="hero-video"
        >
          <source src="https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/vedios//mixkit-one-on-one-in-a-soccer-game-43483-full-hd%20(1).mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="hero-overlay dark-gradient-overlay"></div>
        <div className="hero-content container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 animate-fade-in">
            Book Now for Your <span className="text-indigo-light">Game On!</span>
          </h1>
          <p className="text-xl md:text-2xl text-white mb-10 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Find and book your favorite sports venues easily. Multiple sports, venues, and flexible time slots all in one place.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <button 
              onClick={() => setIsBookModalOpen(true)} 
              className="dynamic-button flex items-center justify-center"
            >
              Book A Slot Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <Link to="/venues" className="nike-button bg-white text-indigo border border-indigo">
              Browse Venues
            </Link>
          </div>
        </div>
      </section>

      <section 
        id="venues" 
        ref={venuesRef}
        className="py-16 bg-gradient-to-b from-black/90 to-navy-dark"
      >
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
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo"></div>
              </div>
            ) : venues.length > 0 ? (
              <Carousel className="w-full">
                <CarouselContent className="-ml-2 md:-ml-4">
                  {venues.map((venue, index) => (
                    <CarouselItem key={venue.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
                      <div 
                        className="venue-card group hover-3d"
                        style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                      >
                        <div className="h-56 overflow-hidden relative">
                          <img 
                            src={venue.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'} 
                            alt={venue.name} 
                            className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-70 transition-opacity"></div>
                          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center text-sm font-semibold text-navy-dark">
                            <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                            {venue.rating ? venue.rating.toFixed(1) : '4.5'}
                          </span>
                        </div>
                        <div className="p-4 bg-navy-light text-white relative">
                          <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold group-hover:text-indigo-light transition-colors">
                              {venue.name}
                            </h3>
                          </div>
                          <div className="flex items-center mt-2 text-gray-300">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{venue.location}</span>
                          </div>
                          <button 
                            onClick={() => navigate(`/venues/${venue.id}`)}
                            className="mt-4 w-full py-2 bg-indigo text-white rounded-md font-semibold hover:bg-indigo-dark transition-colors transform transition-transform group-hover:scale-105"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-end mt-6 gap-2">
                  <CarouselPrevious className="relative inset-0 translate-y-0 bg-navy-light hover:bg-indigo hover:text-white text-white" />
                  <CarouselNext className="relative inset-0 translate-y-0 bg-navy-light hover:bg-indigo hover:text-white text-white" />
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

      <section 
        id="sports" 
        ref={sportsRef}
        className="py-16 bg-gradient-to-b from-navy-dark to-black/90"
      >
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
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo"></div>
              </div>
            ) : sports.length > 0 ? (
              <Carousel className="w-full">
                <CarouselContent className="-ml-2 md:-ml-4">
                  {sports.map((sport, index) => (
                    <CarouselItem key={sport.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
                      <div 
                        className="sport-card group hover-3d cursor-pointer"
                        style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                        onClick={() => handleSportCardClick(sport.id)}
                      >
                        <div className="h-56 overflow-hidden relative">
                          <img 
                            src={sport.image_url || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000'} 
                            alt={sport.name} 
                            className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-70 transition-opacity"></div>
                          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="bg-indigo text-white px-6 py-2 rounded-md transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                            >
                              Find Venues
                            </button>
                          </div>
                        </div>
                        <div className="p-4 bg-navy-light text-white">
                          <h3 className="text-xl font-bold group-hover:text-indigo-light transition-colors">
                            {sport.name}
                          </h3>
                          <p className="text-gray-300 mt-2">{sport.description || 'Find venues for this sport'}</p>
                          <div className="mt-4 h-1 w-full bg-navy overflow-hidden">
                            <div className="h-full bg-indigo transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-end mt-6 gap-2">
                  <CarouselPrevious className="relative inset-0 translate-y-0 bg-navy-light hover:bg-indigo hover:text-white text-white" />
                  <CarouselNext className="relative inset-0 translate-y-0 bg-navy-light hover:bg-indigo hover:text-white text-white" />
                </div>
              </Carousel>
            ) : (
              <div className="text-center py-12">
                <p className="text-white text-lg">No sports available at the moment. Please check back later.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section 
        id="forYou" 
        ref={forYouRef}
        className="py-16 bg-gradient-to-r from-navy-light to-navy-dark"
      >
        <div className="container mx-auto px-4">
          <h2 className={`section-title text-center text-white ${visibleSections.forYou ? 'animate-reveal' : 'opacity-0'}`}>For You</h2>
          
          <div className={`max-w-4xl mx-auto ${visibleSections.forYou ? 'animate-reveal' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            <div className="glass-card shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="mb-6 flex items-center">
                  <Activity className="w-8 h-8 text-indigo-light mr-3" />
                  <h3 className="text-2xl font-bold text-white">Recommended For You</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center text-center p-4 rounded-lg border border-indigo-light hover:bg-indigo hover:text-white transition-all">
                    <Calendar className="w-10 h-10 mb-3" />
                    <h4 className="text-lg font-semibold mb-1">Quick Booking</h4>
                    <p className="text-sm">Based on your preferences</p>
                    <button 
                      onClick={() => setIsBookModalOpen(true)} 
                      className="mt-4 py-2 px-4 bg-indigo text-white rounded-md hover:bg-indigo-dark transition-colors"
                    >
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

      <section 
        id="quotes" 
        ref={quotesRef}
        className="py-16 bg-indigo relative overflow-hidden"
      >
        <div className="absolute inset-0 pattern-dots pattern-opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className={`section-title text-center text-white ${visibleSections.quotes ? 'animate-reveal' : 'opacity-0'}`}>
            Want To Register For A Tournament?
          </h2>
          
          <div className="max-w-4xl mx-auto mt-10">
            <div className={`glass-card p-8 ${visibleSections.quotes ? 'animate-reveal animate-float' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-medium text-white italic">
                  {sportsQuotes[activeQuoteIndex]}
                </p>
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
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="px-4 py-2 rounded-l-md w-full focus:outline-none text-navy-dark"
                />
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

      {isBookModalOpen && (
        <BookSlotModal onClose={() => setIsBookModalOpen(false)} />
      )}
    </div>
  );
};

export default Index;
