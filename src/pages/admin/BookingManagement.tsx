import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import {
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from "@/components/ui/tabs";
import { AdminBookingInfo, Booking, BookingStatus } from '@/types/help';
import BookingsList from '@/components/admin/BookingsList';
import AdminBookingTab from '@/components/admin/AdminBookingTab';
import SlotBlockingTab from '@/components/admin/SlotBlockingTab';

interface BookingManagementProps {
  userRole: string | null;
  adminVenues: { venue_id: string }[];
}

const BookingManagement: React.FC<BookingManagementProps> = ({ userRole, adminVenues }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | BookingStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'cash' | 'online' | 'card' | 'free'>('all');

  useEffect(() => {
    fetchBookings();
  }, [filter, paymentFilter, paymentMethodFilter, userRole, adminVenues]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      console.log('Fetching bookings for role:', userRole);
      
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
        
        const { data: courtIds, error: courtError } = await supabase
          .from('courts')
          .select('id')
          .in('venue_id', venueIds);
          
        if (courtError) {
          throw courtError;
        }
        
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
      
      if (error) {
        throw error;
      }
      
      // Process all bookings to get user and admin info
      const processedBookings = await Promise.all(
        data?.map(async booking => {
          // Create a properly typed booking object with correct initial structure
          let processedBooking: Booking = {
            ...booking,
            admin_booking: null, // Initialize with null, we'll set the proper value below
            court: booking.court,
            status: booking.status as BookingStatus,
          };
          
          // Handle admin_booking - if it's an array with elements, take the first one
          if (booking.admin_booking && Array.isArray(booking.admin_booking) && booking.admin_booking.length > 0) {
            processedBooking.admin_booking = booking.admin_booking[0] as AdminBookingInfo;
          }
          
          // Fetch user info if the booking has a user_id
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
          
          // Fetch admin info if the booking has a booked_by_admin_id
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
    <div>
      <Tabs defaultValue="bookings">
        <TabsList className="mb-6">
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="admin-booking">Book for Customer</TabsTrigger>
          <TabsTrigger value="slot-blocking">Block Time Slots</TabsTrigger>
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
        </TabsContent>
        
        <TabsContent value="admin-booking">
          <AdminBookingTab userRole={userRole} adminVenues={adminVenues} />
        </TabsContent>
        
        <TabsContent value="slot-blocking">
          <SlotBlockingTab userRole={userRole} adminVenues={adminVenues} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookingManagement;
