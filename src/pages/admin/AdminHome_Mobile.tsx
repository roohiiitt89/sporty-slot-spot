
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, Calendar, Map, Users, Star, MessageCircle, 
  HelpCircle, LogOut, ChevronRight, AlertCircle, Loader2, 
  Clock, BookCheck, BookX, DollarSign, TrendingUp, UserCheck
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

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
  recentRevenue: number;
  pendingBookings: number;
  userCount: number;
  isLoading: boolean;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'review' | 'message' | 'help';
  title: string;
  description: string;
  time: string;
  status?: string;
  url?: string;
}

const AdminHome_Mobile: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<QuickStats>({
    todayBookings: 0,
    averageRating: 0,
    occupancyRate: 0,
    recentRevenue: 0,
    pendingBookings: 0,
    userCount: 0,
    isLoading: true
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [adminVenues, setAdminVenues] = useState<Array<{ venue_id: string }>>([]);
  const [userRoleState, setUserRoleState] = useState<string | null>(null);
  
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

        // Get user role from user_roles table instead of profiles
        const { data: userRoles, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
          .single();
          
        if (roleError) {
          console.error('Error fetching user role:', roleError);
          return;
        }
          
        setUserRoleState(userRoles?.role || null);
        
        if (userRoles?.role === 'admin') {
          // If admin, get their venues
          const { data: venues } = await supabase.rpc('get_admin_venues');
          setAdminVenues(venues || []);
        } else if (userRoles?.role === 'super_admin') {
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
        const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        
        // Prepare venue filter for admin
        let venueFilter = {};
        if (adminVenues.length > 0) {
          const venueIds = adminVenues.map(v => v.venue_id);
          venueFilter = { venue_id: { in: venueIds } };
        }

        // 1. Fetch today's bookings count
        const { count: bookingsCount } = await supabase
          .from('bookings')
          .select('id', { count: 'exact' })
          .eq('booking_date', today)
          .in('status', ['confirmed', 'pending', 'completed'])
          .match(venueFilter);
          
        // 2. Fetch pending bookings count
        const { count: pendingBookingsCount } = await supabase
          .from('bookings')
          .select('id', { count: 'exact' })
          .gte('booking_date', today)
          .eq('status', 'pending')
          .match(venueFilter);
        
        // 3. Fetch average rating
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('reviews')
          .select('rating')
          .match({ ...venueFilter, is_approved: true });
          
        if (ratingsError) throw ratingsError;
        
        const averageRating = ratingsData.length > 0 
          ? ratingsData.reduce((acc, review) => acc + review.rating, 0) / ratingsData.length 
          : 0;
        
        // 4. Calculate occupancy rate (last 7 days)
        const { count: recentBookingsCount } = await supabase
          .from('bookings')
          .select('id', { count: 'exact' })
          .gte('booking_date', sevenDaysAgo)
          .lte('booking_date', today)
          .in('status', ['confirmed', 'completed'])
          .match(venueFilter);
          
        // 5. Calculate recent revenue (last 7 days)
        const { data: revenueData } = await supabase
          .from('bookings')
          .select('total_price')
          .gte('booking_date', sevenDaysAgo)
          .lte('booking_date', today)
          .in('status', ['confirmed', 'completed'])
          .in('payment_status', ['completed', null])
          .match(venueFilter);
          
        const recentRevenue = revenueData?.reduce((acc, booking) => acc + Number(booking.total_price), 0) || 0;
        
        // 6. Get user count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact' });
        
        // For occupancy calculation
        let venueCount = 1; // Default to 1 if no venues
        if (adminVenues.length > 0) {
          venueCount = adminVenues.length;
        } else {
          // For super admin, get total venue count
          const { count } = await supabase
            .from('venues')
            .select('*', { count: 'exact' });
            
          if (count !== null) {
            venueCount = count;
          }
        }
        
        // Simplified occupancy calculation (adjust as needed for your business logic)
        const targetBookings = venueCount * 10 * 7; // 10 bookings per day per venue for 7 days
        const occupancyRate = targetBookings > 0 
          ? Math.min(100, Math.round((recentBookingsCount || 0) * 100 / targetBookings)) 
          : 0;
        
        // Update state with real data
        setStats({
          todayBookings: bookingsCount || 0,
          averageRating: parseFloat(averageRating.toFixed(1)),
          occupancyRate,
          recentRevenue,
          pendingBookings: pendingBookingsCount || 0,
          userCount: userCount || 0,
          isLoading: false
        });
        
        // Fetch recent activity
        fetchRecentActivity();
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    const fetchRecentActivity = async () => {
      try {
        // Get today's date and 3 days ago
        const today = new Date();
        const threeDaysAgo = format(subDays(today, 3), 'yyyy-MM-dd');
        
        // Prepare venue filter for admin
        let venueFilter = {};
        if (adminVenues.length > 0) {
          const venueIds = adminVenues.map(v => v.venue_id);
          venueFilter = { venue_id: { in: venueIds } };
        }
        
        // 1. Fetch recent bookings
        const { data: recentBookings } = await supabase
          .from('bookings')
          .select(`
            id, 
            booking_date, 
            status, 
            created_at,
            court:courts(name, venue:venues(name)),
            guest_name,
            user_id,
            admin_booking:admin_bookings(customer_name)
          `)
          .gte('created_at', threeDaysAgo)
          .order('created_at', { ascending: false })
          .limit(5)
          .match(venueFilter);
          
        // 2. Fetch recent reviews
        const { data: recentReviews } = await supabase
          .from('reviews')
          .select(`
            id, 
            rating, 
            comment,
            created_at,
            venue:venues(name),
            user_id
          `)
          .gte('created_at', threeDaysAgo)
          .order('created_at', { ascending: false })
          .limit(3)
          .match(venueFilter);
          
        // 3. Fetch recent help requests
        const { data: recentHelp } = await supabase
          .from('help_requests')
          .select(`
            id,
            subject,
            status,
            created_at,
            user_id
          `)
          .gte('created_at', threeDaysAgo)
          .order('created_at', { ascending: false })
          .limit(2);
          
        // Process and combine all activities
        const bookingActivities: RecentActivity[] = (recentBookings || []).map(booking => ({
          id: `booking-${booking.id}`,
          type: 'booking',
          title: `New Booking ${booking.status === 'confirmed' ? '✓' : booking.status === 'pending' ? '⏱' : '✗'}`,
          description: `${booking.admin_booking?.[0]?.customer_name || booking.guest_name || 'User'} booked ${booking.court?.name} at ${booking.court?.venue?.name}`,
          time: new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: booking.status,
          url: '/admin/bookings-mobile'
        }));
        
        const reviewActivities: RecentActivity[] = (recentReviews || []).map(review => ({
          id: `review-${review.id}`,
          type: 'review',
          title: `New Review ${review.rating}★`,
          description: `Review for ${review.venue?.name}: "${review.comment?.slice(0, 30)}${review.comment?.length > 30 ? '...' : ''}"`,
          time: new Date(review.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          url: '/admin/reviews-mobile'
        }));
        
        const helpActivities: RecentActivity[] = (recentHelp || []).map(help => ({
          id: `help-${help.id}`,
          type: 'help',
          title: `Help Request ${help.status === 'resolved' ? '✓' : '⏱'}`,
          description: `Subject: ${help.subject}`,
          time: new Date(help.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: help.status,
          url: '/admin/help-mobile'
        }));
        
        // Combine all activities and sort by creation time
        const allActivities = [...bookingActivities, ...reviewActivities, ...helpActivities]
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 6); // Limit to 6 activities
          
        setRecentActivity(allActivities);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      }
    };

    fetchDashboardMetrics();
    
    // Set up realtime subscription for bookings table
    const bookingsChannel = supabase.channel('public:bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' }, 
        () => fetchDashboardMetrics()
      )
      .subscribe();

    // Set up realtime subscription for reviews
    const reviewsChannel = supabase.channel('public:reviews')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reviews' }, 
        () => fetchDashboardMetrics()
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
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm uppercase text-indigo-300 font-semibold tracking-wider">Dashboard Summary</h3>
            <Link to="/admin/analytics-mobile" className="text-xs text-indigo-400 flex items-center">
              Full Analytics <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
          
          {stats.isLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
          ) : (
            <>
              {/* Main stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
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
              
              {/* Secondary stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-700/20 rounded-lg p-2 border border-purple-500/30">
                  <div className="text-2xl font-bold text-purple-400">₹{stats.recentRevenue}</div>
                  <div className="text-xs text-gray-300">7-Day Revenue</div>
                </div>
                <div className="bg-gradient-to-br from-rose-500/20 to-rose-700/20 rounded-lg p-2 border border-rose-500/30">
                  <div className="text-2xl font-bold text-rose-400">{stats.pendingBookings}</div>
                  <div className="text-xs text-gray-300">Pending</div>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-700/20 rounded-lg p-2 border border-cyan-500/30">
                  <div className="text-2xl font-bold text-cyan-400">{stats.userCount}</div>
                  <div className="text-xs text-gray-300">Users</div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
      
      {/* Recent Activity */}
      <section className="px-4 mb-6">
        <div className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm uppercase text-indigo-300 font-semibold tracking-wider">Recent Activity</h3>
            <Link to="/admin/bookings-mobile" className="text-xs text-indigo-400 flex items-center">
              See All <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>
          
          {recentActivity.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentActivity.map(activity => (
                <Link 
                  key={activity.id} 
                  to={activity.url || "#"} 
                  className="flex items-center p-2 rounded-lg bg-navy-700/50 hover:bg-navy-700 transition-colors border border-navy-600/40"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3
                    ${activity.type === 'booking' ? 'bg-emerald-800/70' : 
                      activity.type === 'review' ? 'bg-amber-800/70' : 
                      'bg-purple-800/70'}`}
                  >
                    {activity.type === 'booking' ? 
                      <Calendar className="w-4 h-4 text-emerald-300" /> : 
                      activity.type === 'review' ? 
                      <Star className="w-4 h-4 text-amber-300" /> : 
                      <HelpCircle className="w-4 h-4 text-purple-300" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-gray-200 mb-0.5">{activity.title}</h4>
                    <p className="text-[10px] text-gray-400 truncate">{activity.description}</p>
                  </div>
                  <div className="text-[10px] text-gray-500">{activity.time}</div>
                </Link>
              ))}
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

      {/* Admin Tools with Quick Action Buttons */}
      <section className="px-4 mt-6">
        <h3 className="text-sm uppercase text-indigo-300 font-semibold mb-3 tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-3">
          <Link to="/admin/book-for-customer-mobile" className="flex items-center p-3 bg-navy-800/80 rounded-xl border border-navy-700/50">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 mr-3">
              <BookCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">Book for Customer</div>
              <div className="text-xs text-gray-400">Create bookings on behalf of customers</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </Link>
          
          <Link to="/admin/block-time-slots-mobile" className="flex items-center p-3 bg-navy-800/80 rounded-xl border border-navy-700/50">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 mr-3">
              <BookX className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">Block Time Slots</div>
              <div className="text-xs text-gray-400">Reserve slots for maintenance or events</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </Link>
          
          <div className="flex gap-3">
            <Link to="/admin/analytics-mobile" className="flex-1 flex flex-col items-center p-3 bg-navy-800/80 rounded-xl border border-navy-700/50">
              <TrendingUp className="w-6 h-6 text-indigo-400 mb-1.5" />
              <span className="text-xs text-center text-gray-300">View Analytics</span>
            </Link>
            <Link to="/admin/bookings-mobile" className="flex-1 flex flex-col items-center p-3 bg-navy-800/80 rounded-xl border border-navy-700/50">
              <Clock className="w-6 h-6 text-emerald-400 mb-1.5" />
              <span className="text-xs text-center text-gray-300">Recent Bookings</span>
            </Link>
            <Link to="/admin/venues-mobile" className="flex-1 flex flex-col items-center p-3 bg-navy-800/80 rounded-xl border border-navy-700/50">
              <UserCheck className="w-6 h-6 text-purple-400 mb-1.5" />
              <span className="text-xs text-center text-gray-300">Manage Users</span>
            </Link>
          </div>
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
