import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Map, User, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { to: '/', label: 'Home', icon: <Home /> },
  { to: '/bookings', label: 'Bookings', icon: <Calendar /> },
  { to: '/venues', label: 'Venues', icon: <Map /> },
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
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`flex-1 flex flex-col items-center justify-center py-1 ${location.pathname === item.to ? 'text-indigo-light' : 'text-white'} transition-colors`}
          onClick={() => handleNavClick(item.to)}
        >
          {item.icon}
          <span className="text-xs mt-0.5">{item.label}</span>
        </Link>
      ))}
      {/* Chat button */}
      <button
        className={`flex-1 flex flex-col items-center justify-center py-1 ${chatActive ? 'text-indigo-light' : 'text-white'} transition-colors`}
        onClick={onChatClick}
        aria-label="Open Chat"
      >
        <MessageCircle />
        <span className="text-xs mt-0.5">Chat</span>
      </button>
    </nav>
  );
};

export default BottomNav; 
