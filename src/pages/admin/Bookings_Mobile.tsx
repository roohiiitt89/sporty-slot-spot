import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { AdminBookingInfo, Booking, BookingStatus } from '@/types/help';
import BookingsList from '@/components/admin/BookingsList';

const Bookings_Mobile: React.FC = () => {
  const { userRole } = useAuth();
  const [adminVenues, setAdminVenues] = useState<{ venue_id: string }[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | BookingStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'cash' | 'online' | 'card' | 'free'>('all');

  useEffect(() => {
    const fetchAdminVenues = async () => {
      if (userRole === 'admin') {
        const { data, error } = await supabase.rpc('get_admin_venues');
        if (!error) setAdminVenues(data || []);
      } else if (userRole === 'super_admin') {
        setAdminVenues([]); // super_admin can see all venues
      }
    };
    fetchAdminVenues();
  }, [userRole]);

  useEffect(() => {
    fetchBookings();
  }, [filter, paymentFilter, paymentMethodFilter, userRole, adminVenues]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
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
            booking_id,
            admin_id,
            customer_name,
            customer_phone,
            payment_method,
            payment_status,
            amount_collected,
            created_at,
            notes
          )
        `)
        .order('booking_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      if (paymentFilter !== 'all') {
        query = query.eq('payment_status', paymentFilter);
      }
      if (paymentMethodFilter !== 'all') {
        query = query.eq('payment_method', paymentMethodFilter);
      }
      if (userRole === 'admin' && adminVenues.length > 0) {
        const venueIds = adminVenues.map(v => v.venue_id);
        const { data: courtIds, error: courtError } = await supabase
          .from('courts')
          .select('id')
          .in('venue_id', venueIds);
        if (courtError) throw courtError;
        if (courtIds && courtIds.length > 0) {
          const courtIdArray = courtIds.map(c => c.id);
          query = query.in('court_id', courtIdArray);
        } else {
          setBookings([]);
          setLoading(false);
          return;
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      const processedBookings = await Promise.all(
        data?.map(async booking => {
          let processedBooking: Booking = {
            ...booking,
            admin_booking: null,
            court: booking.court,
            status: booking.status as BookingStatus,
          };
          if (booking.admin_booking && Array.isArray(booking.admin_booking) && booking.admin_booking.length > 0) {
            processedBooking.admin_booking = booking.admin_booking[0] as AdminBookingInfo;
          }
          if (booking.user_id) {
            try {
              const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('full_name, email, phone')
                .eq('id', booking.user_id)
                .single();
              if (!userError && userData) {
                processedBooking.user_info = {
                  full_name: userData.full_name,
                  email: userData.email,
                  phone: userData.phone
                };
              }
            } catch (err) {
              console.error('Error fetching user info:', err);
            }
          }
          if (booking.booked_by_admin_id) {
            try {
              const { data: adminData, error: adminError } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', booking.booked_by_admin_id)
                .single();
              if (!adminError && adminData) {
                processedBooking.admin_info = {
                  full_name: adminData.full_name,
                  email: adminData.email
                };
              }
            } catch (err) {
              console.error('Error fetching admin info:', err);
            }
          }
          return processedBooking;
        }) || []
      );
      setBookings(processedBookings);
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

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
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

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Booking Management</h2>
      <div className="flex flex-wrap gap-2 mb-4">
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
          Completed
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 text-sm rounded-md ${
            filter === 'pending' 
              ? 'bg-yellow-600 text-white' 
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          Pending
        </button>
      </div>
      {/* Payment filter controls */}
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Payment Status:</h3>
        <div className="flex flex-wrap gap-2">
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
        <div className="flex flex-wrap gap-2">
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
      <BookingsList 
        bookings={bookings} 
        isLoading={loading} 
        onStatusUpdate={updateBookingStatus} 
      />
    </div>
  );
};

export default Bookings_Mobile; 