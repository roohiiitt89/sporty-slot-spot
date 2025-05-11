import React, { useState, useEffect, useRef } from 'react';
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
  "\"The difference between the impossible and the possible lies in a person's determination.\" — Tommy Lasorda"
];

const athletesBenefits = [
  {
    title: "Challenge Mode",
    description: "Create your team, challenge rivals, and climb the leaderboard in our competitive arena.",
    image: "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20-3.jpg"
  },
  {
    title: "Digital Training Log",
    description: "Keep a digital record of all your training sessions and track progress over time",
    image: "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20-2.jpg"
  },
  {
    title: "Team Communication",
    description: "Stay connected with your team and coaches through our integrated messaging platform",
    image: "https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/venues//%20-4.jpg"
  },
  {
    title: "Skill Development",
    description: "Access personalized training plans to develop your skills and reach your full potential",
    image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1000&auto=format&fit=crop"
  }
];

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const venuesRef = useRef<HTMLDivElement>(null);
  const sportsRef = useRef<HTMLDivElement>(null);
  const athletesRef = useRef<HTMLDivElement>(null);
  const forYouRef = useRef<HTMLDivElement>(null);
  const quotesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
        .limit(6);
      if (error) throw error;
      if (data) setVenues(data);
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
        .limit(6);
      if (error) throw error;
      if (data) setSports(data);
    } catch (error) {
      console.error('Error fetching sports:', error);
    } finally {
      setLoading(prev => ({ ...prev, sports: false }));
    }
  };

  useEffect(() => {
    const observerOptions = { threshold: 0.2 };
    const observerCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
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

  return (
    <div className="min-h-screen bg-navy-dark text-card-foreground">
      <Header />
      
      {/* Hero Section */}
      <section className="hero-section">
        <video autoPlay muted loop playsInline className="hero-video">
          <source src="https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/vedios//mixkit-one-on-one-in-a-soccer-game-43483-full-hd%20(1).mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="hero-overlay dark-gradient-overlay"></div>
        <div className="hero-content container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 animate-fade-in">
            Book Now for Your <span className="text-green-600">Game On!</span>
          </h1>
          <p className="text-xl md:text-2xl text-white mb-10 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Find and book your favorite sports venues easily. Multiple sports, venues, and flexible time slots all in one place.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
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

      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <LocationPermissionRequest />
      </div>

      <NearbyVenues />

      {/* Venues Section */}
      <section id="venues" ref={venuesRef} className="py-16 bg-gradient-to-b from-black/90 to-navy-dark">
        <div className="container mx-auto px-4">
          <div className={`flex justify-between items-center mb-10 ${visibleSections.venues ? 'animate-reveal' : 'opacity-0'}`}>
            <h2 className="text-3xl font-bold text-white relative">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {venues.map((venue, index) => (
                  <div 
                    key={venue.id} 
                    className="bg-navy-light rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    onClick={() => navigate(`/venues/${venue.id}`)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={venue.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'} 
                        alt={venue.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-4 left-4 flex items-center">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-1" />
                        <span className="text-white font-semibold">{venue.rating?.toFixed(1) || '4.5'}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-bold text-white mb-1">{venue.name}</h3>
                      <div className="flex items-center text-gray-300">
                        <MapPin className="w-4 h-4 mr-1" />
                        <p className="text-sm">{venue.location || 'Find a venue near you'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white text-lg">No venues available at the moment. Please check back later.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sports Section */}
      <section id="sports" ref={sportsRef} className="py-16 bg-gradient-to-b from-navy-dark to-black/90">
        <div className="container mx-auto px-4">
          <div className={`flex justify-between items-center mb-10 ${visibleSections.sports ? 'animate-reveal' : 'opacity-0'}`}>
            <h2 className="text-3xl font-bold text-white relative">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {sports.map((sport) => (
                  <div 
                    key={sport.id}
                    className="group bg-navy-light rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => handleSportCardClick(sport.id)}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={sport.image_url || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000'}
                        alt={sport.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="p-3">
                      <h3 className="text-center font-semibold text-white group-hover:text-indigo-light transition-colors">
                        {sport.name}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white text-lg">No sports available at the moment. Please check back later.</p>
              </div>
            )}
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
                  <HomepageAvailabilityWidget />
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

      <section id="quotes" ref={quotesRef} className="py-16 bg-indigo relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots pattern-opacity-10 bg-navy-dark"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className={`section-title text-center text-white ${visibleSections.quotes ? 'animate-reveal' : 'opacity-0'}`}>Become A Partner</h2>
          
          <div className="max-w-4xl mx-auto mt-10">
            <div className={`glass-card p-8 ${visibleSections.quotes ? 'animate-reveal animate-float' : 'opacity-0'}`} style={{
            animationDelay: '0.3s'
          }}>
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
    </div>;
};
export default Index;
