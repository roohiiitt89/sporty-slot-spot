import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { LayoutGrid, Users, Calendar, Map, Dumbbell, ShieldCheckIcon, Info, BarChart, MessageCircle, Star } from 'lucide-react';

// Admin pages
import VenueManagement from './VenueManagement';
import SportManagement from './SportManagement';
import CourtManagement from './CourtManagement';
import BookingManagement from './BookingManagement';
import TemplateSlotManagement from './TemplateSlotManagement';
import SportDisplayNames from './SportDisplayNames';
import AnalyticsDashboard from './AnalyticsDashboard';
import MessageManagement from './MessageManagement';
import ReviewManagement from './ReviewManagement';

const Dashboard: React.FC = () => {
  const { user, userRole } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [adminVenues, setAdminVenues] = useState<Array<{ venue_id: string }>>([]);

  useEffect(() => {
    const fetchUserRoleAndVenues = async () => {
      if (!user) return;
      
      try {
        // For venue admins, fetch their assigned venues
        if (userRole === 'admin') {
          const { data: venueData, error: venueError } = await supabase
            .rpc('get_admin_venues');
          
          if (venueError) throw venueError;
          
          setAdminVenues(venueData || []);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load admin data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoleAndVenues();
  }, [user, userRole]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo"></div>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', icon: <LayoutGrid className="mr-2" />, title: 'Dashboard', exact: true },
    { path: '/admin/analytics', icon: <BarChart className="mr-2" />, title: 'Analytics' },
    { path: '/admin/venues', icon: <Map className="mr-2" />, title: 'Venues' },
    { path: '/admin/sports', icon: <Dumbbell className="mr-2" />, title: 'Sports' },
    { path: '/admin/courts', icon: <ShieldCheckIcon className="mr-2" />, title: 'Courts & Groups' },
    { path: '/admin/bookings', icon: <Calendar className="mr-2" />, title: 'Bookings' },
    { path: '/admin/template-slots', icon: <Calendar className="mr-2" />, title: 'Template Slots' },
    { path: '/admin/sport-display-names', icon: <Dumbbell className="mr-2" />, title: 'Sport Display Names' },
    { path: '/admin/messages', icon: <MessageCircle className="mr-2" />, title: 'Messages' },
    { path: '/admin/reviews', icon: <Star className="mr-2" />, title: 'Reviews' },
  ];

  return (
    <div className="bg-slate min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-1/5">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="font-bold text-xl mb-4 text-navy-dark border-b pb-2">
                {userRole === 'super_admin' ? 'Super Admin Dashboard' : 'Venue Admin Dashboard'}
              </h2>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  // For regular admins, hide certain options
                  if (userRole === 'admin' && (item.path === '/admin/sports')) {
                    return null;
                  }
                  
                  const isActive = 
                    item.exact 
                      ? location.pathname === item.path
                      : location.pathname.startsWith(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block px-4 py-2 rounded-md flex items-center transition-colors ${
                        isActive
                          ? 'bg-indigo text-white'
                          : 'hover:bg-slate-light'
                      }`}
                    >
                      {item.icon}
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-4 pt-4 border-t">
                <Link 
                  to="/" 
                  className="block px-4 py-2 text-navy-dark hover:bg-slate-light rounded-md"
                >
                  Back to Site
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-4/5">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Routes>
                <Route
                  path="/"
                  element={
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold text-navy-dark">
                        {userRole === 'super_admin' 
                          ? 'Welcome to Super Admin Dashboard' 
                          : 'Welcome to Venue Admin Dashboard'}
                      </h1>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {userRole === 'super_admin' ? (
                          // Show all options for super admin
                          navItems.slice(1).map((item) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              className="bg-white border border-slate-light rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center"
                            >
                              <div className="w-12 h-12 bg-indigo-light rounded-full flex items-center justify-center text-indigo mb-4">
                                {item.icon}
                              </div>
                              <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                              <p className="text-navy text-sm">Manage {item.title.toLowerCase()}</p>
                            </Link>
                          ))
                        ) : (
                          // Only show relevant options for venue admin
                          navItems.slice(1)
                            .filter(item => item.path !== '/admin/sports')
                            .map((item) => (
                              <Link
                                key={item.path}
                                to={item.path}
                                className="bg-white border border-slate-light rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center"
                              >
                                <div className="w-12 h-12 bg-indigo-light rounded-full flex items-center justify-center text-indigo mb-4">
                                  {item.icon}
                                </div>
                                <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                                <p className="text-navy text-sm">
                                  {item.path === '/admin/venues' 
                                    ? 'View your venues' 
                                    : `Manage ${item.title.toLowerCase()}`}
                                </p>
                              </Link>
                            ))
                        )}
                      </div>
                      
                      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start">
                        <Info className="text-blue-500 mr-3 mt-1" />
                        <div>
                          <h3 className="font-semibold text-blue-800 mb-1">
                            {userRole === 'super_admin' ? 'Super Administrator Access' : 'Venue Administrator Access'}
                          </h3>
                          <p className="text-blue-700 text-sm">
                            {userRole === 'super_admin' 
                              ? 'As a super administrator, you have full access to manage all venues, sports, courts, and bookings across the platform.'
                              : `As a venue administrator, you can manage bookings and courts for your assigned venues.`}
                          </p>
                          {userRole === 'admin' && adminVenues.length > 0 && (
                            <p className="text-blue-700 text-sm mt-2">
                              You are managing {adminVenues.length} venue{adminVenues.length !== 1 ? 's' : ''}.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  }
                />
                <Route path="/venues" element={<VenueManagement userRole={userRole} adminVenues={adminVenues} />} />
                <Route path="/sports" element={<SportManagement userRole={userRole} />} />
                <Route path="/courts" element={<CourtManagement userRole={userRole} adminVenues={adminVenues} />} />
                <Route path="/bookings" element={<BookingManagement userRole={userRole} adminVenues={adminVenues} />} />
                <Route path="/template-slots" element={<TemplateSlotManagement userRole={userRole} adminVenues={adminVenues} />} />
                <Route path="/sport-display-names" element={<SportDisplayNames userRole={userRole} adminVenues={adminVenues} />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/messages" element={<MessageManagement userRole={userRole} adminVenues={adminVenues} />} />
                <Route path="/reviews" element={<ReviewManagement userRole={userRole} adminVenues={adminVenues} />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
