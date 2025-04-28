
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User, CalendarDays } from 'lucide-react';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <span className={`text-2xl font-bold transition-colors duration-300 ${
              isScrolled ? 'text-sport-green' : 'text-white'
            }`}>
              SportySlot
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`font-medium transition-colors duration-300 ${
              isScrolled ? 'text-sport-gray-dark hover:text-sport-green' : 'text-white hover:text-sport-green-light'
            }`}>Home</Link>
            <Link to="/venues" className={`font-medium transition-colors duration-300 ${
              isScrolled ? 'text-sport-gray-dark hover:text-sport-green' : 'text-white hover:text-sport-green-light'
            }`}>Venues</Link>
            <Link to="/sports" className={`font-medium transition-colors duration-300 ${
              isScrolled ? 'text-sport-gray-dark hover:text-sport-green' : 'text-white hover:text-sport-green-light'
            }`}>Sports</Link>
            <Link to="/bookings" className={`flex items-center font-medium transition-colors duration-300 ${
              isScrolled ? 'text-sport-gray-dark hover:text-sport-green' : 'text-white hover:text-sport-green-light'
            }`}>
              <CalendarDays className="w-4 h-4 mr-1" />
              My Bookings
            </Link>
            <Link to="/login" className={`flex items-center font-medium transition-colors duration-300 ${
              isScrolled ? 'text-sport-gray-dark hover:text-sport-green' : 'text-white hover:text-sport-green-light'
            }`}>
              <User className="w-4 h-4 mr-1" />
              Sign In
            </Link>
            <Link to="/register" className={`nike-button ${
              isScrolled ? 'bg-sport-green text-white' : 'bg-white text-sport-green'
            }`}>
              Sign Up
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            className={`md:hidden ${isScrolled ? 'text-sport-gray-dark' : 'text-white'}`}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link to="/" className="font-medium text-sport-gray-dark hover:text-sport-green py-2" onClick={toggleMobileMenu}>Home</Link>
            <Link to="/venues" className="font-medium text-sport-gray-dark hover:text-sport-green py-2" onClick={toggleMobileMenu}>Venues</Link>
            <Link to="/sports" className="font-medium text-sport-gray-dark hover:text-sport-green py-2" onClick={toggleMobileMenu}>Sports</Link>
            <Link to="/bookings" className="flex items-center font-medium text-sport-gray-dark hover:text-sport-green py-2" onClick={toggleMobileMenu}>
              <CalendarDays className="w-4 h-4 mr-1" />
              My Bookings
            </Link>
            <Link to="/login" className="flex items-center font-medium text-sport-gray-dark hover:text-sport-green py-2" onClick={toggleMobileMenu}>
              <User className="w-4 h-4 mr-1" />
              Sign In
            </Link>
            <Link to="/register" className="nike-button text-center" onClick={toggleMobileMenu}>
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
