import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, MapPin, Clock, User, ChevronRight, Activity, Star } from 'lucide-react';
import Header from '../components/Header';
import BookSlotModal from '../components/BookSlotModal';
import { EnterChallengeButton } from '@/components/challenge/EnterChallengeButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
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
  "The more difficult the victory, the greater the happiness in winning. — Pelé",
  "You miss 100% of the shots you don't take. — Wayne Gretzky",
  "Champions keep playing until they get it right. — Billie Jean King"
];

const athletesBenefits = [
  {
    title: "Challenge Mode",
    description: "Compete against other teams in our competitive arena",
    image: "https://example.com/image1.jpg"
  },
  {
    title: "Training Log",
    description: "Track your progress and sessions",
    image: "https://example.com/image2.jpg"
  }
];

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState({ venues: true, sports: true });

  // Refs for scroll effects
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const venuesRef = useRef<HTMLDivElement>(null);
  const sportsRef = useRef<HTMLDivElement>(null);

  // Scroll handler for video effects
  useEffect(() => {
    const handleScroll = () => {
      if (videoRef.current && heroSectionRef.current) {
        const scrollPosition = window.scrollY;
        const heroHeight = heroSectionRef.current.offsetHeight;
        const scrollPercent = Math.min(scrollPosition / (heroHeight * 0.3), 1);
        
        // Apply effects based on scroll
        videoRef.current.style.filter = `blur(${8 - (scrollPercent * 8)}px) brightness(${0.7 + (scrollPercent * 0.3)})`;
        videoRef.current.style.transform = `scale(${1 + scrollPercent * 0.15})`;
        
        const overlay = heroSectionRef.current.querySelector('.hero-overlay');
        if (overlay) {
          overlay.style.opacity = `${1 - scrollPercent * 0.7}`;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch venues
        const { data: venuesData } = await supabase
          .from('venues')
          .select('*')
          .limit(4);
        if (venuesData) setVenues(venuesData);

        // Fetch sports
        const { data: sportsData } = await supabase
          .from('sports')
          .select('*')
          .limit(4);
        if (sportsData) setSports(sportsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading({ venues: false, sports: false });
      }
    };

    fetchData();

    // Quotes rotation
    const quoteInterval = setInterval(() => {
      setActiveQuoteIndex(prev => (prev + 1) % sportsQuotes.length);
    }, 8000);

    return () => clearInterval(quoteInterval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />

      {/* Hero Section with Scroll-Controlled Video */}
      <section 
        ref={heroSectionRef}
        className="relative h-screen w-full overflow-hidden"
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
          style={{
            filter: 'blur(8px) brightness(0.7)',
            transform: 'scale(1)',
            transition: 'filter 0.4s ease-out, transform 0.4s ease-out'
          }}
        >
          <source 
            src="https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/vedios//mixkit-one-on-one-in-a-soccer-game-43483-full-hd%20(1).mp4" 
            type="video/mp4" 
          />
        </video>

        <div 
          className="hero-overlay absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"
          style={{ opacity: 1, transition: 'opacity 0.4s ease-out' }}
        />

        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            <span className="text-indigo-400">Game</span> On!
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mb-10 animate-fade-in delay-100">
            Book sports venues instantly. Challenge rivals. Elevate your game.
          </p>
          <div className="flex gap-4 animate-fade-in delay-200">
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
            >
              Book Now
            </button>
            <Link
              to="/venues"
              className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
            >
              Explore Venues
            </Link>
          </div>
          <EnterChallengeButton className="mt-8 animate-fade-in delay-300" />
        </div>

        <div className="absolute bottom-10 left-0 right-0 flex justify-center animate-bounce">
          <div className="text-sm text-white/80">Scroll to explore</div>
        </div>
      </section>

      {/* Venues Section */}
      <section 
        ref={venuesRef}
        className="py-20 bg-gradient-to-b from-gray-900 to-gray-950"
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">
              Featured Venues
              <span className="block h-1 w-16 bg-indigo-500 mt-2"></span>
            </h2>
            <Link to="/venues" className="flex items-center text-indigo-400 hover:text-indigo-300">
              View all <ChevronRight className="ml-1" />
            </Link>
          </div>

          {loading.venues ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <Carousel>
              <CarouselContent>
                {venues.map((venue) => (
                  <CarouselItem key={venue.id} className="md:basis-1/2 lg:basis-1/4">
                    <div className="bg-gray-800 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-indigo-500/20 transition-all">
                      <div className="relative h-60 overflow-hidden">
                        <img
                          src={venue.image_url}
                          alt={venue.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <div className="flex justify-between items-end">
                            <h3 className="text-xl font-bold">{venue.name}</h3>
                            <div className="flex items-center bg-white/90 text-gray-900 px-2 py-1 rounded-full text-sm">
                              <Star className="h-4 w-4 fill-yellow-400 mr-1" />
                              {venue.rating.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center text-gray-400 mb-3">
                          <MapPin className="h-5 w-5 mr-1" />
                          {venue.location}
                        </div>
                        <button
                          onClick={() => navigate(`/venues/${venue.id}`)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 bg-gray-800 hover:bg-gray-700" />
              <CarouselNext className="right-2 bg-gray-800 hover:bg-gray-700" />
            </Carousel>
          )}
        </div>
      </section>

      {/* Sports Section */}
      <section 
        ref={sportsRef}
        className="py-20 bg-gradient-to-b from-gray-950 to-gray-900"
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">
              Popular Sports
              <span className="block h-1 w-16 bg-indigo-500 mt-2"></span>
            </h2>
            <Link to="/sports" className="flex items-center text-indigo-400 hover:text-indigo-300">
              View all <ChevronRight className="ml-1" />
            </Link>
          </div>

          {loading.sports ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sports.map((sport) => (
                <div 
                  key={sport.id}
                  className="group relative overflow-hidden rounded-xl cursor-pointer"
                  onClick={() => navigate(`/venues?sport=${sport.id}`)}
                >
                  <div className="relative h-60 overflow-hidden">
                    <img
                      src={sport.image_url}
                      alt={sport.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>
                  <div className="absolute inset-0 flex items-end p-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-1 group-hover:text-indigo-400 transition-colors">
                        {sport.name}
                      </h3>
                      <p className="text-gray-300 line-clamp-2">
                        {sport.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Athletes Benefits Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            For Athletes
            <span className="block h-1 w-16 bg-indigo-500 mt-2 mx-auto"></span>
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
            Elevate your game with our specialized features
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {athletesBenefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-gray-800 rounded-xl overflow-hidden group"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={benefit.image}
                    alt={benefit.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-400">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quotes Section */}
      <section className="py-20 bg-indigo-600/10">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-indigo-500/20">
            <Activity className="h-12 w-12 mx-auto mb-6 text-indigo-400" />
            <p className="text-2xl italic mb-6">
              "{sportsQuotes[activeQuoteIndex]}"
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
            >
              Join Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SportySlot</h3>
              <p className="text-gray-400">
                Book sports venues and challenge teams in one platform.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-indigo-400">Home</Link></li>
                <li><Link to="/venues" className="hover:text-indigo-400">Venues</Link></li>
                <li><Link to="/sports" className="hover:text-indigo-400">Sports</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/contact" className="hover:text-indigo-400">Contact</Link></li>
                <li><Link to="/faq" className="hover:text-indigo-400">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 rounded-l-md w-full bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-r-md">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} SportySlot. All rights reserved.</p>
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
