
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { 
  LayoutGrid, 
  Users, 
  Calendar, 
  Map, 
  Dumbbell, 
  ShieldCheckIcon, 
  Info, 
  BarChart, 
  MessageCircle, 
  Star, 
  HelpCircle,
  UserCircle,
  LogOut,
  TrendingUp,
  Award,
  Clock,
  ListChecks
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';

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
import HelpRequestsManagement from './HelpRequestsManagement';

// Define specific analytics sections
const BookingTrends = () => <div className="p-4"><h2 className="text-xl font-bold mb-4">Booking Trends</h2><p>Booking trends analysis content will appear here.</p></div>;
const PopularSports = () => <div className="p-4"><h2 className="text-xl font-bold mb-4">Popular Sports</h2><p>Popular sports analytics content will appear here.</p></div>;
const PeakHours = () => <div className="p-4"><h2 className="text-xl font-bold mb-4">Peak Hours</h2><p>Peak hours analysis content will appear here.</p></div>;
const RecentBookings = () => <div className="p-4"><h2 className="text-xl font-bold mb-4">Recent Bookings</h2><p>Recent bookings list will appear here.</p></div>;

// Define booking management sections
const BookForCustomer = () => <div className="p-4"><h2 className="text-xl font-bold mb-4">Book for Customer</h2><p>Create new booking for customers here.</p></div>;
const BlockTimeSlots = () => <div className="p-4"><h2 className="text-xl font-bold mb-4">Block Time Slots</h2><p>Block time slots on the calendar here.</p></div>;

// More section page
const MoreSection = () => {
  const navigate = useNavigate();
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">More Options</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button variant="outline" className="p-4 h-auto flex flex-col items-center" onClick={() => navigate('/admin/reviews')}>
          <Star className="h-8 w-8 mb-2" />
          <span>Reviews</span>
        </Button>
        <Button variant="outline" className="p-4 h-auto flex flex-col items-center" onClick={() => navigate('/admin/messages')}>
          <MessageCircle className="h-8 w-8 mb-2" />
          <span>Messages</span>
        </Button>
        <Button variant="outline" className="p-4 h-auto flex flex-col items-center" onClick={() => navigate('/admin/help-requests')}>
          <HelpCircle className="h-8 w-8 mb-2" />
          <span>Help Desk</span>
        </Button>
      </div>
    </div>
  );
};

// Manage section page
const ManageSection = () => {
  const navigate = useNavigate();
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Manage</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button variant="outline" className="p-4 h-auto flex flex-col items-center" onClick={() => navigate('/admin/venues')}>
          <Map className="h-8 w-8 mb-2" />
          <span>Venues</span>
        </Button>
        <Button variant="outline" className="p-4 h-auto flex flex-col items-center" onClick={() => navigate('/admin/sports')}>
          <Dumbbell className="h-8 w-8 mb-2" />
          <span>Sports</span>
        </Button>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user, userRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminVenues, setAdminVenues] = useState<Array<{ venue_id: string }>>([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const isMobile = useIsMobile();

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

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to determine if sidebar should be hidden on mobile
  const shouldHideSidebar = () => {
    return isMobile;
  };

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
    // Only show help requests for super_admin
    ...(userRole === 'super_admin' ? [
      { path: '/admin/help-requests', icon: <HelpCircle className="mr-2" />, title: 'Help Requests' }
    ] : [])
  ];

  return (
    <div className="bg-slate min-h-screen">
      {/* Admin Header */}
      <div className="bg-white shadow-md mb-6">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="font-bold text-xl text-indigo-600">Admin Dashboard</h1>
          
          {/* Profile Menu */}
          <Popover open={profileOpen} onOpenChange={setProfileOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <UserCircle size={20} />
                <span className="hidden sm:inline">{user?.email}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <div className="flex flex-col space-y-1">
                <Button 
                  variant="ghost" 
                  className="flex items-center justify-start" 
                  onClick={() => navigate('/admin/profile')}
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex items-center justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar - Hide on mobile */}
          {!shouldHideSidebar() && (
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
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={`w-full ${!shouldHideSidebar() ? 'md:w-4/5' : ''}`}>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Routes>
                <Route path="/" element={<AnalyticsDashboard />} />
                
                {/* Analytics Routes */}
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/analytics/booking-trends" element={<BookingTrends />} />
                <Route path="/analytics/popular-sports" element={<PopularSports />} />
                <Route path="/analytics/peak-hours" element={<PeakHours />} />
                <Route path="/analytics/recent-bookings" element={<RecentBookings />} />
                
                {/* Bookings Routes */}
                <Route path="/bookings" element={<BookingManagement userRole={userRole} adminVenues={adminVenues} />} />
                <Route path="/bookings/new" element={<BookForCustomer />} />
                <Route path="/bookings/block" element={<BlockTimeSlots />} />
                
                {/* Manage Routes */}
                <Route path="/venues" element={<VenueManagement userRole={userRole} adminVenues={adminVenues} />} />
                <Route path="/sports" element={<SportManagement userRole={userRole} />} />
                <Route path="/courts" element={<CourtManagement userRole={userRole} adminVenues={adminVenues} />} />
                <Route path="/manage" element={<ManageSection />} />
                
                {/* More Routes */}
                <Route path="/template-slots" element={<TemplateSlotManagement userRole={userRole} adminVenues={adminVenues} />} />
                <Route path="/sport-display-names" element={<SportDisplayNames userRole={userRole} adminVenues={adminVenues} />} />
                <Route path="/reviews" element={<ReviewManagement userRole={userRole} adminVenues={adminVenues} />} />
                <Route path="/messages" element={<MessageManagement userRole={userRole} adminVenues={adminVenues} />} />
                <Route path="/help-requests" element={<HelpRequestsManagement userRole={userRole} />} />
                <Route path="/more" element={<MoreSection />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>

      {/* Add bottom padding to ensure the mobile nav doesn't cover content */}
      {isMobile && <div className="h-32"></div>}
    </div>
  );
};

export default Dashboard;
