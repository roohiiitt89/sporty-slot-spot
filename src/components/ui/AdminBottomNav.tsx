
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Calendar, Home, Settings, MoreHorizontal, Users, Map, Star, MessageCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

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
    route: '/admin/analytics-mobile',
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
    route: '/admin/bookings-mobile',
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
    route: '/admin/venues-mobile',
    subparts: [
      { label: 'Venues', route: '/admin/venues-mobile' },
      { label: 'Sports', route: '/admin/sports-mobile' },
    ],
  },
  {
    key: 'more',
    label: 'More',
    icon: <MoreHorizontal className="w-[22px] h-[22px]" />,
    route: '/admin/reviews-mobile',
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
  const isMobile = useIsMobile();
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Only show on mobile and for admin/super_admin
  if (!user || (userRole !== 'admin' && userRole !== 'super_admin') || !isMobile) {
    return null;
  }

  // Find the active section based on current route
  const getCurrentSection = () => {
    const currentPath = location.pathname;
    
    // Check if we're on a specific section or subsection
    for (const section of SECTIONS) {
      if (currentPath === section.route) {
        return section.key;
      }
      
      // Check if current path matches any subpart
      const matchingSubpart = section.subparts.find(sub => sub.route === currentPath);
      if (matchingSubpart) {
        return section.key;
      }
    }
    
    // Default to home if no match found
    return 'home';
  };

  const handleMainClick = (section: typeof SECTIONS[0]) => {
    if (section.subparts.length === 0) {
      navigate(section.route);
      setOpenSection(null);
    } else {
      // If already on the section's main route and click again, toggle dropdown
      if (location.pathname === section.route) {
        setOpenSection(openSection === section.key ? null : section.key);
      } else {
        // If clicking from another section, navigate to the section's main route
        navigate(section.route);
        // Open the dropdown after navigation
        setOpenSection(section.key);
      }
    }
  };

  const handleSubpartClick = (route: string) => {
    navigate(route);
    setOpenSection(null);
  };

  const activeSection = getCurrentSection();
  
  return (
    <nav className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 w-[98vw] max-w-lg rounded-lg bg-navy-900/95 backdrop-blur-md border border-navy-800 flex justify-between items-end px-0.5 py-0.5 shadow-xl md:hidden transition-all duration-300 h-[54px]">
      {SECTIONS.map(section => (
        <div key={section.key} className="relative flex-1 flex flex-col items-center min-w-0">
          <button
            className={`flex flex-col items-center justify-center py-0.5 w-full transition-all duration-200 rounded-md mx-0.5 group
              ${activeSection === section.key 
                ? 'text-indigo-400 scale-105 bg-indigo-500/10 shadow' 
                : 'text-white hover:bg-navy-700 hover:scale-105'}`}
            style={{minHeight: 44}}
            onClick={() => handleMainClick(section)}
          >
            <span 
              className={`flex items-center justify-center align-middle transition-all duration-200 
                ${activeSection === section.key 
                  ? 'text-indigo-400 scale-110' 
                  : 'group-hover:scale-110 group-hover:text-emerald-400'}`} 
              style={{ minHeight: 22, minWidth: 22 }}
            >
              {section.icon}
            </span>
            <span className="text-[11px] mt-0.5 font-medium drop-shadow truncate max-w-[60px]">{section.label}</span>
          </button>
          
          {/* Subparts dropdown */}
          {openSection === section.key && section.subparts.length > 0 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-navy-900/95 backdrop-blur-md border border-navy-700 rounded-lg shadow-lg py-1.5 px-1 min-w-[160px] z-50 animate-fade-in flex flex-col gap-0.5">
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-navy-700"></div>
              {section.subparts.map(sub => (
                <button
                  key={sub.route}
                  className={`flex items-center w-full text-left px-3 py-2 rounded-md text-[13px] font-medium transition-colors
                    ${location.pathname === sub.route 
                      ? 'bg-indigo-500/20 text-indigo-300' 
                      : 'text-white hover:bg-navy-700'}`}
                  onClick={() => handleSubpartClick(sub.route)}
                >
                  <span className="truncate">{sub.label}</span>
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
