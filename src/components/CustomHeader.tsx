
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const CustomHeader: React.FC = () => {
  const { user, userRole } = useAuth();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-navy-dark/90 backdrop-blur-md shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo rounded-md flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
              <div className="text-white font-bold text-xl">Grid2Play</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="flex items-center space-x-6">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
              <Link to="/venues" className="text-gray-300 hover:text-white transition-colors">Venues</Link>
              <Link to="/sports" className="text-gray-300 hover:text-white transition-colors">Sports</Link>
              {user && !isAdmin && (
                <>
                  <Link to="/bookings" className="text-gray-300 hover:text-white transition-colors">My Bookings</Link>
                  <Link to="/challenge" className="text-gray-300 hover:text-white transition-colors">Challenges</Link>
                </>
              )}
              <div className="ml-4">
                {user ? (
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      className="bg-transparent border-indigo text-indigo hover:bg-indigo hover:text-white"
                      onClick={() => navigate(isAdmin ? '/admin' : '/profile')}
                    >
                      {isAdmin ? 'Admin Dashboard' : 'My Profile'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      className="bg-transparent border-indigo text-indigo hover:bg-indigo hover:text-white"
                      onClick={() => navigate('/login')}
                    >
                      Sign In
                    </Button>
                    <Button
                      className="bg-indigo hover:bg-indigo-dark text-white"
                      onClick={() => navigate('/register')}
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              onClick={toggleMenu}
              className="text-white focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {isMobile && isMenuOpen && (
          <div className="py-4 border-t border-navy-light">
            <nav className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/venues" className="text-gray-300 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>Venues</Link>
              <Link to="/sports" className="text-gray-300 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>Sports</Link>
              {user && !isAdmin && (
                <>
                  <Link to="/bookings" className="text-gray-300 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>My Bookings</Link>
                  <Link to="/challenge" className="text-gray-300 hover:text-white transition-colors" onClick={() => setIsMenuOpen(false)}>Challenges</Link>
                </>
              )}
              <div className="flex flex-col space-y-2 pt-2">
                {user ? (
                  <Button
                    variant="outline"
                    className="bg-transparent border-indigo text-indigo hover:bg-indigo hover:text-white"
                    onClick={() => {
                      navigate(isAdmin ? '/admin' : '/profile');
                      setIsMenuOpen(false);
                    }}
                  >
                    {isAdmin ? 'Admin Dashboard' : 'My Profile'}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="bg-transparent border-indigo text-indigo hover:bg-indigo hover:text-white w-full"
                      onClick={() => {
                        navigate('/login');
                        setIsMenuOpen(false);
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      className="bg-indigo hover:bg-indigo-dark text-white w-full"
                      onClick={() => {
                        navigate('/register');
                        setIsMenuOpen(false);
                      }}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default CustomHeader;
