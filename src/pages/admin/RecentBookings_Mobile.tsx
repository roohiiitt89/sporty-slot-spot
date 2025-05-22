
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      name: string;
    };
  };
}

const RecentBookings_Mobile: React.FC = () => {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [adminVenues, setAdminVenues] = useState<Array<{ venue_id: string }>>([]);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('all');
  const [venues, setVenues] = useState<Array<{ id: string, name: string }>>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethodFilterType>('online');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (userRole === 'admin') {
          const { data: venueData, error: venueError } = await supabase
            .rpc('get_admin_venues');
          if (venueError) throw venueError;
          setAdminVenues(venueData || []);
        }
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
              name, 
              venue_id, 
              sport_id,
              sports:sport_id (name),
              venues:venue_id (name)
            )
          `);
        if (userRole === 'admin' && adminVenues.length > 0) {
          const venueIds = adminVenues.map(v => v.venue_id);
          query = query.in('court.venue_id', venueIds);
        }
        const { data, error } = await query;
        if (error) throw error;
        setBookings(data || []);
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
  }, [userRole]);

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
          <h1 className="text-2xl font-bold">Recent Bookings</h1>
          <p className="text-muted-foreground">Latest bookings across your venues</p>
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
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>
            Latest bookings across your venues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Court</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings
                  .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime())
                  .slice(0, 10)
                  .map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{format(parseISO(booking.booking_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                      </TableCell>
                      <TableCell>{booking.court?.venues?.name || 'N/A'}</TableCell>
                      <TableCell>{booking.court?.name || 'N/A'}</TableCell>
                      <TableCell>{booking.court?.sports?.name || 'N/A'}</TableCell>
                      <TableCell className="text-right font-medium">₹{booking.total_price}</TableCell>
                    </TableRow>
                  ))}
                {filteredBookings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No bookings found for the selected period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecentBookings_Mobile; 
