
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart2, Calendar, Settings, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

// Define the main navigation sections and their subsections
const navSections = [
  { 
    id: 'analytics', 
    label: 'Analytics', 
    icon: <BarChart2 className="w-6 h-6" />,
    path: '/admin/analytics',
    subSections: [
      { id: 'booking-trends', label: 'Booking Trends', path: '/admin/analytics/booking-trends' },
      { id: 'popular-sports', label: 'Popular Sports', path: '/admin/analytics/popular-sports' },
      { id: 'peak-hours', label: 'Peak Hours', path: '/admin/analytics/peak-hours' },
      { id: 'recent-bookings', label: 'Recent Bookings', path: '/admin/analytics/recent-bookings' }
    ]
  },
  { 
    id: 'bookings', 
    label: 'Bookings', 
    icon: <Calendar className="w-6 h-6" />,
    path: '/admin/bookings',
    subSections: [
      { id: 'all-bookings', label: 'All Bookings', path: '/admin/bookings' },
      { id: 'book-for-customer', label: 'Book for Customer', path: '/admin/bookings/new' },
      { id: 'block-slots', label: 'Block Time Slots', path: '/admin/bookings/block' }
    ]
  },
  { 
    id: 'manage', 
    label: 'Manage', 
    icon: <Settings className="w-6 h-6" />,
    path: '/admin/manage',
    subSections: [
      { id: 'venues', label: 'Venues', path: '/admin/venues' },
      { id: 'sports', label: 'Sports', path: '/admin/sports' }
    ]
  },
  { 
    id: 'more', 
    label: 'More', 
    icon: <MoreHorizontal className="w-6 h-6" />,
    path: '/admin/more',
    subSections: [
      { id: 'reviews', label: 'Reviews', path: '/admin/reviews' },
      { id: 'messages', label: 'Messages', path: '/admin/messages' },
      { id: 'help-desk', label: 'Help Desk', path: '/admin/help-requests' }
    ]
  }
];

const AdminBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Only show on mobile
  if (typeof window === 'undefined' || window.innerWidth > 768) return null;

  // Function to toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  // Function to determine if a navigation item is active
  const isActiveSection = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const isActiveSubSection = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col w-full md:hidden">
      {/* Expanded subsection menu */}
      {expandedSection && (
        <div className="bg-navy-dark/95 backdrop-blur-md border-t border-navy/40 py-2 px-2 shadow-xl transition-all duration-300">
          {navSections.find(section => section.id === expandedSection)?.subSections.map(subSection => (
            <Link
              key={subSection.id}
              to={subSection.path}
              className={`block px-4 py-2 text-sm rounded-lg mb-1 transition-all ${
                isActiveSubSection(subSection.path)
                  ? 'bg-indigo/30 text-white font-bold'
                  : 'text-gray-300 hover:bg-navy/40'
              }`}
              onClick={() => setExpandedSection(null)}
            >
              {subSection.label}
            </Link>
          ))}
        </div>
      )}

      {/* Main bottom navigation */}
      <nav className="bg-navy-dark/95 backdrop-blur-md border-t border-navy/40 flex justify-between items-center px-1 py-1 shadow-xl">
        {navSections.map(section => (
          <div 
            key={section.id} 
            className="flex-1"
          >
            <div 
              className={`flex flex-col items-center justify-center py-1 px-1 transition-all ${
                isActiveSection(section.path)
                  ? 'text-indigo-light'
                  : 'text-white'
              }`}
            >
              <button 
                className="flex flex-col items-center w-full"
                onClick={() => toggleSection(section.id)}
              >
                <span className="text-xl flex items-center justify-center transition-all">
                  {section.icon}
                </span>
                <span className="text-xs mt-0.5 font-semibold">
                  {section.label}
                </span>
                {expandedSection === section.id ? 
                  <ChevronUp className="w-4 h-4 mt-1" /> : 
                  <ChevronDown className="w-4 h-4 mt-1" />
                }
              </button>
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default AdminBottomNav;
