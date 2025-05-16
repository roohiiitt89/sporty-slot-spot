import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Map, User, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { to: '/', label: 'Home', icon: <Home /> },
  { to: '/venues', label: 'Venues', icon: <Map /> },
  { to: '/bookings', label: 'Bookings', icon: <Calendar /> },
  { to: '/profile', label: 'Profile', icon: <User /> },
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
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-xl rounded-2xl bg-navy-light/80 backdrop-blur-md border border-navy/40 flex justify-between items-end px-2 py-2 shadow-2xl md:hidden transition-all duration-300">
      {/* Home */}
      <Link
        key={navItems[0].to}
        to={navItems[0].to}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 rounded-xl mx-1 ${location.pathname === navItems[0].to ? 'text-indigo-light scale-110 bg-indigo/10 shadow-lg' : 'text-white hover:bg-navy/40 hover:scale-105'} `}
        onClick={() => handleNavClick(navItems[0].to)}
      >
        {navItems[0].icon}
        <span className="text-xs mt-0.5 font-semibold drop-shadow">{navItems[0].label}</span>
      </Link>
      {/* Venues */}
      <Link
        key={navItems[1].to}
        to={navItems[1].to}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 rounded-xl mx-1 ${location.pathname === navItems[1].to ? 'text-indigo-light scale-110 bg-indigo/10 shadow-lg' : 'text-white hover:bg-navy/40 hover:scale-105'} `}
        onClick={() => handleNavClick(navItems[1].to)}
      >
        {navItems[1].icon}
        <span className="text-xs mt-0.5 font-semibold drop-shadow">{navItems[1].label}</span>
      </Link>
      {/* Chat button in center, floating and standout */}
      <button
        className={`relative -top-6 flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-indigo via-fuchsia-500 to-emerald-400 shadow-2xl border-4 border-navy-light/80 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none ${chatActive ? 'ring-4 ring-indigo/40' : ''}`}
        onClick={onChatClick}
        aria-label="Open Chat"
        style={{ zIndex: 2 }}
      >
        <span className="text-white text-2xl flex items-center justify-center drop-shadow-lg">
          <MessageCircle />
        </span>
        <span className="text-xs mt-0.5 text-white font-bold drop-shadow">Chat</span>
      </button>
      {/* Bookings */}
      <Link
        key={navItems[2].to}
        to={navItems[2].to}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 rounded-xl mx-1 ${location.pathname === navItems[2].to ? 'text-indigo-light scale-110 bg-indigo/10 shadow-lg' : 'text-white hover:bg-navy/40 hover:scale-105'} `}
        onClick={() => handleNavClick(navItems[2].to)}
      >
        {navItems[2].icon}
        <span className="text-xs mt-0.5 font-semibold drop-shadow">{navItems[2].label}</span>
      </Link>
      {/* Profile */}
      <Link
        key={navItems[3].to}
        to={navItems[3].to}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 rounded-xl mx-1 ${location.pathname === navItems[3].to ? 'text-indigo-light scale-110 bg-indigo/10 shadow-lg' : 'text-white hover:bg-navy/40 hover:scale-105'} `}
        onClick={() => handleNavClick(navItems[3].to)}
      >
        {navItems[3].icon}
        <span className="text-xs mt-0.5 font-semibold drop-shadow">{navItems[3].label}</span>
      </Link>
    </nav>
  );
};

export default BottomNav; 
