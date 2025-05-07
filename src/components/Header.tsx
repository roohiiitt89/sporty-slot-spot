import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User, CalendarDays, LogOut, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
  return <header className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <span className={`text-2xl font-bold transition-colors duration-300 ${isScrolled ? 'text-indigo' : 'text-white'}`}>
              SportySlot
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>Home</Link>
            <Link to="/venues" className={`font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>Venues</Link>
            <Link to="/sports" className={`font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>Sports</Link>
            
            {/* Admin Dashboard Link - Only visible to admin and super_admin users */}
            {isAdminUser && <Link to="/admin" className={`flex items-center font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>
                <LayoutGrid className="w-4 h-4 mr-1" />
                Admin
              </Link>}
            
            {/* Show different options based on authentication status */}
            {user ? <>
                <Link to="/bookings" className={`flex items-center font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>
                  <CalendarDays className="w-4 h-4 mr-1" />
                  My Bookings
                </Link>
                
                {/* Profile dropdown */}
                <div className="relative">
                  <button onClick={toggleProfileMenu} className={`flex items-center font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>
                    <User className="w-4 h-4 mr-1" />
                    Profile
                  </button>
                  
                  {isProfileOpen && <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link to="/profile" className="block px-4 py-2 text-sm text-navy-dark hover:bg-slate-light" onClick={() => setIsProfileOpen(false)}>
                        My Profile
                      </Link>
                      <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                        <LogOut className="w-4 h-4 mr-1" />
                        Sign Out
                      </button>
                    </div>}
                </div>
              </> : <>
                <Link to="/login" className={`flex items-center font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>
                  <User className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
                <Link to="/register" className={`nike-button ${isScrolled ? 'bg-indigo text-white' : 'bg-white text-indigo'}`}>
                  Sign Up
                </Link>
              </>}
          </nav>

          {/* Mobile Menu Button */}
          <button onClick={toggleMobileMenu} className={`md:hidden ${isScrolled ? 'text-navy-dark' : 'text-white'}`}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && <div className="md:hidden bg-white shadow-lg">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4 bg-[sport-green-dark] bg-navy-light">
            <Link to="/" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Home</Link>
            <Link to="/venues" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Venues</Link>
            <Link to="/sports" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Sports</Link>
            
            {/* Admin Dashboard Link in Mobile Menu - Only visible to admin users */}
            {isAdminUser && <Link to="/admin" className="flex items-center font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>
                <LayoutGrid className="w-4 h-4 mr-1" />
                Admin Dashboard
              </Link>}
            
            {user ? <>
                <Link to="/bookings" className="flex items-center font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>
                  <CalendarDays className="w-4 h-4 mr-1" />
                  My Bookings
                </Link>
                <Link to="/profile" className="flex items-center font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>
                  <User className="w-4 h-4 mr-1" />
                  My Profile
                </Link>
                <button onClick={handleSignOut} className="flex items-center font-medium text-red-600 hover:text-red-800 py-2">
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </> : <>
                <Link to="/login" className="flex items-center font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>
                  <User className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
                <Link to="/register" className="nike-button text-center" onClick={toggleMobileMenu}>
                  Sign Up
                </Link>
              </>}
          </div>
        </div>}
    </header>;
};
export default Header;