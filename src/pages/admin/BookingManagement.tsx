
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Check, Calendar, BookCheck, BookX, Ban } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SportDisplayName from '@/components/SportDisplayName';

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

const BookingManagement: React.FC<BookingManagementProps> = ({ userRole, adminVenues }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled' | 'completed'>('all');

  useEffect(() => {
    fetchBookings();
  }, [filter, userRole, adminVenues]);

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
        .order('booking_date', { ascending: false });

      // Apply status filter if not "all"
      if (filter !== 'all') {
        query = query.eq('status', filter);
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

  return (
    <div>
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
    </div>
  );
};

export default BookingManagement;
