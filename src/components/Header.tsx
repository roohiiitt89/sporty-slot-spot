import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, CalendarDays, LogOut, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  
  const {
    user,
    signOut,
    userRole
  } = useAuth();
  
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
    if (isProfileOpen) setIsProfileOpen(false);
  };
  
  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
  };
  
  const handleSignOut = async () => {
    await signOut();
    setIsProfileOpen(false);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };
  
  const isAdminUser = userRole === 'admin' || userRole === 'super_admin';
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Don't show the header on admin routes - AdminHome.tsx and Dashboard.tsx have their own navigation
  if (isAdminUser && isAdminRoute) {
    return null;
  }
  
  return (
    <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to={isAdminUser ? "/admin" : "/"} className="flex items-center">
            <span className={`text-2xl font-bold transition-colors duration-300 ${isScrolled ? 'text-indigo' : 'text-white'}`}>Grid2Play</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isAdminUser ? (
              // Admin Navigation Links
              <>
                <Link to="/admin/venues" className={`font-medium text-navy-dark hover:text-indigo`}>Venues</Link>
                <Link to="/admin/bookings" className={`font-medium text-navy-dark hover:text-indigo`}>Bookings</Link>
                <Link to="/admin/courts" className={`font-medium text-navy-dark hover:text-indigo`}>Courts</Link>
                <Link to="/admin/analytics" className={`font-medium text-navy-dark hover:text-indigo`}>Analytics</Link>
              </>
            ) : (
              // Regular User Navigation Links
              <>
                <Link to="/" className={`font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>Home</Link>
                <Link to="/venues" className={`font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>Venues</Link>
                <Link to="/sports" className={`font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>Sports</Link>
              </>
            )}
            
            {/* Show different options based on authentication status */}
            {user ? (
              <>
                {!isAdminUser && (
                  <Link to="/bookings" className={`flex items-center font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>
                    <CalendarDays className="w-4 h-4 mr-1" />
                    My Bookings
                  </Link>
                )}
                
                {/* Profile dropdown */}
                <div className="relative">
                  <button onClick={toggleProfileMenu} className={`flex items-center font-medium transition-colors duration-300 ${isScrolled || isAdminRoute ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>
                    <User className="w-4 h-4 mr-1" />
                    Profile
                  </button>
                  
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      {!isAdminUser && (
                        <Link to="/profile" className="block px-4 py-2 text-sm text-navy-dark hover:bg-slate-light" onClick={() => setIsProfileOpen(false)}>
                          My Profile
                        </Link>
                      )}
                      <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                        <LogOut className="w-4 h-4 mr-1" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className={`flex items-center font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>
                  <User className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
                <Link to="/register" className={`nike-button ${isScrolled ? 'bg-indigo text-white' : 'bg-white text-indigo'}`}>
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button onClick={toggleMobileMenu} className={`md:hidden ${isScrolled || isAdminRoute ? 'text-navy-dark' : 'text-white'}`}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-[61px] left-0 right-0 bg-white shadow-lg z-40">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-2">
            {isAdminUser ? (
              // Admin Mobile Navigation Links
              <>
                <Link to="/admin" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Dashboard</Link>
                <Link to="/admin/venues" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Venues</Link>
                <Link to="/admin/bookings" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Bookings</Link>
                <Link to="/admin/courts" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Courts</Link>
                <Link to="/admin/analytics" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Analytics</Link>
              </>
            ) : (
              // Regular User Mobile Navigation Links
              <>
                <Link to="/" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Home</Link>
                <Link to="/venues" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Venues</Link>
                <Link to="/sports" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Sports</Link>
              </>
            )}
            
            {user ? (
              <>
                {!isAdminUser && (
                  <Link to="/bookings" className="flex items-center font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>
                    <CalendarDays className="w-4 h-4 mr-1" />
                    My Bookings
                  </Link>
                )}
                
                {!isAdminUser && (
                  <Link to="/profile" className="flex items-center font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>
                    <User className="w-4 h-4 mr-1" />
                    My Profile
                  </Link>
                )}
                
                <button onClick={handleSignOut} className="flex items-center font-medium text-red-600 hover:text-red-800 py-2 w-full text-left">
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>
                  <User className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
                <Link to="/register" className="bg-indigo text-white py-2 px-4 rounded text-center font-medium" onClick={toggleMobileMenu}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
