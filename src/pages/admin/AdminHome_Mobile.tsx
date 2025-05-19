
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, Calendar, Map, Users, Star, MessageCircle, 
  HelpCircle, LogOut, ChevronRight, AlertCircle, Loader2 
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// Admin quick links with enhanced styling and organization
const quickLinks = [
  {
    title: 'Analytics',
    path: '/admin/analytics-mobile',
    icon: <BarChart className="w-6 h-6 text-indigo-400" />,
    desc: 'View stats & trends',
    color: 'from-indigo-600 to-blue-500',
  },
  {
    title: 'Bookings',
    path: '/admin/bookings-mobile',
    icon: <Calendar className="w-6 h-6 text-emerald-400" />,
    desc: 'Manage all bookings',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    title: 'Venues',
    path: '/admin/venues-mobile',
    icon: <Map className="w-6 h-6 text-pink-400" />,
    desc: 'Edit your venues',
    color: 'from-pink-500 to-red-400',
  },
  {
    title: 'Sports',
    path: '/admin/sports-mobile',
    icon: <Users className="w-6 h-6 text-amber-400" />,
    desc: 'Manage sports',
    color: 'from-amber-500 to-orange-400',
  },
  {
    title: 'Reviews',
    path: '/admin/reviews-mobile',
    icon: <Star className="w-6 h-6 text-purple-400" />,
    desc: 'See user reviews',
    color: 'from-purple-500 to-fuchsia-400',
  },
  {
    title: 'Messages',
    path: '/admin/messages-mobile',
    icon: <MessageCircle className="w-6 h-6 text-cyan-400" />,
    desc: 'User messages',
    color: 'from-cyan-500 to-blue-300',
  },
  {
    title: 'Help Desk',
    path: '/admin/help-mobile',
    icon: <HelpCircle className="w-6 h-6 text-rose-400" />,
    desc: 'Support requests',
    color: 'from-rose-500 to-pink-300',
  },
];

interface QuickStats {
  todayBookings: number;
  averageRating: number;
  occupancyRate: number;
  isLoading: boolean;
}

