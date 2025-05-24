import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, Calendar, Map, Users, Star, MessageCircle, 
  HelpCircle, LogOut, ChevronRight, AlertCircle, Loader2, 
  Clock, Banknote, BarChart2, Award, CheckCircle, Download
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, subDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import * as XLSX from 'xlsx';

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
  pendingBookings: number;
  monthlyRevenue: number;
  upcomingBookings: number;
  recentReviews: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  details: string;
}

interface VenueWithBookingStats {
  id: string;
  name: string;
  platform_fee_percent: number;
  bookings_count: number;
  total_revenue: number;
  net_revenue: number;
}

interface CourtStats {
  court_name: string;
  bookings_percentage: number;
}

// WeatherWidget for AdminHome_Mobile
const WeatherWidget: React.FC<{ venueId: string }> = ({ venueId }) => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const sessionResult = await supabase.auth.getSession();
        const jwt = sessionResult.data.session?.access_token;
        if (!jwt) throw new Error('Not authenticated');
        // Fetch both hourly and daily data for 3-day summary and hourly rain
        const weatherUrl = 'https://lrtirloetmulgmdxnusl.supabase.co/functions/v1/weather-proxy';
        const res = await fetch(weatherUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
          },
          body: JSON.stringify({ venue_id: venueId, daily: true }),
        });
        const weatherData = await res.json();
        if (!res.ok) throw new Error(weatherData.error || 'Failed to fetch weather');
        setWeather(weatherData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (venueId) fetchWeather();
  }, [venueId]);

  if (!venueId) return null;

  // Helper: Weather Impact Score
  function getImpactScore() {
    if (!weather) return null;
    // Simple logic: if any severe, Poor; if rain > 2mm in next 12h, Moderate; else Good
    if (weather.severe && weather.severe.length > 0) return { label: 'Poor', color: 'bg-red-500' };
    if (weather.forecast && weather.forecast.some((f: any) => f.precipitation > 2)) return { label: 'Moderate', color: 'bg-yellow-500' };
    return { label: 'Good', color: 'bg-green-500' };
  }
  const impact = getImpactScore();

  return (
    <Card className="mb-4 cursor-pointer text-xs rounded-xl border border-navy-700/50 bg-navy-800/70" onClick={() => setExpanded(e => !e)}>
      <CardHeader className="pb-1 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Weather Forecast</CardTitle>
        {impact && (
          <span className={`text-xs px-2 py-1 rounded ${impact.color} text-white`}>{impact.label} for outdoor play</span>
        )}
      </CardHeader>
      <CardContent className="pt-0 px-2">
        {loading && <div className="text-xs text-gray-500">Loading weather...</div>}
        {error && <div className="text-xs text-red-500">{error}</div>}
        {weather && (
          <>
            {/* Current Weather */}
            <div className="flex items-center gap-2 mb-1 ml-4">
              <span className="text-xl font-bold">{Math.round(weather.current.temp)}°C</span>
              <span className="text-xs text-gray-500">Now</span>
              {weather.severe && weather.severe.length > 0 && (
                <Badge variant="destructive">Severe Weather</Badge>
              )}
            </div>
            {/* 3-Day Compact Forecast */}
            {weather.daily && (
              <div className="flex gap-1 mb-1">
                {weather.daily.slice(0, 3).map((d: any, i: number) => (
                  <div key={d.date} className="flex flex-col items-center min-w-[48px]">
                    <span className="text-[10px] text-gray-500 font-medium">{d.day}</span>
                    <span className="text-base font-bold">{Math.round(d.temp_max)}°</span>
                    <span className="text-[10px] text-gray-400">{Math.round(d.temp_min)}°</span>
                    <span className="text-xs">{d.icon}</span>
                    {d.rain > 0 && <span className="text-blue-500 text-[10px]">{d.rain}mm</span>}
                  </div>
                ))}
              </div>
            )}
            {/* Hourly Rain/Storm Timeline (next 12h) */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {weather.forecast.slice(0, 12).map((f: any, i: number) => (
                <div key={f.time} className="flex flex-col items-center min-w-[32px]">
                  <span className="text-[10px] text-gray-500">{new Date(f.time).getHours()}:00</span>
                  <span className="font-medium text-xs">{Math.round(f.temp)}°</span>
                  {f.precipitation > 0 && (
                    <span className="text-blue-500 text-[10px]">{f.precipitation}mm</span>
                  )}
                  {[95,96,99].includes(f.weathercode) && (
                    <span className="text-red-500 text-[10px]">Storm</span>
                  )}
                </div>
              ))}
            </div>
            {/* Expandable details */}
            {expanded && weather.daily && (
              <div className="mt-2">
                <div className="text-xs text-gray-400 mb-1">3-Day Details</div>
                <div className="flex gap-2">
                  {weather.daily.slice(0, 3).map((d: any, i: number) => (
                    <div key={d.date} className="flex flex-col items-center min-w-[80px] p-2 rounded bg-green-600/80 text-white">
                      <span className="text-xs font-medium">{d.day}</span>
                      <span className="text-lg font-bold">{Math.round(d.temp_max)}° / {Math.round(d.temp_min)}°</span>
                      <span className="text-xs">{d.icon}</span>
                      <span className="text-xs text-blue-200">Rain: {d.rain}mm</span>
                      <span className="text-xs text-white/80">{d.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const AdminHome_Mobile: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<QuickStats>({
    todayBookings: 0,
    averageRating: 0,
    occupancyRate: 0,
    isLoading: true,
    pendingBookings: 0,
    monthlyRevenue: 0,
    upcomingBookings: 0,
    recentReviews: 0
  });
  const [adminVenues, setAdminVenues] = useState<Array<{ venue_id: string }>>([]);
  const [userRoleState, setUserRoleState] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState<boolean>(true);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [todaysNetRevenue, setTodaysNetRevenue] = useState(0);
  const [customNetRevenue, setCustomNetRevenue] = useState(0);
  const [popularCourts, setPopularCourts] = useState<CourtStats[]>([]);
  const [courtDataLoading, setCourtDataLoading] = useState(true);
  const [venuesWithStats, setVenuesWithStats] = useState<VenueWithBookingStats[]>([]);
  const [venueSubscribers, setVenueSubscribers] = useState<Record<string, number>>({});
  const [broadcastModal, setBroadcastModal] = useState<{ open: boolean, venueId: string | null }>({ open: false, venueId: null });
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const approvedBroadcastIdsRef = useRef<Set<string>>(new Set());
  const [broadcastHistory, setBroadcastHistory] = useState<Record<string, any[]>>({});
  const [downloadingReport, setDownloadingReport] = useState(false);

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

  // Fetch recent activity
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setActivityLoading(true);
        
        // Prepare venue filter for admin
        const venueIds = adminVenues.map(v => v.venue_id);
        let venueFilter = {};
        if (adminVenues.length > 0) {
          venueFilter = { venue_id: { in: venueIds } };
        }
        
        // Get today's date
        const today = format(new Date(), 'yyyy-MM-dd');
        const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        
        // Get recent bookings
        const { data: recentBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, created_at, guest_name, court_id, status, booking_date')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (bookingsError) throw bookingsError;
        
        // Get recent reviews
        const { data: recentReviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('id, created_at, rating, comment, venue_id')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (reviewsError) throw reviewsError;
        
        // Combine and format activity
        const activities: RecentActivity[] = [
          ...(recentBookings?.map(booking => ({
            id: `booking-${booking.id}`,
            type: 'booking',
            title: `New Booking ${booking.status === 'confirmed' ? '(Confirmed)' : '(Pending)'}`,
            timestamp: booking.created_at,
            details: `${booking.guest_name || 'Customer'} booked for ${format(parseISO(booking.booking_date), 'dd MMM yyyy')}`
          })) || []),
          
          ...(recentReviews?.map(review => ({
            id: `review-${review.id}`,
            type: 'review',
            title: `New ${review.rating}★ Review`,
            timestamp: review.created_at,
            details: review.comment?.substring(0, 50) + (review.comment?.length > 50 ? '...' : '') || 'No comment'
          })) || [])
        ];
        
        // Sort by timestamp, recent first
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setRecentActivity(activities.slice(0, 7)); // Limit to 7 most recent
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setActivityLoading(false);
      }
    };
    
    fetchRecentActivity();
  }, [adminVenues]);

  // Fetch venues with their stats and platform fees
  useEffect(() => {
    const fetchVenuesWithStats = async () => {
      try {
        // Get venue IDs for admin
        const venueIds = adminVenues.map(v => v.venue_id);
        
        // Get venues with their platform fee percentages
        let venueQuery = supabase
          .from('venues')
          .select('id, name, platform_fee_percent');
          
        // Filter by venue IDs if user is admin
        if (userRoleState === 'admin' && venueIds.length > 0) {
          venueQuery = venueQuery.in('id', venueIds);
        }
          
        const { data: venues, error: venueError } = await venueQuery;
        
        if (venueError) throw venueError;
        
        if (!venues || venues.length === 0) {
          console.log('No venues found');
          return;
        }
        
        // For each venue, get bookings
        const venuesWithData = await Promise.all(venues.map(async (venue) => {
          // Get courts for this venue
          const { data: courts, error: courtsError } = await supabase
            .from('courts')
            .select('id')
            .eq('venue_id', venue.id)
            .eq('is_active', true);
            
          if (courtsError || !courts || courts.length === 0) {
            return {
              id: venue.id,
              name: venue.name,
              platform_fee_percent: venue.platform_fee_percent || 7,
              bookings_count: 0,
              total_revenue: 0,
              net_revenue: 0
            };
          }
          
          // Get bookings for these courts from the past 30 days
          const courtIds = courts.map(c => c.id);
          const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
          const today = format(new Date(), 'yyyy-MM-dd');
          
          const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('total_price, booking_date')
            .in('court_id', courtIds)
            .in('status', ['confirmed', 'completed'])
            .gte('booking_date', thirtyDaysAgo)
            .lte('booking_date', today);
            
          if (bookingsError || !bookings) {
            return {
              id: venue.id,
              name: venue.name,
              platform_fee_percent: venue.platform_fee_percent || 7,
              bookings_count: 0,
              total_revenue: 0,
              net_revenue: 0
            };
          }
          
          // Calculate total and net revenue
          const total_revenue = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
          const platformFee = venue.platform_fee_percent || 7;
          const net_revenue = total_revenue * ((100 - platformFee) / 100);
          
          return {
            id: venue.id,
            name: venue.name,
            platform_fee_percent: platformFee,
            bookings_count: bookings.length,
            total_revenue,
            net_revenue
          };
        }));
        
        setVenuesWithStats(venuesWithData);
      } catch (error) {
        console.error('Error fetching venues with stats:', error);
      }
    };
    
    if (adminVenues.length > 0 || userRoleState === 'super_admin') {
      fetchVenuesWithStats();
    }
  }, [adminVenues, userRoleState]);

  // Fetch real dashboard metrics
  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        // Set loading state
        setStats(prev => ({ ...prev, isLoading: true }));
        setCourtDataLoading(true);

        // Get today's date
        const today = format(new Date(), 'yyyy-MM-dd');
        const firstDayOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        
        // Prepare venue filter for admin
        const venueIds = adminVenues.map(v => v.venue_id);
        let venueFilter = {};
        if (adminVenues.length > 0) {
          venueFilter = { venue_id: { in: venueIds } };
        }

        // 1. Fetch today's bookings with court join
        const { data: todayBookingsData } = await supabase
          .from('bookings')
          .select('id, court:court_id (venue_id), status, booking_date')
          .eq('booking_date', today)
          .in('status', ['confirmed', 'pending', 'completed']);
        const todayBookings = (todayBookingsData || []).filter(b => b.court && (!venueIds.length || venueIds.includes(b.court.venue_id)));
        const bookingsCount = todayBookings.length;

        // 2. Fetch pending bookings with court join
        const { data: pendingBookingsData } = await supabase
          .from('bookings')
          .select('id, court:court_id (venue_id), status, booking_date')
          .gte('booking_date', today)
          .eq('status', 'pending');
        const pendingBookings = (pendingBookingsData || []).filter(b => b.court && (!venueIds.length || venueIds.includes(b.court.venue_id)));
        const pendingBookingsCount = pendingBookings.length;

        // 3. Fetch upcoming bookings (next 7 days) with court join
        const { data: upcomingBookingsData } = await supabase
          .from('bookings')
          .select('id, court:court_id (venue_id), status, booking_date')
          .gte('booking_date', today)
          .lte('booking_date', format(subDays(new Date(), -7), 'yyyy-MM-dd'))
          .in('status', ['confirmed', 'pending']);
        const upcomingBookings = (upcomingBookingsData || []).filter(b => b.court && (!venueIds.length || venueIds.includes(b.court.venue_id)));
        const upcomingBookingsCount = upcomingBookings.length;
        
        // 4. Fetch average rating
        const { data: ratingsData } = await supabase
          .from('reviews')
          .select('rating')
          .match({ ...venueFilter, is_approved: true });
          
        const averageRating = ratingsData && ratingsData.length > 0 
          ? ratingsData.reduce((acc, review) => acc + review.rating, 0) / ratingsData.length 
          : 0;
          
        // 5. Fetch recent reviews count (last 30 days)
        const { count: recentReviewsCount } = await supabase
          .from('reviews')
          .select('id', { count: 'exact' })
          .gte('created_at', thirtyDaysAgo)
          .match(venueFilter);

        // 6. Calculate monthly revenue - use venue stats we already collected
        // Get total revenue from all venues using the platform fee from each venue
        let totalNetRevenue = venuesWithStats.reduce((sum, venue) => sum + venue.net_revenue, 0);
        
        // Calculate today's net revenue and custom date range net revenue
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        // Get bookings with venue information for accurate fee calculation
        const { data: todaysBookingsWithVenue } = await supabase
          .from('bookings')
          .select(`
            total_price,
            court:court_id (
              venue_id
            )
          `)
          .eq('booking_date', todayStr)
          .in('status', ['confirmed', 'completed']);
        
        // Filter by admin venues if needed
        const filteredTodaysBookings = (todaysBookingsWithVenue || []).filter(b => 
          b.court && (!venueIds.length || venueIds.includes(b.court.venue_id))
        );
        
        // Calculate today's net revenue using venue-specific platform fees
        let todaysNetRevenueValue = 0;
        
        if (filteredTodaysBookings.length > 0) {
          // For each booking, find its venue and use its platform fee
          todaysNetRevenueValue = await filteredTodaysBookings.reduce(async (accPromise, booking) => {
            const acc = await accPromise;
            if (!booking.court?.venue_id) return acc;
            
            // Find the venue in our previously collected stats
            const venueInfo = venuesWithStats.find(v => v.id === booking.court.venue_id);
            const platformFee = venueInfo?.platform_fee_percent || 7; // Default to 7% if not found
            
            const netAmount = booking.total_price * ((100 - platformFee) / 100);
            return acc + netAmount;
          }, Promise.resolve(0));
        }
        
        setTodaysNetRevenue(todaysNetRevenueValue);
        
        // Calculate custom date range net revenue
        let customNetRevenueValue = 0;
        
        if (customStartDate && customEndDate) {
          const start = format(customStartDate, 'yyyy-MM-dd');
          const end = format(customEndDate, 'yyyy-MM-dd');
          
          // Get bookings for custom date range with venue info
          const { data: customRangeBookings } = await supabase
            .from('bookings')
            .select(`
              total_price,
              court:court_id (
                venue_id
              )
            `)
            .gte('booking_date', start)
            .lte('booking_date', end)
            .in('status', ['confirmed', 'completed']);
          
          // Filter by admin venues if needed
          const filteredCustomBookings = (customRangeBookings || []).filter(b => 
            b.court && (!venueIds.length || venueIds.includes(b.court.venue_id))
          );
          
          // Calculate custom range net revenue using venue-specific platform fees
          if (filteredCustomBookings.length > 0) {
            customNetRevenueValue = await filteredCustomBookings.reduce(async (accPromise, booking) => {
              const acc = await accPromise;
              if (!booking.court?.venue_id) return acc;
              
              // Find the venue in our previously collected stats
              const venueInfo = venuesWithStats.find(v => v.id === booking.court.venue_id);
              const platformFee = venueInfo?.platform_fee_percent || 7; // Default to 7% if not found
              
              const netAmount = booking.total_price * ((100 - platformFee) / 100);
              return acc + netAmount;
            }, Promise.resolve(0));
          }
        }
        
        setCustomNetRevenue(customNetRevenueValue);
        
        // 7. Fetch popular courts
        const { data: courtsWithBookings } = await supabase
          .from('courts')
          .select(`
            id, 
            name,
            venue_id
          `)
          .eq('is_active', true)
          .order('name');
          
        if (courtsWithBookings) {
          // Filter courts by venue IDs if admin
          const filteredCourts = venueIds.length > 0 
            ? courtsWithBookings.filter(c => venueIds.includes(c.venue_id))
            : courtsWithBookings;
          
          // For each court, get booking count for past 30 days
          const lastThirtyDays = format(subDays(new Date(), 30), 'yyyy-MM-dd');
          
          const courtWithStats = await Promise.all(filteredCourts.map(async (court) => {
            const { count } = await supabase
              .from('bookings')
              .select('id', { count: 'exact' })
              .eq('court_id', court.id)
              .gte('booking_date', lastThirtyDays)
              .in('status', ['confirmed', 'completed']);
              
            return {
              court_id: court.id,
              court_name: court.name,
              bookings_count: count || 0
            };
          }));
          
          // Sort by booking count and calculate percentage
          courtWithStats.sort((a, b) => b.bookings_count - a.bookings_count);
          
          // Take top 3
          const topCourts = courtWithStats.slice(0, 3);
          
          // Calculate booking percentage based on maximum possible bookings (assume 10 bookings per day as max capacity)
          const maxPossibleBookings = 10 * 30; // 10 bookings per day for 30 days
          
          const courtsWithPercentage = topCourts.map(court => ({
            court_name: court.court_name,
            bookings_percentage: Math.min(100, Math.round((court.bookings_count * 100) / maxPossibleBookings))
          }));
          
          setPopularCourts(courtsWithPercentage);
          setCourtDataLoading(false);
        }
        
        // 7. Calculate occupancy rate (past 7 days) with court join
        const { data: recentBookingsData } = await supabase
          .from('bookings')
          .select('id, court:court_id (venue_id), status, booking_date')
          .gte('booking_date', format(subDays(new Date(), 7), 'yyyy-MM-dd'))
          .lte('booking_date', today)
          .in('status', ['confirmed', 'completed']);
        const recentBookings = (recentBookingsData || []).filter(b => b.court && (!venueIds.length || venueIds.includes(b.court.venue_id)));
        const recentBookingsCount = recentBookings.length;
        
        // For simplicity, we'll use a target of 10 bookings per day per venue as "full capacity"
        let venueCount = 1; // Default to 1 if no venues
        if (venueIds.length > 0) {
          venueCount = venueIds.length;
        } else if (userRoleState === 'super_admin') {
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
          todayBookings: bookingsCount,
          averageRating: parseFloat(averageRating.toFixed(1)),
          occupancyRate,
          isLoading: false,
          pendingBookings: pendingBookingsCount,
          monthlyRevenue: todaysNetRevenueValue, // Use today's revenue for now
          upcomingBookings: upcomingBookingsCount,
          recentReviews: recentReviewsCount || 0
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
  }, [adminVenues, venuesWithStats, customStartDate, customEndDate, userRoleState]);

  // Fetch subscriber counts for each admin venue
  useEffect(() => {
    const fetchSubscribers = async () => {
      if (!adminVenues.length) return;
      const counts: Record<string, number> = {};
      for (const v of adminVenues) {
        const { count } = await supabase
          .from('venue_subscriptions')
          .select('id', { count: 'exact' })
          .eq('venue_id', v.venue_id);
        counts[v.venue_id] = count || 0;
      }
      setVenueSubscribers(counts);
    };
    fetchSubscribers();
  }, [adminVenues]);

  // Fetch previous broadcasts for each venue
  useEffect(() => {
    const fetchBroadcasts = async () => {
      if (!adminVenues.length) return;
      const venueIds = adminVenues.map(v => v.venue_id);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'venue_broadcast')
        .or(venueIds.map(id => `metadata->>venue_id.eq.${id}`).join(','))
        .order('created_at', { ascending: false });
      if (!error && data) {
        // Group by venue_id
        const grouped: Record<string, any[]> = {};
        data.forEach((n: any) => {
          const venueId = n.metadata?.venue_id;
          if (!venueId) return;
          if (!grouped[venueId]) grouped[venueId] = [];
          grouped[venueId].push(n);
        });
        setBroadcastHistory(grouped);
      }
    };
    fetchBroadcasts();
  }, [adminVenues]);

  const handleSendBroadcast = async () => {
    if (!broadcastTitle || !broadcastMessage || !broadcastModal.venueId) return;
    setBroadcastLoading(true);
    // Get all subscribers for this venue
    const { data: subs, error } = await supabase
      .from('venue_subscriptions')
      .select('user_id')
      .eq('venue_id', broadcastModal.venueId);
    if (error) {
      toast.error('Failed to fetch subscribers');
      setBroadcastLoading(false);
      return;
    }
    // Insert notification for each subscriber
    const notifications = subs.map((s: any) => ({
      user_id: s.user_id,
      title: broadcastTitle,
      message: broadcastMessage,
      type: 'venue_broadcast',
      metadata: { venue_id: broadcastModal.venueId },
      approved: false
    }));
    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);
    if (!notifError) {
      toast.success('Sent to Grid2Play for approval. You will be notified when your broadcast is approved.');
      setBroadcastModal({ open: false, venueId: null });
      setBroadcastTitle('');
      setBroadcastMessage('');
    } else {
      toast.error('Failed to send broadcast');
    }
    setBroadcastLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    // Listen for updates to notifications for this admin's venues
    const channel = supabase.channel('admin_broadcast_approval')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: 'type=eq.venue_broadcast'
      }, async (payload) => {
        const notif = payload.new;
        // Only notify if this admin sent the broadcast (by venue ownership)
        if (notif.approved === true && notif.metadata && notif.metadata.venue_id && adminVenues.some(v => v.venue_id === notif.metadata.venue_id)) {
          // Only show once per notification
          if (!approvedBroadcastIdsRef.current.has(notif.id)) {
            approvedBroadcastIdsRef.current.add(notif.id);
            toast.success('Your broadcast message has been approved and sent to your subscribers!');
          }
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, adminVenues]);

  const downloadRevenueReport = async () => {
    if (!customStartDate || !customEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setDownloadingReport(true);
    
    try {
      const start = format(customStartDate, 'yyyy-MM-dd');
      const end = format(customEndDate, 'yyyy-MM-dd');
      
      // Prepare venue filter for admin
      const venueIds = adminVenues.map(v => v.venue_id);
      
      // Get detailed bookings for the custom date range
      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          total_price,
          guest_name,
          status,
          payment_method,
          created_at,
          court:court_id (
            name,
            venue:venue_id (
              id,
              name,
              platform_fee_percent
            )
          )
        `)
        .gte('booking_date', start)
        .lte('booking_date', end)
        .in('status', ['confirmed', 'completed'])
        .order('booking_date', { ascending: false });

      const { data: bookings, error } = await bookingsQuery;
      
      if (error) throw error;
      
      // Filter by admin venues if needed
      const filteredBookings = (bookings || []).filter(b => 
        b.court?.venue && (!venueIds.length || venueIds.includes(b.court.venue.id))
      );
      
      // Prepare Excel data
      const excelData = filteredBookings.map(booking => {
        const venue = booking.court?.venue;
        const platformFee = venue?.platform_fee_percent || 7;
        const platformFeeAmount = booking.total_price * (platformFee / 100);
        const netRevenue = booking.total_price - platformFeeAmount;
        
        return {
          'Booking ID': booking.id,
          'Date': format(parseISO(booking.booking_date), 'dd-MM-yyyy'),
          'Time': `${booking.start_time} - ${booking.end_time}`,
          'Venue': venue?.name || 'N/A',
          'Court': booking.court?.name || 'N/A',
          'Customer': booking.guest_name || 'N/A',
          'Status': booking.status,
          'Payment Method': booking.payment_method || 'N/A',
          'Total Amount (₹)': booking.total_price,
          'Platform Fee %': `${platformFee}%`,
          'Platform Fee Amount (₹)': platformFeeAmount.toFixed(2),
          'Net Revenue (₹)': netRevenue.toFixed(2),
          'Booking Created': format(parseISO(booking.created_at), 'dd-MM-yyyy HH:mm')
        };
      });
      
      // Add summary row
      const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.total_price, 0);
      const totalPlatformFee = filteredBookings.reduce((sum, b) => {
        const platformFee = b.court?.venue?.platform_fee_percent || 7;
        return sum + (b.total_price * (platformFee / 100));
      }, 0);
      const totalNetRevenue = totalRevenue - totalPlatformFee;
      
      // Add summary data
      excelData.push({
        'Booking ID': '',
        'Date': '',
        'Time': '',
        'Venue': '',
        'Court': '',
        'Customer': '',
        'Status': '',
        'Payment Method': 'SUMMARY',
        'Total Amount (₹)': totalRevenue,
        'Platform Fee %': '',
        'Platform Fee Amount (₹)': totalPlatformFee.toFixed(2),
        'Net Revenue (₹)': totalNetRevenue.toFixed(2),
        'Booking Created': ''
      });
      
      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      
      // Set column widths
      const colWidths = [
        { width: 15 }, // Booking ID
        { width: 12 }, // Date
        { width: 15 }, // Time
        { width: 20 }, // Venue
        { width: 15 }, // Court
        { width: 15 }, // Customer
        { width: 12 }, // Status
        { width: 15 }, // Payment Method
        { width: 15 }, // Total Amount
        { width: 15 }, // Platform Fee %
        { width: 20 }, // Platform Fee Amount
        { width: 15 }, // Net Revenue
        { width: 18 }  // Booking Created
      ];
      ws['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Revenue Report');
      
      // Generate filename
      const filename = `Revenue_Report_${start}_to_${end}.xlsx`;
      
      // Download file
      XLSX.writeFile(wb, filename);
      
      toast.success('Revenue report downloaded successfully!');
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate revenue report');
    } finally {
      setDownloadingReport(false);
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

      {/* Enhanced Stats Overview with Tabs */}
      <section className="px-4 mb-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-navy-800/90 rounded-xl">
            <TabsTrigger value="overview" className="text-xs py-2 data-[state=active]:bg-indigo-500/20">Overview</TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs py-2 data-[state=active]:bg-indigo-500/20">Bookings</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs py-2 data-[state=active]:bg-indigo-500/20">Business</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-2">
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
          </TabsContent>
          
          <TabsContent value="bookings" className="mt-2">
            <div className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50">
              <h3 className="text-sm uppercase text-indigo-300 font-semibold mb-2 tracking-wider">Booking Stats</h3>
              {stats.isLoading ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/admin/bookings-mobile" className="bg-gradient-to-br from-orange-500/20 to-orange-700/20 rounded-lg p-3 border border-orange-500/30">
                    <Clock className="h-5 w-5 mb-1 text-orange-400" />
                    <div className="text-lg font-bold text-orange-400">{stats.pendingBookings}</div>
                    <div className="text-xs text-gray-300">Pending Bookings</div>
                  </Link>
                  <Link to="/admin/bookings-mobile" className="bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 rounded-lg p-3 border border-emerald-500/30">
                    <Calendar className="h-5 w-5 mb-1 text-emerald-400" />
                    <div className="text-lg font-bold text-emerald-400">{stats.upcomingBookings}</div>
                    <div className="text-xs text-gray-300">Upcoming Bookings</div>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="mt-2">
            <div className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50">
              <h3 className="text-sm uppercase text-indigo-300 font-semibold mb-2 tracking-wider">Business Performance</h3>
              {stats.isLoading ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gradient-to-br from-green-500/20 to-green-700/20 rounded-lg p-3 border border-green-500/30">
                    <Banknote className="h-5 w-5 mb-1 text-green-400" />
                    <div className="text-lg font-bold text-green-400">₹{stats.monthlyRevenue.toFixed(0)}</div>
                    <div className="text-xs text-gray-300">Net Revenue (after commission)</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-700/20 rounded-lg p-3 border border-purple-500/30">
                    <Star className="h-5 w-5 mb-1 text-purple-400" />
                    <div className="text-lg font-bold text-purple-400">{stats.recentReviews}</div>
                    <div className="text-xs text-gray-300">Recent Reviews</div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Recent Activity Section */}
      <section className="px-4 mb-6">
        <div className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm uppercase text-indigo-300 font-semibold tracking-wider">Recent Activity</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-300 hover:bg-indigo-500/10">View All</Button>
          </div>
          
          {activityLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <BarChart2 className="h-8 w-8 mx-auto text-gray-500 mb-2" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="bg-navy-700/50 p-3 rounded-lg border border-navy-600/50">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      {activity.type === 'booking' ? (
                        <Calendar className="h-4 w-4 text-emerald-400 mr-1.5" />
                      ) : activity.type === 'review' ? (
                        <Star className="h-4 w-4 text-amber-400 mr-1.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-blue-400 mr-1.5" />
                      )}
                      <h4 className="text-sm font-medium text-white">{activity.title}</h4>
                    </div>
                    <span className="text-xs text-gray-400">
                      {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">{activity.details}</p>
                </div>
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
      
      {/* Performance Overview */}
      <section className="px-4 mt-6">
        <h3 className="text-sm uppercase text-indigo-300 font-semibold mb-3 tracking-wider">Performance Highlights</h3>
        <div className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Award className="w-5 h-5 text-amber-400 mr-2" />
              <h4 className="text-white font-medium">Most Popular Courts</h4>
            </div>
            <Link to="/admin/analytics-mobile" className="text-xs text-indigo-400">View All</Link>
          </div>
          
          {courtDataLoading || stats.isLoading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          ) : popularCourts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>No booking data available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {popularCourts.map((court, index) => (
                <div key={index} className="flex justify-between bg-navy-700/40 p-2 rounded">
                  <span className="text-sm text-gray-300">{court.court_name}</span>
                  <span className="text-sm font-medium text-emerald-400">{court.bookings_percentage}% booked</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Today's Net Revenue */}
      <section className="px-4 mt-6">
        <h3 className="text-sm uppercase text-indigo-300 font-semibold mb-3 tracking-wider">Today's Net Revenue</h3>
        <div className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50">
          {stats.isLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-700/20 rounded-lg p-3 border border-blue-500/30 mt-2">
              <Banknote className="h-5 w-5 mb-1 text-blue-400" />
              <div className="text-lg font-bold text-blue-400">₹{todaysNetRevenue.toFixed(0)}</div>
              <div className="text-xs text-gray-300">Today's Net Revenue</div>
            </div>
          )}
        </div>
      </section>
      
      {/* Custom Date Range Net Revenue */}
      <section className="px-4 mt-6">
        <h3 className="text-sm uppercase text-indigo-300 font-semibold mb-3 tracking-wider">Custom Date Range Net Revenue</h3>
        <div className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50">
          {stats.isLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-pink-500/20 to-pink-700/20 rounded-lg p-3 border border-pink-500/30 mt-2">
              <Banknote className="h-5 w-5 mb-1 text-pink-400" />
              <div className="flex items-center gap-2 mb-1">
                <input type="date" value={customStartDate ? format(customStartDate, 'yyyy-MM-dd') : ''} onChange={e => setCustomStartDate(e.target.value ? new Date(e.target.value) : null)} className="bg-navy-900 text-white rounded px-2 py-1 text-xs" />
                <span className="text-gray-400">to</span>
                <input type="date" value={customEndDate ? format(customEndDate, 'yyyy-MM-dd') : ''} onChange={e => setCustomEndDate(e.target.value ? new Date(e.target.value) : null)} className="bg-navy-900 text-white rounded px-2 py-1 text-xs" />
              </div>
              <div className="text-lg font-bold text-pink-400">₹{customNetRevenue.toFixed(0)}</div>
              <div className="text-xs text-gray-300">Net Revenue (Custom Range)</div>
              
              {/* Download Button */}
              {customStartDate && customEndDate && (
                <div className="mt-3 pt-2 border-t border-pink-500/30">
                  <Button
                    onClick={downloadRevenueReport}
                    disabled={downloadingReport}
                    size="sm"
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs"
                  >
                    {downloadingReport ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3 mr-1" />
                        Download Revenue Report
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    Excel sheet with booking details & revenue calculations
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Weather Widget - moved below custom net revenue */}
      {adminVenues[0] && (
        <section className="px-4 mt-6">
          <WeatherWidget venueId={adminVenues[0].venue_id} />
        </section>
      )}
      
      {/* Venue Subscribers & Broadcasts Section */}
      <section className="px-4 mt-6">
        <h3 className="text-sm uppercase text-indigo-300 font-semibold mb-3 tracking-wider">Venue Subscribers & Broadcasts</h3>
        <div className="space-y-4">
          {adminVenues.map(v => (
            <div key={v.venue_id} className="bg-navy-800/70 rounded-xl p-4 border border-navy-700/50 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="w-full">
                <div className="text-white font-semibold text-lg mb-1">{venuesWithStats.find(venue => venue.id === v.venue_id)?.name || 'Venue'}</div>
                <div className="text-xs text-gray-400 mb-2">Subscribers: <span className="text-emerald-400 font-bold">{venueSubscribers[v.venue_id] || 0}</span></div>
                {/* Broadcast History Table */}
                <div className="mt-2">
                  <div className="text-xs text-gray-300 mb-1 font-semibold">Previous Broadcasts</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs text-left">
                      <thead>
                        <tr>
                          <th className="pr-2 pb-1 font-medium">Title</th>
                          <th className="pr-2 pb-1 font-medium">Message</th>
                          <th className="pr-2 pb-1 font-medium">Status</th>
                          <th className="pr-2 pb-1 font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(broadcastHistory[v.venue_id] || []).slice(0, 5).map((b) => (
                          <tr key={b.id}>
                            <td className="pr-2 py-1 text-white max-w-[120px] truncate">{b.title}</td>
                            <td className="pr-2 py-1 text-gray-300 max-w-[180px] truncate">{b.message}</td>
                            <td className="pr-2 py-1">
                              {b.approved ? (
                                <span className="flex items-center text-green-400 font-semibold"><CheckCircle className="w-4 h-4 mr-1" /> Approved</span>
                              ) : (
                                <span className="flex items-center text-yellow-400 font-semibold"><Clock className="w-4 h-4 mr-1" /> Sent</span>
                              )}
                            </td>
                            <td className="pr-2 py-1 text-gray-400">{new Date(b.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                        {(broadcastHistory[v.venue_id] || []).length === 0 && (
                          <tr><td colSpan={4} className="text-gray-500 py-2">No broadcasts yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <Button
                className="mt-2 md:mt-0"
                onClick={() => setBroadcastModal({ open: true, venueId: v.venue_id })}
              >
                Send Notification
              </Button>
            </div>
          ))}
        </div>
        <Dialog open={broadcastModal.open} onOpenChange={open => setBroadcastModal({ open, venueId: open ? broadcastModal.venueId : null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Broadcast Notification</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <input
                className="w-full px-3 py-2 rounded bg-navy-900 text-white border border-navy-700"
                placeholder="Title"
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
                maxLength={80}
              />
              <textarea
                className="w-full px-3 py-2 rounded bg-navy-900 text-white border border-navy-700"
                placeholder="Message"
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                rows={3}
                maxLength={300}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleSendBroadcast} disabled={broadcastLoading || !broadcastTitle || !broadcastMessage}>
                {broadcastLoading ? 'Sending...' : 'Send'}
              </Button>
              <Button variant="ghost" onClick={() => setBroadcastModal({ open: false, venueId: null })}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
