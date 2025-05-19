import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Calendar, Home, Settings, MoreHorizontal, Layers, Users, Map, Dumbbell, Star, MessageCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const SECTIONS = [
  {
    key: 'home',
    label: 'Home',
    icon: <Home className="w-[22px] h-[22px]" />,
    route: '/admin/mobile-home',
    subparts: [],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: <BarChart className="w-[22px] h-[22px]" />,
    subparts: [
      { label: 'Dashboard', route: '/admin/analytics-mobile' },
      { label: 'Booking Trends', route: '/admin/booking-trends-mobile' },
      { label: 'Popular Sports', route: '/admin/popular-sports-mobile' },
      { label: 'Peak Hours', route: '/admin/peak-hours-mobile' },
      { label: 'Recent Bookings', route: '/admin/recent-bookings-mobile' },
    ],
  },
  {
    key: 'bookings',
    label: 'Bookings',
    icon: <Calendar className="w-[22px] h-[22px]" />,
    subparts: [
      { label: 'Bookings', route: '/admin/bookings-mobile' },
      { label: 'Book for Customer', route: '/admin/book-for-customer-mobile' },
      { label: 'Block Time Slots', route: '/admin/block-time-slots-mobile' },
    ],
  },
  {
    key: 'manage',
    label: 'Manage',
    icon: <Settings className="w-[22px] h-[22px]" />,
    subparts: [
      { label: 'Venues', route: '/admin/venues-mobile' },
      { label: 'Sports', route: '/admin/sports-mobile' },
    ],
  },
  {
    key: 'more',
    label: 'More',
    icon: <MoreHorizontal className="w-[22px] h-[22px]" />,
    subparts: [
      { label: 'Reviews', route: '/admin/reviews-mobile' },
      { label: 'Messages', route: '/admin/messages-mobile' },
      { label: 'Help Desk', route: '/admin/help-mobile' },
    ],
  },
];

const AdminBottomNav: React.FC = () => {
  const { user, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Only show on mobile and for admin/super_admin
  if (!user || (userRole !== 'admin' && userRole !== 'super_admin') || typeof window === 'undefined' || window.innerWidth > 768) return null;

  const handleMainClick = (section: typeof SECTIONS[0]) => {
    if (section.subparts.length === 0) {
      navigate(section.route);
      setOpenSection(null);
    } else {
      setOpenSection(openSection === section.key ? null : section.key);
    }
  };

  const handleSubpartClick = (route: string) => {
    navigate(route);
    setOpenSection(null);
  };

  const ICON_SIZE = 22;

  return (
    <nav className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 w-[98vw] max-w-xs rounded-lg bg-navy-900/95 backdrop-blur border border-navy-800 flex justify-between items-end px-0.5 py-0.5 shadow-xl md:hidden transition-all duration-300 h-[54px]">
      {SECTIONS.map(section => (
        <div key={section.key} className="relative flex-1 flex flex-col items-center min-w-0">
          <button
            className={`flex flex-col items-center justify-center py-0.5 w-full transition-all duration-200 rounded-md mx-0.5 group ${location.pathname.startsWith(section.route) || openSection === section.key ? 'text-indigo-400 scale-105 bg-indigo/10 shadow' : 'text-white hover:bg-navy-700 hover:scale-105'}`}
            style={{minHeight: 44}}
            onClick={() => handleMainClick(section)}
          >
            <span className="flex items-center justify-center align-middle transition-all duration-200 group-hover:scale-110 group-hover:text-emerald-400" style={{ minHeight: ICON_SIZE, minWidth: ICON_SIZE }}>{section.icon}</span>
            <span className="text-[11px] mt-0.5 font-medium drop-shadow truncate max-w-[60px]">{section.label}</span>
          </button>
          {/* Subparts dropdown */}
          {openSection === section.key && section.subparts.length > 0 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-navy-900 border border-navy-700 rounded-lg shadow-lg py-1 px-2 min-w-[120px] z-50 animate-fade-in flex flex-col gap-0.5">
              {section.subparts.map(sub => (
                <button
                  key={sub.route}
                  className={`block w-full text-left px-2 py-1 rounded text-[12px] font-medium transition-colors ${location.pathname === sub.route ? 'bg-indigo/20 text-indigo-300' : 'text-white hover:bg-navy-700'}`}
                  onClick={() => handleSubpartClick(sub.route)}
                  style={{minHeight: 32}}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};

export default AdminBottomNav; 
