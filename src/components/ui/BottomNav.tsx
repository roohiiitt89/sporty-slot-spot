import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Map, User, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { to: '/', label: 'Home', icon: <Home /> },
  { to: '/bookings', label: 'Bookings', icon: <Calendar /> },
  { to: '/venues', label: 'Venues', icon: <Map /> },
  { to: '/profile', label: 'Profile', icon: <User /> },
  { to: '/faq', label: 'Support', icon: <HelpCircle /> },
];

const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Only show on mobile and when logged in
  if (!user || typeof window === 'undefined' || window.innerWidth > 768) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-navy-dark border-t border-navy-light flex justify-around items-center h-16 shadow-lg md:hidden">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center justify-center flex-1 h-full text-xs transition-colors ${
              isActive ? 'text-indigo-light' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="mb-1">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav; 
