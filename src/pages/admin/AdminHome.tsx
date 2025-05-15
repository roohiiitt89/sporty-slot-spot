
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dumbbell, 
  Calendar, 
  Map, 
  Users, 
  MessageCircle, 
  BarChart, 
  Settings, 
  Menu,
  X,
  LayoutGrid,
  Star,
  HelpCircle,
  UserCircle,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';

// Define TypeScript interfaces for our data
interface Venue {
  id: string;
  name: string;
  location: string;
  image_url: string | null;
  bookings_count: number;
  courts_count: number;
}

interface AdminHomeStats {
  total_venues: number;
  total_bookings: number;
  recent_bookings: number;
  total_courts: number;
}

const AdminHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [stats, setStats] = useState<AdminHomeStats>({
    total_venues: 0,
    total_bookings: 0,
    recent_bookings: 0,
    total_courts: 0
  });
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch venues
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .select('id, name, location, image_url')
          .order('name');
          
        if (venueError) throw venueError;

        // Fetch court data for each venue
        const { data: courtsData, error: courtsError } = await supabase
          .from('courts')
          .select('id, venue_id');
          
        if (courtsError) throw courtsError;
        
        // Fetch booking data
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, court_id');
          
        if (bookingsError) throw bookingsError;
        
        // Fetch recent bookings (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const { data: recentBookingsData, error: recentBookingsError } = await supabase
          .from('bookings')
          .select('id')
          .gte('booking_date', oneWeekAgo.toISOString().split('T')[0]);
          
        if (recentBookingsError) throw recentBookingsError;
        
        // Process venue data with court and booking counts
        const processedVenues: Venue[] = venueData ? venueData.map(venue => {
          // Count courts for this venue
          const venueCourts = courtsData?.filter(court => court.venue_id === venue.id) || [];
          const courtIds = venueCourts.map(court => court.id);
          
          // Count bookings for this venue's courts
          const venueBookings = bookingsData?.filter(booking => 
            courtIds.includes(booking.court_id)
          ) || [];
          
          return {
            ...venue,
            courts_count: venueCourts.length,
            bookings_count: venueBookings.length
          };
        }) : [];
        
        // Set processed venues
        setVenues(processedVenues);
        
        // Set stats
        setStats({
          total_venues: venueData?.length || 0,
          total_bookings: bookingsData?.length || 0,
          recent_bookings: recentBookingsData?.length || 0,
          total_courts: courtsData?.length || 0
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, [user]);

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

  const quickLinks = [
    { 
      title: 'Manage Bookings', 
      icon: <Calendar className="w-8 h-8 text-indigo" />, 
      path: '/admin/bookings',
      description: 'View and manage all bookings'
    },
    { 
      title: 'Manage Venues', 
      icon: <Map className="w-8 h-8 text-indigo" />, 
      path: '/admin/venues',
      description: 'Configure venues and settings'
    },
    { 
      title: 'Courts & Groups', 
      icon: <Dumbbell className="w-8 h-8 text-indigo" />, 
      path: '/admin/courts',
      description: 'Manage courts and court groups'
    },
    { 
      title: 'Analytics', 
      icon: <BarChart className="w-8 h-8 text-indigo" />, 
      path: '/admin/analytics',
      description: 'View performance metrics'
    },
  ];

  const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: <LayoutGrid size={18} /> },
    { path: '/admin/venues', label: 'Venues', icon: <Map size={18} /> },
    { path: '/admin/bookings', label: 'Bookings', icon: <Calendar size={18} /> },
    { path: '/admin/courts', label: 'Courts', icon: <Dumbbell size={18} /> },
    { path: '/admin/analytics', label: 'Analytics', icon: <BarChart size={18} /> },
    { path: '/admin/reviews', label: 'Reviews', icon: <Star size={18} /> },
    { path: '/admin/messages', label: 'Messages', icon: <MessageCircle size={18} /> },
    { path: '/admin/help-requests', label: 'Help Requests', icon: <HelpCircle size={18} /> },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Navbar */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">Admin Dashboard</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {adminNavItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className="flex items-center gap-1"
                  onClick={() => navigate(item.path)}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </nav>

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

            {/* Mobile Menu Toggle */}
            <button onClick={toggleMobileMenu} className="md:hidden text-gray-500 focus:outline-none ml-4">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="container mx-auto px-4 py-2">
              <div className="grid grid-cols-2 gap-2">
                {adminNavItems.map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="flex items-center justify-start w-full"
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </Button>
                ))}
                <Button 
                  variant="ghost" 
                  className="flex items-center justify-start w-full col-span-2 border-t mt-2 pt-2" 
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4 text-red-600" />
                  <span className="text-red-600">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl p-6 md:p-8 mb-8 shadow-lg text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Welcome, Admin
          </h1>
          <p className="text-indigo-100">
            Manage your venues, courts, and bookings all in one place
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Venues</p>
                <h3 className="text-xl md:text-2xl font-bold text-navy-dark">{stats.total_venues}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Map className="w-5 h-5 text-indigo" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Courts</p>
                <h3 className="text-xl md:text-2xl font-bold text-navy-dark">{stats.total_courts}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-indigo" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <h3 className="text-xl md:text-2xl font-bold text-navy-dark">{stats.total_bookings}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-indigo" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recent Bookings</p>
                <h3 className="text-xl md:text-2xl font-bold text-navy-dark">{stats.recent_bookings}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <h2 className="text-xl font-bold mb-4 text-navy-dark">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickLinks.map((link, index) => (
            <div 
              key={index} 
              onClick={() => navigate(link.path)}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  {link.icon}
                </div>
                <h3 className="text-lg font-semibold mb-1 text-navy-dark">{link.title}</h3>
                <p className="text-sm text-gray-500">{link.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Venues List */}
        <h2 className="text-xl font-bold mb-4 text-navy-dark">Your Venues</h2>
        {venues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {venues.map(venue => (
              <div 
                key={venue.id} 
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate('/admin/venues')}
              >
                <div className="h-40 overflow-hidden">
                  <img 
                    src={venue.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'} 
                    alt={venue.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 text-navy-dark">{venue.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{venue.location}</p>
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="font-semibold">{venue.courts_count}</span> Courts
                    </div>
                    <div>
                      <span className="font-semibold">{venue.bookings_count}</span> Bookings
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <Map className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold mb-2">No venues assigned to you</h3>
            <p className="text-gray-500">Contact a super admin to assign venues to your account.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHome;
