
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, UsersIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval, addDays } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import PaymentMethodFilter, { PaymentMethodFilterType } from '@/components/admin/PaymentMethodFilter';

interface BookingData {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
  payment_method: string;
  court: {
    name: string;
    venue_id: string;
    sport_id: string;
    sports: {
      name: string;
    };
    venues: {
      name?: string;
      platform_fee_percent?: number;
    };
  };
}

const AnalyticsDashboard_Mobile: React.FC = () => {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [adminVenues, setAdminVenues] = useState<Array<{ venue_id: string }>>([]);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'
  const [selectedVenueId, setSelectedVenueId] = useState<string>('all');
  const [venues, setVenues] = useState<Array<{ id: string, name: string }>>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethodFilterType>('online');

  useEffect(() => {
    const fetchVenues = async () => {
      if (userRole === 'admin') {
        const { data: venueData, error: venueError } = await supabase
          .rpc('get_admin_venues');
        if (venueError) return;
        setAdminVenues(venueData || []);
      }
    };
    fetchVenues();
  }, [userRole]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: venuesData, error: venuesError } = await supabase
          .from('venues')
          .select('id, name')
          .eq('is_active', true);
        if (venuesError) throw venuesError;
        setVenues(venuesData || []);
        let query = supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            start_time,
            end_time,
            total_price,
            status,
            payment_method,
            court:court_id (
              venue_id,
              venues:venue_id (name, platform_fee_percent)
            )
          `);
        const venueIds = adminVenues.map(v => v.venue_id);
        const { data, error } = await query;
        if (error) throw error;
        const filtered = (data || []).filter(b => b.court && venueIds.includes(b.court.venue_id)).map(b => ({
          ...b,
          court: {
            ...b.court,
            name: '',
            sport_id: '',
            sports: { name: '' },
            venues: b.court.venues || { name: '', platform_fee_percent: 7 }
          }
        }));
        // Filter out bookings where court.venues is not a valid object (e.g., SelectQueryError)
        const validBookings = filtered.filter(b => {
          const venues = b.court?.venues;
          return venues && typeof venues === 'object' && !('error' in venues);
        });
        setBookings(validBookings as BookingData[]);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch analytics data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [adminVenues]);

  useEffect(() => {
    if (userRole === 'admin' && adminVenues.length > 0) {
      setSelectedVenueId(adminVenues[0].venue_id);
    }
  }, [userRole, adminVenues]);

  const getPaymentMethodFilteredBookings = (bookings: BookingData[]) => {
    if (paymentMethodFilter === 'all') return bookings;
    
    return bookings.filter(booking => {
      const method = booking.payment_method || 'online';
      if (paymentMethodFilter === 'online') {
        return method === 'online';
      } else {
        return method === 'cash' || method === 'card';
      }
    });
  };

  const filteredBookings = getPaymentMethodFilteredBookings(
    bookings.filter(booking => {
      const bookingDate = parseISO(booking.booking_date);
      let rangeStart, rangeEnd;
      switch(timeRange) {
        case 'week':
          rangeStart = addDays(currentDate, -7);
          rangeEnd = currentDate;
          break;
        case 'month':
          rangeStart = startOfMonth(currentDate);
          rangeEnd = endOfMonth(currentDate);
          break;
        case 'year':
          rangeStart = new Date(currentDate.getFullYear(), 0, 1);
          rangeEnd = new Date(currentDate.getFullYear(), 11, 31);
          break;
        default:
          rangeStart = startOfMonth(currentDate);
          rangeEnd = endOfMonth(currentDate);
      }
      const isInDateRange = isWithinInterval(bookingDate, { start: rangeStart, end: rangeEnd });
      const isMatchingVenue = selectedVenueId === 'all' || booking.court?.venue_id === selectedVenueId;
      return isInDateRange && isMatchingVenue;
    })
  );

  const totalGrossRevenue = filteredBookings.reduce((sum, booking) => sum + booking.total_price, 0);
  const totalNetRevenue = filteredBookings.reduce((sum, booking) => {
    let fee = 7;
    if (booking.court && booking.court.venues && typeof booking.court.venues.platform_fee_percent === 'number') {
      fee = booking.court.venues.platform_fee_percent;
    }
    return sum + (booking.total_price * ((100 - fee) / 100));
  }, 0);

  const handlePreviousPeriod = () => {
    switch(timeRange) {
      case 'week':
        setCurrentDate(prev => addDays(prev, -7));
        break;
      case 'month':
        setCurrentDate(prev => subMonths(prev, 1));
        break;
      case 'year':
        setCurrentDate(prev => new Date(prev.getFullYear() - 1, prev.getMonth(), prev.getDate()));
        break;
    }
  };

  const handleNextPeriod = () => {
    const today = new Date();
    let newDate;
    switch(timeRange) {
      case 'week':
        newDate = addDays(currentDate, 7);
        break;
      case 'month':
        newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        break;
      case 'year':
        newDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());
        break;
      default:
        newDate = new Date();
    }
    if (newDate <= today) {
      setCurrentDate(newDate);
    }
  };

  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case 'week':
        return `${format(addDays(currentDate, -7), 'MMM dd')} - ${format(currentDate, 'MMM dd, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'year':
        return format(currentDate, 'yyyy');
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-md mx-auto">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your venue performance and booking trends</p>
        </div>

        <PaymentMethodFilter 
          selectedFilter={paymentMethodFilter}
          onFilterChange={setPaymentMethodFilter}
        />

        <div className="flex flex-col gap-2">
          <select 
            value={selectedVenueId}
            onChange={(e) => setSelectedVenueId(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            {userRole === 'super_admin' && (
              <option value="all">All Venues</option>
            )}
            {venues
              .filter(venue => 
                userRole === 'super_admin' || 
                adminVenues.some(v => v.venue_id === venue.id)
              )
              .map(venue => (
                <option key={venue.id} value={venue.id}>{venue.name}</option>
              ))
            }
          </select>
          <div className="flex items-center border rounded-md overflow-hidden w-full">
            <Button 
              variant="ghost" 
              onClick={handlePreviousPeriod}
              className="border-r"
            >
              ←
            </Button>
            <div className="px-3">
              <span className="text-sm font-medium">{getTimeRangeLabel()}</span>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleNextPeriod}
              className="border-l"
              disabled={
                (timeRange === 'month' && 
                  currentDate.getMonth() === new Date().getMonth() && 
                  currentDate.getFullYear() === new Date().getFullYear()) ||
                (timeRange === 'year' && 
                  currentDate.getFullYear() === new Date().getFullYear())
              }
            >
              →
            </Button>
          </div>
          <div className="flex rounded-md overflow-hidden border w-full mt-2">
            <Button 
              variant={timeRange === 'week' ? 'default' : 'ghost'}
              className="rounded-none w-1/3"
              onClick={() => setTimeRange('week')}
            >
              Week
            </Button>
            <Button 
              variant={timeRange === 'month' ? 'default' : 'ghost'}
              className="rounded-none border-l border-r w-1/3"
              onClick={() => setTimeRange('month')}
            >
              Month
            </Button>
            <Button 
              variant={timeRange === 'year' ? 'default' : 'ghost'}
              className="rounded-none w-1/3"
              onClick={() => setTimeRange('year')}
            >
              Year
            </Button>
          </div>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-3xl font-bold">{filteredBookings.length}</h3>
              {timeRange === 'month' && (
                <p className="text-sm text-muted-foreground">bookings this month</p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1" />
              <span>For {getTimeRangeLabel()}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <div className="flex flex-col items-start space-y-1">
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-bold">₹{totalNetRevenue.toLocaleString()}</h3>
                <span className="text-xs text-green-600 font-semibold">Net</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-lg font-medium text-gray-500 line-through">₹{totalGrossRevenue.toLocaleString()}</h3>
                <span className="text-xs text-gray-400">Gross</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1" />
              <span>For {getTimeRangeLabel()}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Booking Value</CardTitle>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-3xl font-bold">
                ₹{filteredBookings.length > 0 
                  ? (totalNetRevenue / filteredBookings.length).toLocaleString(undefined, { 
                      maximumFractionDigits: 2 
                    }) 
                  : 0}
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center">
              <UsersIcon className="w-4 h-4 mr-1" />
              <span>Per booking</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard_Mobile;
