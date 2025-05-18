import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Map, User, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { to: '/', label: 'Home', icon: <Home className="w-6 h-6" /> },
  { to: '/venues', label: 'Venues', icon: <Map className="w-6 h-6" /> },
  { to: '/bookings', label: 'Bookings', icon: <Calendar className="w-6 h-6" /> },
  { to: '/profile', label: 'Profile', icon: <User className="w-6 h-6" /> },
  { to: '/more', label: 'More', icon: <MoreHorizontal className="w-6 h-6" /> },
];

const BottomNav: React.FC<{ onChatClick?: () => void; chatActive?: boolean; setChatActive?: (open: boolean) => void }> = ({ onChatClick, chatActive, setChatActive }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Only show on mobile and when logged in
  if (!user || typeof window === 'undefined' || window.innerWidth > 768) return null;

  const handleNavClick = (to: string) => {
    if (setChatActive) setChatActive(false); // Close chat modal on nav
  };

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-sm rounded-xl bg-gradient-to-t from-black/70 via-navy-light/80 to-transparent backdrop-blur-md border border-navy/40 shadow-xl flex justify-between items-end px-1.5 py-1.5 md:hidden transition-all duration-300">
      {navItems.map((item, idx) => (
        <Link
          key={item.to}
          to={item.to}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 rounded-lg mx-0.5 group
            ${location.pathname === item.to
              ? 'text-emerald-400 scale-110 bg-emerald-900/10 shadow-lg'
              : 'text-white hover:bg-emerald-400/80 hover:scale-105'}
          `}
          onClick={() => handleNavClick(item.to)}
        >
          <span className={`text-xl flex items-center justify-center align-middle transition-all duration-200
            group-hover:scale-125 group-hover:text-emerald-400
            ${location.pathname === item.to ? 'text-emerald-400 scale-125' : ''}`}
            style={{ minHeight: 24, minWidth: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.icon}
          </span>
          {item.label === 'Tournaments' ? (
            <span className="text-xs mt-0.5 font-semibold drop-shadow hidden sm:block">{item.label}</span>
          ) : (
            <span className="text-xs mt-0.5 font-semibold drop-shadow">{item.label}</span>
          )}
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav; 
