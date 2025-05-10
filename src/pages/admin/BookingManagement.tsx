import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Check, Calendar, BookCheck, BookX, Ban, CreditCard, DollarSign, CreditCard as CardIcon } from 'lucide-react';
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
import { PaymentMethod, AdminBookingInfo } from '@/types/help';

interface BookingManagementProps {
  userRole: string | null;
  adminVenues: { venue_id: string }[];
}

interface UserInfo {
  full_name: string | null;
  email: string | null;
  phone: string | null;
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
  payment_method: PaymentMethod | null;
  user_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  created_at: string;
  booked_by_admin_id: string | null;
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
  user_info?: UserInfo;
  admin_booking?: AdminBookingInfo | null;
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
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'cash' | 'online' | 'card' | 'free'>('all');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  useEffect(() => {
    fetchBookings();
    fetchVenues();
  }, [filter, paymentFilter, paymentMethodFilter, userRole, adminVenues]);

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
          payment_method,
          user_id,
          guest_name,
          guest_phone,
          created_at,
          booked_by_admin_id,
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
          ),
          admin_booking:admin_bookings(
            id,
            customer_name,
            customer_phone,
            payment_method,
            amount_collected,
            notes
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

      // Apply payment method filter if not "all"
      if (paymentMethodFilter !== 'all') {
        query = query.eq('payment_method', paymentMethodFilter);
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
      );
      
      // Fetch user information for each booking with a user_id
      const bookingsWithUserInfo = await Promise.all(
        validBookings.map(async booking => {
          if (booking.user_id) {
            try {
              const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('full_name, email, phone')
                .eq('id', booking.user_id)
                .single();
                
              if (!userError && userData) {
                return {
                  ...booking,
                  user_info: {
                    full_name: userData.full_name,
                    email: userData.email,
                    phone: userData.phone
                  }
                };
              }
            } catch (err) {
              console.error('Error fetching user info:', err);
            }
          }
          
          // If it has admin_booking as array with one element, flatten it
          if (booking.admin_booking && Array.isArray(booking.admin_booking) && booking.admin_booking.length > 0) {
            return {
              ...booking,
              admin_booking: booking.admin_booking[0]
            };
          }
          
          return booking;
        })
      ) as Booking[];
      
      setBookings(bookingsWithUserInfo || []);
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

  // Function to get payment method icon
  const getPaymentMethodIcon = (method: string | null) => {
    if (!method) return null;
    
    switch (method.toLowerCase()) {
      case 'cash':
        return <DollarSign className="w-4 h-4 mr-1" />;
      case 'card':
        return <CardIcon className="w-4 h-4 mr-1" />;
      case 'online':
        return <CreditCard className="w-4 h-4 mr-1" />;
      default:
        return null;
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
          <div className="mb-3">
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

          {/* Payment method filter controls */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Payment Method:</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setPaymentMethodFilter('all')}
                className={`px-3 py-1 text-xs rounded-md ${
                  paymentMethodFilter === 'all' 
                    ? 'bg-sport-green text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                All Methods
              </button>
              <button
                onClick={() => setPaymentMethodFilter('cash')}
                className={`px-3 py-1 text-xs rounded-md ${
                  paymentMethodFilter === 'cash' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <DollarSign className="inline-block w-3 h-3 mr-1" />
                Cash
              </button>
              <button
                onClick={() => setPaymentMethodFilter('online')}
                className={`px-3 py-1 text-xs rounded-md ${
                  paymentMethodFilter === 'online' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <CreditCard className="inline-block w-3 h-3 mr-1" />
                Online
              </button>
              <button
                onClick={() => setPaymentMethodFilter('card')}
                className={`px-3 py-1 text-xs rounded-md ${
                  paymentMethodFilter === 'card' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <CardIcon className="inline-block w-3 h-3 mr-1" />
                Card
              </button>
              <button
                onClick={() => setPaymentMethodFilter('free')}
                className={`px-3 py-1 text-xs rounded-md ${
                  paymentMethodFilter === 'free' 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                Free
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
                        {booking.admin_booking ? (
                          <div>
                            <p className="font-medium">{booking.admin_booking.customer_name} <span className="text-xs text-purple-600">(Admin Booking)</span></p>
                            <p className="text-xs text-gray-500">{booking.admin_booking.customer_phone || 'No phone'}</p>
                            {booking.admin_booking.notes && (
                              <p className="text-xs text-gray-500 italic mt-1">Note: {booking.admin_booking.notes}</p>
                            )}
                          </div>
                        ) : booking.guest_name ? (
                          <div>
                            <p className="font-medium">{booking.guest_name} (Guest)</p>
                            <p className="text-xs text-gray-500">{booking.guest_phone || 'No phone'}</p>
                          </div>
                        ) : booking.user_info ? (
                          <div>
                            <p className="font-medium">{booking.user_info.full_name || 'User'}</p>
                            <p className="text-xs text-gray-500">{booking.user_info.email || 'No email'}</p>
                            <p className="text-xs text-gray-500">{booking.user_info.phone || 'No phone'}</p>
                          </div>
                        ) : (
                          <p className="text-gray-500">User ID: {booking.user_id || 'No user information'}</p>
                        )}
                      </TableCell>
                      <TableCell>₹{booking.total_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.payment_status)}`}>
                            {getPaymentMethodIcon(booking.payment_method)}
                            {booking.payment_method ? booking.payment_method.charAt(0).toUpperCase() + booking.payment_method.slice(1) : 'Unknown'}
                          </span>
                          <p className="text-xs mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded ${getPaymentStatusColor(booking.payment_status)}`}>
                              {booking.payment_status || 'Unknown'}
                            </span>
                          </p>
                          {booking.payment_reference && (
                            <p className="text-xs text-gray-500 mt-1 truncate max-w-[100px]" title={booking.payment_reference}>
                              Ref: {booking.payment_reference}
                            </p>
                          )}
                          {booking.admin_booking?.amount_collected && (
                            <p className="text-xs text-green-600 mt-1">
                              Collected: ₹{booking.admin_booking.amount_collected.toFixed(2)}
                            </p>
                          )}
                        </div>
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
