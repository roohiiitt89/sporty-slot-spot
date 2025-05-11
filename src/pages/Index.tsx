import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, MapPin, Clock, User, ChevronRight, Activity, Star } from 'lucide-react';
import Header from '../components/Header';
import BookSlotModal from '../components/BookSlotModal';
import { EnterChallengeButton } from '@/components/challenge/EnterChallengeButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
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
    <div className="min-h-screen bg-navy-dark text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="absolute w-full h-full object-cover"
        >
          <source src="https://lrtirloetmulgmdxnusl.supabase.co/storage/v1/object/public/vedios//mixkit-one-on-one-in-a-soccer-game-43483-full-hd%20(1).mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Book Now for Your <span className="text-green-500">Game On!</span>
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto">
            Find and book your favorite sports venues easily.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <button 
              onClick={() => setIsBookModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors"
            >
              Book A Slot Now
              <ArrowRight className="ml-2" />
            </button>
            <Link 
              to="/venues" 
              className="bg-white hover:bg-gray-100 text-navy-dark px-6 py-3 rounded-lg border border-gray-300 transition-colors"
            >
              Browse Venues
            </Link>
          </div>
          <EnterChallengeButton />
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <LocationPermissionRequest />
      </div>

      <NearbyVenues />

      {/* Venues Section */}
      <section id="venues" ref={venuesRef} className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">
              Featured Venues
              <span className="block w-20 h-1 bg-green-500 mt-2"></span>
            </h2>
            <Link to="/venues" className="text-green-400 hover:text-green-300 flex items-center transition-colors">
              View All <ChevronRight className="ml-1" />
            </Link>
          </div>
          
          {loading.venues ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : venues.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <div 
                  key={venue.id}
                  className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow hover:-translate-y-1 cursor-pointer"
                  onClick={() => navigate(`/venues/${venue.id}`)}
                >
                  <div className="relative h-48">
                    <img
                      src={venue.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 flex items-center bg-black/60 px-2 py-1 rounded-full">
                      <Star className="text-yellow-400 mr-1" size={16} />
                      <span className="text-white text-sm">{venue.rating?.toFixed(1) || '4.5'}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold mb-1">{venue.name}</h3>
                    <div className="flex items-center text-gray-400">
                      <MapPin size={16} className="mr-1" />
                      <p className="text-sm">{venue.location || 'Location not specified'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No venues available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Sports Section */}
      <section id="sports" ref={sportsRef} className="py-16 bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">
              Featured Sports
              <span className="block w-20 h-1 bg-green-500 mt-2"></span>
            </h2>
            <Link to="/sports" className="text-green-400 hover:text-green-300 flex items-center transition-colors">
              View All <ChevronRight className="ml-1" />
            </Link>
          </div>
          
          {loading.sports ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : sports.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {sports.map((sport) => (
                <div
                  key={sport.id}
                  className="group bg-gray-700 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleSportCardClick(sport.id)}
                >
                  <div className="relative aspect-square">
                    <img
                      src={sport.image_url || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000'}
                      alt={sport.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-center font-semibold group-hover:text-green-400 transition-colors">
                      {sport.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No sports available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Athletes Section */}
      <section id="athletes" ref={athletesRef} className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">
              For Athletes
              <span className="block w-20 h-1 bg-green-500 mt-2 mx-auto"></span>
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto mt-4">
              Enhance your athletic journey with our advanced features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {athletesBenefits.map((benefit, index) => (
              <div key={index} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={benefit.image} 
                    alt={benefit.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-gray-400">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For You Section */}
      <section id="forYou" ref={forYouRef} className="py-16 bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">
            For You
            <span className="block w-20 h-1 bg-green-500 mt-2 mx-auto"></span>
          </h2>
          
          <div className="bg-gray-700 rounded-xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
            <div className="p-8">
              <div className="mb-6 flex items-center">
                <Activity className="text-green-500 mr-3" size={24} />
                <h3 className="text-2xl font-bold">Recommended For You</h3>
              </div>
              
              <StreakBar />
              
              <div className="my-8">
                <HomepageAvailabilityWidget />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-600 p-4 rounded-lg text-center">
                  <Calendar className="mx-auto text-green-400 mb-3" size={24} />
                  <h4 className="text-lg font-semibold mb-1">Quick Booking</h4>
                  <button 
                    onClick={() => setIsBookModalOpen(true)}
                    className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Book Now
                  </button>
                </div>
                
                <div className="bg-gray-600 p-4 rounded-lg text-center">
                  <Clock className="mx-auto text-green-400 mb-3" size={24} />
                  <h4 className="text-lg font-semibold mb-1">Upcoming Event</h4>
                  <button className="mt-3 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md transition-colors">
                    Learn More
                  </button>
                </div>
                
                <div className="bg-gray-600 p-4 rounded-lg text-center">
                  <User className="mx-auto text-green-400 mb-3" size={24} />
                  <h4 className="text-lg font-semibold mb-1">Complete Profile</h4>
                  <Link 
                    to="/register" 
                    className="mt-3 inline-block bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quotes Section */}
      <section id="quotes" ref={quotesRef} className="py-16 bg-green-600 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-10 text-white">
            Become A Partner
            <span className="block w-20 h-1 bg-white mt-2 mx-auto"></span>
          </h2>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-medium text-white italic">
                {sportsQuotes[activeQuoteIndex]}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SportySlot</h3>
              <p className="text-gray-400 mb-4">Book your sports venues easily and quickly.</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/venues" className="text-gray-400 hover:text-white transition-colors">Venues</Link></li>
                <li><Link to="/sports" className="text-gray-400 hover:text-white transition-colors">Sports</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
              <form className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="px-4 py-2 rounded-l-md w-full focus:outline-none text-gray-900"
                />
                <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-r-md transition-colors">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} SportySlot. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {isBookModalOpen && <BookSlotModal onClose={() => setIsBookModalOpen(false)} />}
    </div>
  );
};

export default Index;
