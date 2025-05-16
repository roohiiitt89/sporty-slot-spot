import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, UsersIcon, ClockIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, parseISO, isWithinInterval, addDays } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';

interface BookingData {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
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

const AnalyticsDashboard: React.FC = () => {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [adminVenues, setAdminVenues] = useState<Array<{ venue_id: string }>>([]);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'
  const [selectedVenueId, setSelectedVenueId] = useState<string>('all');
  const [venues, setVenues] = useState<Array<{ id: string, name: string }>>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get venues user has access to if they are a regular admin
        if (userRole === 'admin') {
          const { data: venueData, error: venueError } = await supabase
            .rpc('get_admin_venues');
          
          if (venueError) throw venueError;
          setAdminVenues(venueData || []);
        }

        // Fetch all venues for the dropdown
        const { data: venuesData, error: venuesError } = await supabase
          .from('venues')
          .select('id, name')
          .eq('is_active', true);
        
        if (venuesError) throw venuesError;
        setVenues(venuesData || []);

        // Fetch bookings with their related data
        let query = supabase
          .from('bookings')
          .select(`
            id, 
            booking_date, 
            start_time, 
            end_time, 
            total_price, 
            status,
            court:court_id (
              name, 
              venue_id, 
              sport_id,
              sports:sport_id (name),
              venues:venue_id (name)
            )
          `);

        // If regular admin, filter by their venues
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

  // Set default selectedVenueId for admins to their first assigned venue
  useEffect(() => {
    if (userRole === 'admin' && adminVenues.length > 0) {
      setSelectedVenueId(adminVenues[0].venue_id);
    }
  }, [userRole, adminVenues]);

  // Filter bookings based on selected time range and venue
  const filteredBookings = bookings.filter(booking => {
    const bookingDate = parseISO(booking.booking_date);
    let rangeStart, rangeEnd;
    
    // Set date range based on selected time option
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

    // Filter by date
    const isInDateRange = isWithinInterval(bookingDate, { start: rangeStart, end: rangeEnd });
    
    // Filter by venue if a specific one is selected
    const isMatchingVenue = selectedVenueId === 'all' || 
      booking.court?.venue_id === selectedVenueId;
    
    return isInDateRange && isMatchingVenue;
  });

  // Calculate total revenue
  const totalRevenue = filteredBookings.reduce((sum, booking) => sum + booking.total_price, 0);
  
  // Generate data for booking trends chart (daily bookings count)
  const generateBookingTrends = () => {
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
    
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayBookings = filteredBookings.filter(booking => booking.booking_date === dayStr);
      
      return {
        date: format(day, 'MMM dd'),
        count: dayBookings.length,
        revenue: dayBookings.reduce((sum, booking) => sum + booking.total_price, 0)
      };
    });
  };
  
  // Generate data for sport popularity chart
  const generateSportPopularityData = () => {
    const sportCounts: Record<string, number> = {};
    
    filteredBookings.forEach(booking => {
      const sportName = booking.court?.sports?.name || 'Unknown';
      sportCounts[sportName] = (sportCounts[sportName] || 0) + 1;
    });
    
    return Object.entries(sportCounts).map(([name, value]) => ({ name, value }));
  };
  
  // Generate data for time slot popularity
  const generateTimeSlotPopularity = () => {
    const hourCounts: Record<string, number> = {};
    
    filteredBookings.forEach(booking => {
      const startHour = booking.start_time.split(':')[0];
      const hourKey = `${startHour}:00`;
      hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1;
    });
    
    // Convert to array and sort by hour
    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  };

  const trendData = generateBookingTrends();
  const sportPopularityData = generateSportPopularityData();
  const timeSlotData = generateTimeSlotPopularity();

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
    
    // Don't allow setting dates in the future
    if (newDate <= today) {
      setCurrentDate(newDate);
    }
  };

  // Format time range for display
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your venue performance and booking trends</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <select 
            value={selectedVenueId}
            onChange={(e) => setSelectedVenueId(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            {/* Only show 'All Venues' for super_admin */}
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
          
          <div className="flex items-center border rounded-md overflow-hidden">
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
          
          <div className="flex rounded-md overflow-hidden border">
            <Button 
              variant={timeRange === 'week' ? 'default' : 'ghost'}
              className="rounded-none"
              onClick={() => setTimeRange('week')}
            >
              Week
            </Button>
            <Button 
              variant={timeRange === 'month' ? 'default' : 'ghost'}
              className="rounded-none border-l border-r"
              onClick={() => setTimeRange('month')}
            >
              Month
            </Button>
            <Button 
              variant={timeRange === 'year' ? 'default' : 'ghost'}
              className="rounded-none"
              onClick={() => setTimeRange('year')}
            >
              Year
            </Button>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
            <div className="flex items-baseline space-x-2">
              <h3 className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</h3>
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
                  ? (totalRevenue / filteredBookings.length).toLocaleString(undefined, { 
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
      
      {/* Analytics Charts */}
      <Tabs defaultValue="trends">
        <TabsList className="mb-4">
          <TabsTrigger value="trends">Booking Trends</TabsTrigger>
          <TabsTrigger value="sports">Popular Sports</TabsTrigger>
          <TabsTrigger value="time">Peak Hours</TabsTrigger>
          <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Booking & Revenue Trends</CardTitle>
              <CardDescription>
                Track daily bookings and revenue over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[200px] h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      name="Bookings" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#82ca9d" 
                      name="Revenue (₹)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Sports</CardTitle>
                <CardDescription>
                  Distribution of bookings by sport
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="min-h-[200px] h-[250px] sm:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sportPopularityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {sportPopularityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sport Popularity</CardTitle>
                <CardDescription>
                  Number of bookings by sport type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="min-h-[200px] h-[250px] sm:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sportPopularityData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" name="Bookings">
                        {sportPopularityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle>Peak Booking Hours</CardTitle>
              <CardDescription>
                Most popular hours for bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[200px] h-[250px] sm:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeSlotData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Number of Bookings" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span>Hours shown in 24-hour format</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bookings">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
