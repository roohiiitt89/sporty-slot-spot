
import React from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const HeroSection: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <section className="relative h-[500px] md:h-[600px] bg-gradient-to-r from-navy-dark to-navy">
      {/* Background overlay with slight opacity */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Background image (hero pattern) */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2070')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>

      <div className="container mx-auto px-4 h-full flex items-center relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Find and Book <span className="text-indigo-light">Sports Venues</span> Instantly
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 mb-8">
            Book courts, fields, and facilities near you with just a few clicks
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/venues" 
              className="bg-indigo hover:bg-indigo-dark text-white py-3 px-6 rounded-lg font-medium text-base md:text-lg flex items-center justify-center transition-colors"
            >
              <Search className="mr-2 h-5 w-5" />
              Find Venues
            </Link>
            <Link 
              to="/sports" 
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/30 py-3 px-6 rounded-lg font-medium text-base md:text-lg flex items-center justify-center transition-colors"
            >
              Browse Sports
            </Link>
          </div>

          {!isMobile && (
            <div className="mt-8 flex items-center space-x-4">
              <span className="text-white/80">Popular:</span>
              <div className="flex flex-wrap gap-2">
                <Link to="/sports?id=1" className="px-3 py-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full text-white text-sm transition-colors">
                  Tennis
                </Link>
                <Link to="/sports?id=2" className="px-3 py-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full text-white text-sm transition-colors">
                  Basketball
                </Link>
                <Link to="/sports?id=3" className="px-3 py-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full text-white text-sm transition-colors">
                  Football
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
