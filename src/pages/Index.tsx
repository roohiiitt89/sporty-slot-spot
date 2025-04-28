import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, MapPin, Clock, User, ChevronRight, Activity, Star } from 'lucide-react';
import Header from '../components/Header';
import BookSlotModal from '../components/BookSlotModal';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";

// Mock data (would come from API in production)
const featuredVenues = [
  {
    id: 1,
    name: 'Urban Sports Center',
    location: 'Downtown',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000',
    rating: 4.8,
  },
  {
    id: 2,
    name: 'Green Field Complex',
    location: 'West Side',
    image: 'https://images.unsplash.com/photo-1526232636376-53d03f24f092?q=80&w=1000',
    rating: 4.6,
  },
  {
    id: 3,
    name: 'Elite Training Center',
    location: 'North District',
    image: 'https://images.unsplash.com/photo-1478472160422-12f051d9800d?q=80&w=1000',
    rating: 4.9,
  },
  {
    id: 4,
    name: 'Community Sports Hub',
    location: 'East End',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000',
    rating: 4.7,
  },
];

const featuredSports = [
  {
    id: 1,
    name: 'Basketball',
    image: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=1000',
    description: 'Indoor courts available',
  },
  {
    id: 2,
    name: 'Tennis',
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1000',
    description: 'Professional courts with lighting',
  },
  {
    id: 3,
    name: 'Football',
    image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1000',
    description: 'Full-size pitches available',
  },
  {
    id: 4,
    name: 'Swimming',
    image: 'https://images.unsplash.com/photo-1600965962351-9a42dd4deb86?q=80&w=1000',
    description: 'Olympic-size pools',
  },
];

const sportsQuotes = [
  "\"The more difficult the victory, the greater the happiness in winning.\" ��� Pelé",
  "\"You miss 100% of the shots you don't take.\" — Wayne Gretzky",
  "\"Champions keep playing until they get it right.\" — Billie Jean King",
  "\"It ain't over till it's over.\" — Yogi Berra",
  "\"The difference between the impossible and the possible lies in a person's determination.\" — Tommy Lasorda",
];

