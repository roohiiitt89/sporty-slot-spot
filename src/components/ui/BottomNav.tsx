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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-navy-light border-t border-navy flex justify-between items-center px-2 py-1 shadow-lg md:hidden">
      {/* Home */}
      <Link
        key={navItems[0].to}
        to={navItems[0].to}
        className={`flex-1 flex flex-col items-center justify-center py-1 ${location.pathname === navItems[0].to ? 'text-indigo-light' : 'text-white'} transition-colors`}
        onClick={() => handleNavClick(navItems[0].to)}
      >
        {navItems[0].icon}
        <span className="text-xs mt-0.5">{navItems[0].label}</span>
      </Link>
      {/* Venues */}
      <Link
        key={navItems[1].to}
        to={navItems[1].to}
        className={`flex-1 flex flex-col items-center justify-center py-1 ${location.pathname === navItems[1].to ? 'text-indigo-light' : 'text-white'} transition-colors`}
        onClick={() => handleNavClick(navItems[1].to)}
      >
        {navItems[1].icon}
        <span className="text-xs mt-0.5">{navItems[1].label}</span>
      </Link>
      {/* Chat button in center */}
      <button
        className={`flex-1 flex flex-col items-center justify-center py-1 ${chatActive ? 'text-indigo-light' : 'text-white'} transition-colors`}
        onClick={onChatClick}
        aria-label="Open Chat"
      >
        <MessageCircle />
        <span className="text-xs mt-0.5">Chat</span>
      </button>
      {/* Bookings */}
      <Link
        key={navItems[2].to}
        to={navItems[2].to}
        className={`flex-1 flex flex-col items-center justify-center py-1 ${location.pathname === navItems[2].to ? 'text-indigo-light' : 'text-white'} transition-colors`}
        onClick={() => handleNavClick(navItems[2].to)}
      >
        {navItems[2].icon}
        <span className="text-xs mt-0.5">{navItems[2].label}</span>
      </Link>
      {/* Profile */}
      <Link
        key={navItems[3].to}
        to={navItems[3].to}
        className={`flex-1 flex flex-col items-center justify-center py-1 ${location.pathname === navItems[3].to ? 'text-indigo-light' : 'text-white'} transition-colors`}
        onClick={() => handleNavClick(navItems[3].to)}
      >
        {navItems[3].icon}
        <span className="text-xs mt-0.5">{navItems[3].label}</span>
      </Link>
    </nav>
  );
};

export default BottomNav; 
