import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Check, Calendar, BookCheck, BookX, Ban, CreditCard } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SportDisplayName from '@/components/SportDisplayName';
import RealTimeAvailabilityTab from '@/components/RealTimeAvailabilityTab';

interface BookingManagementProps {
  userRole: string | null;
  adminVenues: { venue_id: string }[];
}

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  payment_reference: string | null;
  payment_status: string | null;
  user_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  created_at: string;
  court: {
    id: string;
    name: string;
    venue: {
      id: string;
      name: string;
    };
    sport: {
      id: string;
      name: string;
    };
  };
}

interface Venue {
  id: string;
  name: string;
  courts: {
    id: string;
    name: string;
  }[];
}

const BookingManagement: React.FC<BookingManagementProps> = ({ userRole, adminVenues }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  useEffect(() => {
    fetchBookings();
    fetchVenues();
  }, [filter, paymentFilter, userRole, adminVenues]);

  const fetchVenues = async () => {
    try {
      let query = supabase.from('venues').select(`
        id,
        name,
        courts:courts(id, name)
      `).eq('is_active', true);
      
      // If admin (not super admin), filter to only show their venues
      if (userRole === 'admin' && adminVenues.length > 0) {
        const venueIds = adminVenues.map(v => v.venue_id);
        query = query.in('id', venueIds);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform data to match the Venue interface
      const transformedVenues = data?.map(venue => ({
        id: venue.id,
        name: venue.name,
        courts: venue.courts || []
      })) || [];
      
      setVenues(transformedVenues);
      
      // Set the first venue as selected by default
      if (transformedVenues.length > 0 && !selectedVenue) {
        setSelectedVenue(transformedVenues[0]);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: 'Error',
        description: 'Failed to load venues',
        variant: 'destructive',
      });
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      console.log('Fetching bookings for role:', userRole);
      console.log('Admin venues:', adminVenues);
      
      let query = supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          total_price,
          status,
          payment_reference,
          payment_status,
          user_id,
          guest_name,
          guest_phone,
          created_at,
          court:courts (
            id,
            name,
            venue:venues (
              id,
              name
            ),
            sport:sports (
              id,
              name
            )
          )
        `)
        .order('booking_date', { ascending: false }) // Changed to show latest first
        .order('created_at', { ascending: false }); // Added secondary sort by creation time

      // Apply status filter if not "all"
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      // Apply payment status filter if not "all"
      if (paymentFilter !== 'all') {
        query = query.eq('payment_status', paymentFilter);
      }

      // If admin (not super admin), filter to only show their venue bookings
      if (userRole === 'admin' && adminVenues.length > 0) {
        const venueIds = adminVenues.map(v => v.venue_id);
        console.log('Filtering by venue IDs:', venueIds);
        
        const { data: courtIds, error: courtError } = await supabase
          .from('courts')
          .select('id')
          .in('venue_id', venueIds);
          
        if (courtError) {
          console.error('Error fetching court IDs:', courtError);
          throw courtError;
        }
        
        if (courtIds && courtIds.length > 0) {
          const courtIdArray = courtIds.map(c => c.id);
          console.log('Found court IDs:', courtIdArray);
          query = query.in('court_id', courtIdArray);
        } else {
          console.log('No courts found for venues');
          setBookings([]);
          setLoading(false);
          return;
        }
      }

      console.log('Executing query...');
      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Got bookings data:', data);
      
      // Ensure we only work with valid status types for our interface
      const validBookings = data?.filter(booking => 
        booking.status === 'confirmed' || 
        booking.status === 'cancelled' || 
        booking.status === 'completed'
      ) as unknown as Booking[];
      
      setBookings(validBookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast({
        title: 'Status Updated',
        description: `Booking has been marked as ${status}`,
      });
      
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Function to get color for payment status badges
  const getPaymentStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <Tabs defaultValue="bookings">
        <TabsList className="mb-6">
          <TabsTrigger value="bookings">Booking Management</TabsTrigger>
          <TabsTrigger value="availability">Real-Time Availability</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Booking Management</h2>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'all' 
                    ? 'bg-sport-green text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('confirmed')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'confirmed' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <BookCheck className="inline-block w-4 h-4 mr-1" />
                Confirmed
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'cancelled' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <BookX className="inline-block w-4 h-4 mr-1" />
                Cancelled
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'completed' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <Calendar className="inline-block w-4 h-4 mr-1" />
                Completed
              </button>
            </div>
          </div>
          
          {/* Payment filter controls */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Payment Status:</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setPaymentFilter('all')}
                className={`px-3 py-1 text-xs rounded-md ${
                  paymentFilter === 'all' 
                    ? 'bg-sport-green text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                All Payments
              </button>
              <button
                onClick={() => setPaymentFilter('completed')}
                className={`px-3 py-1 text-xs rounded-md ${
                  paymentFilter === 'completed' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <CreditCard className="inline-block w-3 h-3 mr-1" />
                Completed
              </button>
              <button
                onClick={() => setPaymentFilter('pending')}
                className={`px-3 py-1 text-xs rounded-md ${
                  paymentFilter === 'pending' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setPaymentFilter('failed')}
                className={`px-3 py-1 text-xs rounded-md ${
                  paymentFilter === 'failed' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                Failed
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sport-green"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No bookings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Venue / Court / Sport</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map(booking => (
                    <TableRow key={booking.id}>
                      <TableCell>{formatDate(booking.booking_date)}</TableCell>
                      <TableCell>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.court.venue.name}</p>
                          <p className="text-sm text-gray-500">
                            {booking.court.name} / {' '}
                            <SportDisplayName 
                              venueId={booking.court.venue.id}
                              sportId={booking.court.sport.id}
                              defaultName={booking.court.sport.name}
                            />
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.guest_name ? (
                          <div>
                            <p className="font-medium">{booking.guest_name} (Guest)</p>
                            <p className="text-xs text-gray-500">{booking.guest_phone || 'No phone'}</p>
                          </div>
                        ) : (
                          <p className="text-gray-500">User ID: {booking.user_id || 'No user information'}</p>
                        )}
                      </TableCell>
                      <TableCell>₹{booking.total_price.toFixed(2)}</TableCell>
                      <TableCell>
                        {booking.payment_reference ? (
                          <div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.payment_status)}`}>
                              {booking.payment_status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1 truncate max-w-[100px]" title={booking.payment_reference}>
                              Ref: {booking.payment_reference}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">No payment info</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {booking.status !== 'confirmed' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Mark as Confirmed"
                            >
                              <Check size={18} />
                            </button>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Cancel Booking"
                            >
                              <Ban size={18} />
                            </button>
                          )}
                          {(booking.status === 'confirmed' || booking.status === 'cancelled') && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'completed')}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Mark as Completed"
                            >
                              <Calendar size={18} />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="availability">
          {venues.length > 0 ? (
            <div>
              <div className="mb-6">
                <label htmlFor="venue-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Venue
                </label>
                <select
                  id="venue-select"
                  value={selectedVenue?.id || ''}
                  onChange={(e) => {
                    const venueId = e.target.value;
                    const venue = venues.find(v => v.id === venueId);
                    if (venue) {
                      setSelectedVenue(venue);
                    }
                  }}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo focus:border-indigo"
                >
                  {venues.map(venue => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedVenue && (
                <RealTimeAvailabilityTab 
                  userRole={userRole} 
                  adminVenues={adminVenues}
                  venueId={selectedVenue.id}
                  venueName={selectedVenue.name}
                  courts={selectedVenue.courts}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No venues available to manage</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookingManagement;