const Index: React.FC = () => {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [visibleSections, setVisibleSections] = useState({
    venues: false,
    sports: false,
    forYou: false,
    quotes: false
  });

  const venuesRef = useRef<HTMLDivElement>(null);
  const sportsRef = useRef<HTMLDivElement>(null);
  const forYouRef = useRef<HTMLDivElement>(null);
  const quotesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setActiveQuoteIndex(prev => (prev + 1) % sportsQuotes.length);
    }, 5000);

    return () => clearInterval(quoteInterval);
  }, []);

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

  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="hero-section">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="hero-video"
        >
          <source src="https://cdn.coverr.co/videos/coverr-people-playing-basketball-5028/1080p.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-content container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 animate-fade-in">
            Book Now for You <span className="text-sport-green-light">Game On!</span>
          </h1>
          <p className="text-xl md:text-2xl text-white mb-10 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Find and book your favorite sports venues easily. Multiple sports, venues, and flexible time slots all in one place.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <button 
              onClick={() => setIsBookModalOpen(true)} 
              className="nike-button flex items-center justify-center"
            >
              Book A Slot Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <Link to="/venues" className="nike-button bg-white text-sport-green border border-sport-green">
              Browse Venues
            </Link>
          </div>
        </div>
      </section>

      <section 
        id="venues" 
        ref={venuesRef}
        className="py-16 bg-gradient-to-b from-sport-gray-light to-white"
      >
        <div className="container mx-auto px-4">
          <div className={`flex justify-between items-center mb-10 ${visibleSections.venues ? 'animate-reveal' : 'opacity-0'}`}>
            <h2 className="section-title relative">
              Featured Venues
              <span className="absolute -bottom-2 left-0 w-20 h-1 bg-sport-green-light"></span>
            </h2>
            <Link to="/venues" className="text-sport-green font-semibold flex items-center group hover:text-sport-green-dark transition-colors">
              View All <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className={`${visibleSections.venues ? 'animate-reveal' : 'opacity-0'}`}>
            <Carousel className="w-full">
              <CarouselContent className="-ml-2 md:-ml-4">
                {featuredVenues.map((venue, index) => (
                  <CarouselItem key={venue.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
                    <div 
                      className="venue-card group h-full"
                      style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                    >
                      <div className="h-56 overflow-hidden relative">
                        <img 
                          src={venue.image} 
                          alt={venue.name} 
                          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-50 transition-opacity"></div>
                        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center text-sm font-semibold text-sport-gray-dark">
                          <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                          {venue.rating}
                        </span>
                      </div>
                      <div className="p-4 bg-white relative">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold text-sport-gray-dark group-hover:text-sport-green transition-colors">
                            {venue.name}
                          </h3>
                        </div>
                        <div className="flex items-center text-sport-gray mt-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{venue.location}</span>
                        </div>
                        <button 
                          onClick={() => setIsBookModalOpen(true)} 
                          className="mt-4 w-full py-2 bg-sport-green text-white rounded-md font-semibold hover:bg-sport-green-dark transition-colors transform transition-transform group-hover:scale-105"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-end mt-6 gap-2">
                <CarouselPrevious className="relative inset-0 translate-y-0 bg-sport-gray-light hover:bg-sport-green hover:text-white" />
                <CarouselNext className="relative inset-0 translate-y-0 bg-sport-gray-light hover:bg-sport-green hover:text-white" />
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      <section 
        id="sports" 
        ref={sportsRef}
        className="py-16 bg-gradient-to-b from-white to-sport-gray-light"
      >
        <div className="container mx-auto px-4">
          <div className={`flex justify-between items-center mb-10 ${visibleSections.sports ? 'animate-reveal' : 'opacity-0'}`}>
            <h2 className="section-title relative">
              Featured Sports
              <span className="absolute -bottom-2 left-0 w-20 h-1 bg-sport-green-light"></span>
            </h2>
            <Link to="/sports" className="text-sport-green font-semibold flex items-center group hover:text-sport-green-dark transition-colors">
              View All <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className={`${visibleSections.sports ? 'animate-reveal' : 'opacity-0'}`}>
            <Carousel className="w-full">
              <CarouselContent className="-ml-2 md:-ml-4">
                {featuredSports.map((sport, index) => (
                  <CarouselItem key={sport.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/4">
                    <div 
                      className="sport-card group h-full"
                      style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                    >
                      <div className="h-56 overflow-hidden relative">
                        <img 
                          src={sport.image} 
                          alt={sport.name} 
                          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-50 transition-opacity"></div>
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setIsBookModalOpen(true)} 
                            className="bg-sport-green text-white px-6 py-2 rounded-md transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                          >
                            Find Venues
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-white">
                        <h3 className="text-xl font-bold text-sport-gray-dark group-hover:text-sport-green transition-colors">
                          {sport.name}
                        </h3>
                        <p className="text-sport-gray mt-2">{sport.description}</p>
                        <div className="mt-4 h-1 w-full bg-sport-gray-light overflow-hidden">
                          <div className="h-full bg-sport-green transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-end mt-6 gap-2">
                <CarouselPrevious className="relative inset-0 translate-y-0 bg-sport-gray-light hover:bg-sport-green hover:text-white" />
                <CarouselNext className="relative inset-0 translate-y-0 bg-sport-gray-light hover:bg-sport-green hover:text-white" />
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      <section 
        id="forYou" 
        ref={forYouRef}
        className="py-16 bg-gradient-to-r from-sport-gray-light to-white"
      >
        <div className="container mx-auto px-4">
          <h2 className={`section-title text-center ${visibleSections.forYou ? 'animate-reveal' : 'opacity-0'}`}>For You</h2>
          
          <div className={`max-w-4xl mx-auto ${visibleSections.forYou ? 'animate-reveal' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
              <div className="p-8">
                <div className="mb-6 flex items-center">
                  <Activity className="w-8 h-8 text-sport-green mr-3" />
                  <h3 className="text-2xl font-bold text-sport-gray-dark">Recommended For You</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center text-center p-4 rounded-lg border border-sport-green-light hover:bg-sport-green-light hover:text-white transition-all">
                    <Calendar className="w-10 h-10 mb-3" />
                    <h4 className="text-lg font-semibold mb-1">Quick Booking</h4>
                    <p className="text-sm">Based on your preferences</p>
                    <button 
                      onClick={() => setIsBookModalOpen(true)} 
                      className="mt-4 py-2 px-4 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4 rounded-lg border border-sport-gray hover:bg-sport-gray hover:text-white transition-all">
                    <Clock className="w-10 h-10 mb-3" />
                    <h4 className="text-lg font-semibold mb-1">Upcoming Event</h4>
                    <p className="text-sm">Community basketball tournament</p>
                    <button className="mt-4 py-2 px-4 bg-sport-gray-dark text-white rounded-md hover:bg-black transition-colors">
                      Learn More
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4 rounded-lg border border-sport-gray hover:bg-sport-gray hover:text-white transition-all">
                    <User className="w-10 h-10 mb-3" />
                    <h4 className="text-lg font-semibold mb-1">Complete Profile</h4>
                    <p className="text-sm">Get personalized recommendations</p>
                    <Link to="/register" className="mt-4 py-2 px-4 bg-sport-gray-dark text-white rounded-md hover:bg-black transition-colors">
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
        className="py-16 bg-sport-green relative overflow-hidden"
      >
        <div className="absolute inset-0 pattern-dots pattern-opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className={`section-title text-center text-white ${visibleSections.quotes ? 'animate-reveal' : 'opacity-0'}`}>
            Sports Inspiration
          </h2>
          
          <div className="max-w-4xl mx-auto mt-10">
            <div className={`bg-white bg-opacity-10 rounded-xl p-8 backdrop-blur-sm border border-white border-opacity-20 ${visibleSections.quotes ? 'animate-reveal animate-float' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-medium text-white italic">
                  {sportsQuotes[activeQuoteIndex]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-sport-gray-dark text-white py-12">
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
                <li><Link to="/" className="hover:text-sport-green-light transition-colors">Home</Link></li>
                <li><Link to="/venues" className="hover:text-sport-green-light transition-colors">Venues</Link></li>
                <li><Link to="/sports" className="hover:text-sport-green-light transition-colors">Sports</Link></li>
                <li><Link to="/bookings" className="hover:text-sport-green-light transition-colors">My Bookings</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-sport-green-light transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-sport-green-light transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-sport-green-light transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-sport-green-light transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
              <p className="text-gray-300 mb-4">Subscribe to get updates on new venues and special offers.</p>
              <form className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="px-4 py-2 rounded-l-md w-full focus:outline-none text-sport-gray-dark"
                />
                <button className="bg-sport-green px-4 py-2 rounded-r-md hover:bg-sport-green-dark transition-colors">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
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
