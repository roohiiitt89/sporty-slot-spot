
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Calendar, Map, Settings, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const AdminBottomNav: React.FC<{ 
  onChatClick?: () => void; 
  chatActive?: boolean; 
  setChatActive?: (open: boolean) => void 
}> = ({ onChatClick, chatActive, setChatActive }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Only show on mobile and when logged in as admin
  if (!user || typeof window === 'undefined' || window.innerWidth > 768) return null;

  const handleNavClick = () => {
    if (setChatActive) setChatActive(false); // Close chat modal on nav
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: <LayoutGrid className="w-6 h-6" /> },
    { to: '/admin/venues', label: 'Venues', icon: <Map className="w-6 h-6" /> },
    { to: '/admin/bookings', label: 'Bookings', icon: <Calendar className="w-6 h-6" /> },
    { to: '/admin/courts', label: 'Courts', icon: <Settings className="w-6 h-6" /> },
    { to: '/admin/profile', label: 'Profile', icon: <User className="w-6 h-6" /> },
  ];

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-sm rounded-xl bg-navy-light/80 backdrop-blur-md border border-navy/40 flex justify-between items-end px-1.5 py-1.5 shadow-xl md:hidden transition-all duration-300">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 rounded-lg mx-0.5 group ${location.pathname === item.to || (item.to === '/admin' && location.pathname === '/admin/') ? 'text-indigo-light scale-110 bg-indigo/10 shadow-lg' : 'text-white hover:bg-navy/40 hover:scale-105'} `}
          onClick={handleNavClick}
        >
          <span className={`text-xl flex items-center justify-center align-middle transition-all duration-200 group-hover:scale-125 group-hover:text-emerald-400 ${location.pathname === item.to || (item.to === '/admin' && location.pathname === '/admin/') ? 'text-indigo-light scale-125' : ''}`}
            style={{ minHeight: 24, minWidth: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.icon}
          </span>
          <span className="text-xs mt-0.5 font-semibold drop-shadow">
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
};

export default AdminBottomNav;
