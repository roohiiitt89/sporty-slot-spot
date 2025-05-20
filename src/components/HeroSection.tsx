
import React from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-navy-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Find and Book Sports Venues <br className="hidden md:block" />
            <span className="text-indigo-400">Instantly</span>
          </h1>
          <p className="text-xl max-w-2xl mb-10 text-gray-300">
            Discover nearby sports facilities, check real-time availability, and book your next game with just a few clicks.
          </p>
          
          <div className="w-full max-w-xl bg-white/10 backdrop-blur-sm p-2 rounded-lg shadow-lg mb-8">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search sports or venues..."
                  className="w-full bg-white/20 border-0 rounded-md py-3 pl-10 pr-4 text-white placeholder-gray-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Location"
                  className="w-full bg-white/20 border-0 rounded-md py-3 pl-10 pr-4 text-white placeholder-gray-300 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              </div>
              <Link
                to="/venues"
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-md transition duration-150 ease-in-out shadow-md hover:shadow-lg"
              >
                Search
              </Link>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
              <span className="mr-2">⚽</span>
              <span>Football</span>
            </div>
            <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
              <span className="mr-2">🏏</span>
              <span>Cricket</span>
            </div>
            <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
              <span className="mr-2">🏸</span>
              <span>Badminton</span>
            </div>
            <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
              <span className="mr-2">🏀</span>
              <span>Basketball</span>
            </div>
            <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
              <span className="mr-2">🎾</span>
              <span>Tennis</span>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-24 bg-gradient-to-b from-transparent to-gray-50"></div>
    </div>
  );
};

export default HeroSection;