const AdminHome_Mobile: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<QuickStats>({
    todayBookings: 0,
    averageRating: 0,
    occupancyRate: 0,
    isLoading: true
  });
  const [adminVenues, setAdminVenues] = useState<Array<{ venue_id: string }>>([]);
  
  // If not on mobile, redirect to desktop admin
  useEffect(() => {
    if (!isMobile) {
      navigate('/admin');
    }
  }, [isMobile, navigate]);

  // Fetch admin venues first
  useEffect(() => {
    const fetchAdminVenues = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;

        const { data: userData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();
          
        if (userData?.role === 'admin') {
          // If admin, get their venues
          const { data: venues } = await supabase.rpc('get_admin_venues');
          setAdminVenues(venues || []);
        } else if (userData?.role === 'super_admin') {
          // Super admin has access to all venues, so we leave adminVenues empty
          setAdminVenues([]);
        }
      } catch (error) {
        console.error('Error fetching admin venues:', error);
      }
    };
    fetchAdminVenues();
  }, []);

  // Fetch real dashboard metrics
  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        // Set loading state
        setStats(prev => ({ ...prev, isLoading: true }));

        // Get today's date
        const today = format(new Date(), 'yyyy-MM-dd');
        
        // Prepare venue filter for admin
        let venueFilter = {};
        if (adminVenues.length > 0) {
          const venueIds = adminVenues.map(v => v.venue_id);
          venueFilter = { venue_id: { in: venueIds } };
        }

        // 1. Fetch today's bookings count
        const { data: todayBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id', { count: 'exact' })
          .eq('booking_date', today)
          .in('status', ['confirmed', 'pending', 'completed'])
          .match(venueFilter);
          
        if (bookingsError) throw bookingsError;
        
        // 2. Fetch average rating
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('reviews')
          .select('rating')
          .match({ ...venueFilter, is_approved: true });
          
        if (ratingsError) throw ratingsError;
        
        const averageRating = ratingsData.length > 0 
          ? ratingsData.reduce((acc, review) => acc + review.rating, 0) / ratingsData.length 
          : 0;
        
        // 3. Calculate occupancy rate (simplified version)
        // Here we'll check past 7 days bookings vs available slots
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = format(sevenDaysAgo, 'yyyy-MM-dd');
        
        const { data: recentBookingsCount, error: recentBookingsError } = await supabase
          .from('bookings')
          .select('id', { count: 'exact' })
          .gte('booking_date', sevenDaysAgoStr)
          .lte('booking_date', today)
          .in('status', ['confirmed', 'completed'])
          .match(venueFilter);
          
        if (recentBookingsError) throw recentBookingsError;
        
        // For simplicity, we'll use a target of 10 bookings per day per venue as "full capacity"
        let venueCount = 1; // Default to 1 if no venues
        if (adminVenues.length > 0) {
          venueCount = adminVenues.length;
        } else {
          // For super admin, get total venue count
          const { count, error: venueCountError } = await supabase
            .from('venues')
            .select('*', { count: 'exact' });
            
          if (!venueCountError && count !== null) {
            venueCount = count;
          }
        }
        
        // Simplified occupancy calculation (adjust as needed for your business logic)
        const targetBookings = venueCount * 10 * 7; // 10 bookings per day per venue for 7 days
        const occupancyRate = targetBookings > 0 
          ? Math.min(100, Math.round((recentBookingsCount?.count || 0) * 100 / targetBookings)) 
          : 0;
        
        // Update state with real data
        setStats({
          todayBookings: todayBookings?.count || 0,
          averageRating: parseFloat(averageRating.toFixed(1)),
          occupancyRate,
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchDashboardMetrics();
    
    // Set up realtime subscription for bookings table to refresh data when changes occur
    const bookingsChannel = supabase.channel('public:bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' }, 
        () => {
          // Refresh metrics when bookings change
          fetchDashboardMetrics();
        }
      )
      .subscribe();

    // Set up realtime subscription for reviews
    const reviewsChannel = supabase.channel('public:reviews')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reviews' }, 
        () => {
          // Refresh metrics when reviews change
          fetchDashboardMetrics();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(reviewsChannel);
    };
  }, [adminVenues]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-800 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-black/90 to-navy-900/90 backdrop-blur-md shadow-md">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center">
            <div className="relative w-8 h-8 mr-2">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg transform rotate-3"></div>
              <div className="absolute inset-0 bg-navy-900 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">G2P</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Grid2Play</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-sm text-gray-300 font-medium truncate max-w-[120px]">{user?.user_metadata?.full_name || user?.email || 'Admin'}</span>
              <span className="text-xs text-indigo-400">Admin Panel</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-full bg-navy-800 hover:bg-navy-700 transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="px-4 pt-6 pb-2">
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-4 mb-4 border border-indigo-500/20">
          <h2 className="text-xl font-semibold text-white mb-1">Welcome, {user?.user_metadata?.full_name?.split(' ')[0] || 'Admin'}!</h2>
          <p className="text-gray-300 text-sm">Manage your Grid2Play venues and bookings on the go.</p>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="px-4 mb-4">
        <div className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50">
          <h3 className="text-sm uppercase text-indigo-300 font-semibold mb-2 tracking-wider">Quick Status</h3>
          {stats.isLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <Link to="/admin/bookings-mobile" className="bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 rounded-lg p-2 border border-emerald-500/30">
                <div className="text-2xl font-bold text-emerald-400">{stats.todayBookings}</div>
                <div className="text-xs text-gray-300">Today's Bookings</div>
              </Link>
              <Link to="/admin/reviews-mobile" className="bg-gradient-to-br from-amber-500/20 to-amber-700/20 rounded-lg p-2 border border-amber-500/30">
                <div className="text-2xl font-bold text-amber-400">{stats.averageRating}</div>
                <div className="text-xs text-gray-300">Avg. Rating</div>
              </Link>
              <Link to="/admin/analytics-mobile" className="bg-gradient-to-br from-blue-500/20 to-blue-700/20 rounded-lg p-2 border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-400">{stats.occupancyRate}%</div>
                <div className="text-xs text-gray-300">Occupancy</div>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section className="px-4">
        <h3 className="text-sm uppercase text-indigo-300 font-semibold mb-3 tracking-wider">Management</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(link => (
            <Link
              to={link.path}
              key={link.title}
              className={`rounded-xl shadow-lg bg-gradient-to-br ${link.color} p-3.5 flex flex-col items-start transition-transform active:scale-95 relative overflow-hidden group`}
            >
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="mb-1.5 p-2 bg-white/20 rounded-lg backdrop-blur-sm">{React.cloneElement(link.icon)}</div>
              <div className="text-white font-semibold text-base mb-0.5">{link.title}</div>
              <div className="text-xs text-white/90 leading-tight">{link.desc}</div>
              <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70" />
            </Link>
          ))}
        </div>
      </section>

      {/* Admin Tools */}
      <section className="px-4 mt-6">
        <h3 className="text-sm uppercase text-indigo-300 font-semibold mb-3 tracking-wider">Admin Tools</h3>
        <div className="grid grid-cols-1 gap-3">
          <Link to="/admin/book-for-customer-mobile" className="flex items-center p-3 bg-navy-800/80 rounded-xl border border-navy-700/50">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 mr-3">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">Book for Customer</div>
              <div className="text-xs text-gray-400">Create bookings on behalf of customers</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </Link>
          
          <Link to="/admin/block-time-slots-mobile" className="flex items-center p-3 bg-navy-800/80 rounded-xl border border-navy-700/50">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 mr-3">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">Block Time Slots</div>
              <div className="text-xs text-gray-400">Reserve slots for maintenance or events</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="px-4 py-6 mt-8 text-center">
        <p className="text-xs text-gray-500">Grid2Play Admin v1.0</p>
        <p className="text-xs text-gray-600 mt-1">&copy; {new Date().getFullYear()} All rights reserved</p>
      </footer>
    </div>
  );
};

export default AdminHome_Mobile;
