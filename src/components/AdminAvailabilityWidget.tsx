
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Clock, Info, User, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AvailabilitySlot, BookingInfo, GetAvailableSlotsResult } from '@/types/help';
import { toast } from '@/components/ui/use-toast';

interface AdminAvailabilityWidgetProps {
  courtId: string;
  date: string;
  venueName?: string;
  courtName?: string;
}

const AdminAvailabilityWidget: React.FC<AdminAvailabilityWidgetProps> = ({ 
  courtId, 
  date,
  venueName = 'Venue',
  courtName = 'Court' 
}) => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingInfo | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const fetchAvailabilityAndBookings = async () => {
      try {
        setLoading(true);
        
        // Fetch available slots from the database function
        const { data: availabilityData, error: availabilityError } = await supabase
          .rpc('get_available_slots', {
            p_court_id: courtId,
            p_date: date,
          })
          .returns<GetAvailableSlotsResult>();

        if (availabilityError) throw availabilityError;
        
        // Fetch bookings for this court on this date
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id, 
            user_id, 
            guest_name, 
            guest_phone, 
            start_time, 
            end_time, 
            booking_date,
            status,
            payment_status
          `)
          .eq('court_id', courtId)
          .eq('booking_date', date)
          .in('status', ['confirmed', 'pending', 'completed']);
          
        if (bookingsError) throw bookingsError;
        
        // Merge availability data with booking data
        const enhancedSlots = availabilityData.map((slot: AvailabilitySlot) => {
          const booking = bookingsData?.find((b: BookingInfo) => 
            b.start_time === slot.start_time && 
            b.end_time === slot.end_time
          );
          
          return {
            ...slot,
            booking: booking || undefined
          };
        });
        
        setSlots(enhancedSlots || []);
      } catch (error) {
        console.error('Error fetching availability and bookings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load availability data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilityAndBookings();

    // Set up real-time subscription for bookings changes
    const channel = supabase
      .channel('admin_bookings_changes')
      .on('postgres_changes', 
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'bookings',
          filter: `court_id=eq.${courtId}`,
        },
        (payload) => {
          // When booking changes, refetch data
          fetchAvailabilityAndBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courtId, date]);

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleSlotClick = async (booking: BookingInfo) => {
    // If it's a user booking, fetch user details
    if (booking.user_id) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', booking.user_id)
          .single();
          
        if (!userError && userData) {
          booking.user_name = userData.full_name;
          booking.user_email = userData.email;
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    }
    
    setSelectedBooking(booking);
    setShowDialog(true);
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
        
      if (error) throw error;
      
      setShowDialog(false);
      toast({
        title: 'Status Updated',
        description: `Booking has been marked as ${newStatus}`,
      });
      
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <Clock className="mr-2 h-5 w-5 text-indigo" />
            {courtName} Real-Time Availability {date && `(${format(new Date(date), 'MMM dd, yyyy')})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-indigo" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No time slots available for this date</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {slots.map((slot, index) => (
                <div 
                  key={index} 
                  className={`border rounded-md p-2 text-center ${
                    slot.is_available 
                      ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                      : 'border-red-300 bg-red-50 hover:bg-red-100 cursor-pointer'
                  }`}
                  onClick={() => slot.booking ? handleSlotClick(slot.booking) : null}
                >
                  <p className="text-sm font-medium">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</p>
                  <Badge className={`mt-1 ${
                    slot.is_available 
                      ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                      : 'bg-red-100 text-red-800 hover:bg-red-100'
                  }`}>
                    {slot.is_available ? 'Available' : 'Booked'}
                  </Badge>
                  {!slot.is_available && slot.booking && (
                    <div className="mt-1 text-xs text-gray-500">
                      {slot.booking.guest_name || 'Registered User'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Booking information for {venueName} / {courtName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Date</h4>
                  <p>{format(new Date(selectedBooking.booking_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Time</h4>
                  <p>{formatTime(selectedBooking.start_time)} - {formatTime(selectedBooking.end_time)}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">User Information</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  {selectedBooking.user_id ? (
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <User className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                        <div>
                          <p className="font-medium">{selectedBooking.user_name || 'Registered User'}</p>
                          <p className="text-sm text-gray-500">User ID: {selectedBooking.user_id}</p>
                        </div>
                      </div>
                      {selectedBooking.user_email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-500 mr-2" />
                          <p>{selectedBooking.user_email}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-500 mr-2" />
                        <p className="font-medium">{selectedBooking.guest_name || 'Guest (No Name)'}</p>
                      </div>
                      {selectedBooking.guest_phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-500 mr-2" />
                          <p>{selectedBooking.guest_phone}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Booking Status</h4>
                  <Badge className={`mt-1 ${
                    selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Payment Status</h4>
                  <Badge className={`mt-1 ${
                    selectedBooking.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedBooking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedBooking.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedBooking.payment_status 
                      ? selectedBooking.payment_status.charAt(0).toUpperCase() + selectedBooking.payment_status.slice(1)
                      : 'No Payment Info'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedBooking.status !== 'cancelled' && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleStatusChange(selectedBooking.id, 'cancelled')}
                  >
                    Cancel Booking
                  </Button>
                )}
                {selectedBooking.status !== 'completed' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStatusChange(selectedBooking.id, 'completed')}
                  >
                    Mark as Completed
                  </Button>
                )}
                {selectedBooking.status === 'cancelled' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStatusChange(selectedBooking.id, 'confirmed')}
                  >
                    Reactivate Booking
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminAvailabilityWidget;
