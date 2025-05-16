import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getAvailableSlots } from '@/integrations/supabase/custom-types';
import { Loader2, Clock, Info, User, Mail, Phone, Calendar, Ban, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AvailabilitySlot, BookingInfo, GetAvailableSlotsResult } from '@/types/help';
import { toast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AdminAvailabilityWidgetProps {
  courtId: string;
  date: string;
  venueName?: string;
  courtName?: string;
}

interface BlockedSlot {
  id: string;
  court_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
}

const AdminAvailabilityWidget: React.FC<AdminAvailabilityWidgetProps> = ({ 
  courtId, 
  date,
  venueName = 'Venue',
  courtName = 'Court' 
}) => {
  const [slots, setSlots] = useState<(AvailabilitySlot & { blocked?: BlockedSlot })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingInfo | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockingSlot, setBlockingSlot] = useState(false);
  const [unblockingSlot, setUnblockingSlot] = useState(false);

  useEffect(() => {
    const fetchAvailabilityAndBookings = async () => {
      try {
        setLoading(true);
        
        // Use our custom helper function for get_available_slots
        const { data: availabilityData, error: availabilityError } = await getAvailableSlots(courtId, date);

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
        
        // Fetch blocked slots
        const { data: blockedSlotsData, error: blockedSlotsError } = await supabase
          .from('blocked_slots')
          .select('*')
          .eq('court_id', courtId)
          .eq('date', date);
          
        if (blockedSlotsError) throw blockedSlotsError;
        
        // Merge availability data with booking and blocked slots data
        const enhancedSlots = availabilityData?.map((slot: AvailabilitySlot) => {
          const booking = bookingsData?.find((b: BookingInfo) => 
            b.start_time === slot.start_time && 
            b.end_time === slot.end_time
          );
          
          const blockedSlot = blockedSlotsData?.find((bs: BlockedSlot) => 
            bs.start_time === slot.start_time && 
            bs.end_time === slot.end_time
          );
          
          return {
            ...slot,
            booking: booking || undefined,
            blocked: blockedSlot || undefined
          };
        }) || [];
        
        setSlots(enhancedSlots);
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
    const bookingsChannel = supabase
      .channel('admin_bookings_changes')
      .on('postgres_changes', 
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'bookings',
          filter: `court_id=eq.${courtId}`,
        },
        () => {
          // When booking changes, refetch data
          fetchAvailabilityAndBookings();
        }
      )
      .subscribe();
      
    // Set up real-time subscription for blocked slots changes
    const blockedSlotsChannel = supabase
      .channel('admin_blocked_slots_changes')
      .on('postgres_changes', 
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'blocked_slots',
          filter: `court_id=eq.${courtId}`,
        },
        () => {
          // When blocked slots change, refetch data
          fetchAvailabilityAndBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(blockedSlotsChannel);
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
          .select('full_name, email, phone')
          .eq('id', booking.user_id)
          .single();
          
        if (!userError && userData) {
          booking.user_name = userData.full_name;
          booking.user_email = userData.email;
          booking.user_phone = userData.phone;
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    }
    
    setSelectedBooking(booking);
    setShowDialog(true);
  };

  const handleStatusChange = async (bookingId: string, newStatus: "confirmed" | "cancelled" | "completed" | "pending") => {
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
  
  const handleBlockSlot = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    setBlockReason('');
    setShowBlockDialog(true);
  };
  
  const handleUnblockSlot = async (slot: AvailabilitySlot & { blocked?: BlockedSlot }) => {
    if (!slot.blocked?.id) return;
    
    try {
      setUnblockingSlot(true);
      
      const { error } = await supabase
        .from('blocked_slots')
        .delete()
        .eq('id', slot.blocked.id);
        
      if (error) throw error;
      
      toast({
        title: 'Slot Unblocked',
        description: `The time slot has been successfully unblocked.`,
      });
      
    } catch (error) {
      console.error('Error unblocking slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to unblock time slot',
        variant: 'destructive',
      });
    } finally {
      setUnblockingSlot(false);
    }
  };
  
  const confirmBlockSlot = async () => {
    if (!selectedSlot) return;
    
    try {
      setBlockingSlot(true);
      
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      const { error } = await supabase
        .from('blocked_slots')
        .insert({
          court_id: courtId,
          date: date,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          reason: blockReason || null,
          created_by: user.id
        });
        
      if (error) throw error;
      
      setShowBlockDialog(false);
      toast({
        title: 'Slot Blocked',
        description: `The time slot has been successfully blocked.`,
      });
      
    } catch (error) {
      console.error('Error blocking slot:', error);
      toast({
        title: 'Error',
        description: 'Failed to block time slot',
        variant: 'destructive',
      });
    } finally {
      setBlockingSlot(false);
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
              {slots.map((slot, index) => {
                const isBlocked = !!slot.blocked;
                const isBooked = !slot.is_available && !isBlocked;
                
                return (
                  <div 
                    key={index} 
                    className={`border rounded-md p-2 text-center ${
                      isBlocked 
                        ? 'border-orange-300 bg-orange-50' 
                        : isBooked
                          ? 'border-red-300 bg-red-50 hover:bg-red-100 cursor-pointer'
                          : 'border-green-300 bg-green-50 hover:bg-green-100'
                    }`}
                    onClick={() => isBooked && slot.booking ? handleSlotClick(slot.booking) : null}
                  >
                    <p className="text-sm font-medium">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</p>
                    <Badge className={`mt-1 ${
                      isBlocked 
                        ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' 
                        : isBooked
                          ? 'bg-red-100 text-red-800 hover:bg-red-100'
                          : 'bg-green-100 text-green-800 hover:bg-green-100'
                    }`}>
                      {isBlocked ? 'Blocked' : isBooked ? 'Booked' : 'Available'}
                    </Badge>
                    
                    {isBooked && slot.booking && (
                      <div className="mt-1 text-xs text-gray-500">
                        {slot.booking.guest_name || 'Registered User'}
                      </div>
                    )}
                    
                    {isBlocked && slot.blocked?.reason && (
                      <div className="mt-1 text-xs text-orange-600 truncate" title={slot.blocked.reason}>
                        {slot.blocked.reason}
                      </div>
                    )}
                    
                    <div className="mt-2 flex justify-center">
                      {isBlocked ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7 px-2 py-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnblockSlot(slot);
                          }}
                          disabled={unblockingSlot}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Unblock
                        </Button>
                      ) : !isBooked && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7 px-2 py-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBlockSlot(slot);
                          }}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Block
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
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
                      {selectedBooking.user_phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-500 mr-2" />
                          <p>{selectedBooking.user_phone}</p>
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
                    onClick={() => handleStatusChange(selectedBooking.id, "cancelled")}
                  >
                    Cancel Booking
                  </Button>
                )}
                {selectedBooking.status !== 'completed' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStatusChange(selectedBooking.id, "completed")}
                  >
                    Mark as Completed
                  </Button>
                )}
                {selectedBooking.status === 'cancelled' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStatusChange(selectedBooking.id, "confirmed")}
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
      
      {/* Block Slot Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Time Slot</DialogTitle>
            <DialogDescription>
              Block this time slot to prevent bookings
            </DialogDescription>
          </DialogHeader>
          
          {selectedSlot && (
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 rounded border border-orange-200">
                <p className="font-medium text-orange-800">
                  <Calendar className="h-4 w-4 inline-block mr-1" />
                  {format(new Date(date), 'MMM dd, yyyy')}
                </p>
                <p className="text-orange-700 mt-1">
                  <Clock className="h-4 w-4 inline-block mr-1" />
                  {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="block-reason">Reason for blocking (optional)</Label>
                <Textarea 
                  id="block-reason" 
                  placeholder="e.g., Court maintenance, Staff unavailability, etc."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="ghost" 
              onClick={() => setShowBlockDialog(false)}
              className="sm:ml-auto"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmBlockSlot}
              disabled={blockingSlot}
            >
              {blockingSlot ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
              Block Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminAvailabilityWidget;
