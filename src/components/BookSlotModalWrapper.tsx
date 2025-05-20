
import React, { useState, useEffect } from 'react';
// Import BookSlotModal as a named export
import { BookSlotModal } from './BookSlotModal';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface BookSlotModalWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedCourt: any; // Using any here to match existing implementation
  hourlyRate: number | null;
  onBookingComplete: () => void;
  allowCashPayments: boolean;
  onClose: () => void;
  venueId?: string;
  sportId?: string;
}

const BookSlotModalWrapper: React.FC<BookSlotModalWrapperProps> = ({
  open,
  onOpenChange,
  selectedDate,
  selectedCourt,
  hourlyRate,
  onBookingComplete,
  allowCashPayments,
  onClose,
  venueId,
  sportId
}) => {
  // Track when we need to refresh availability data
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Set up real-time listeners for relevant changes
  useEffect(() => {
    if (!open || !selectedCourt?.id) return;

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    
    // Set up a channel for realtime updates
    const channel = supabase.channel('bookslot_wrapper_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `booking_date=eq.${formattedDate}`
      }, () => {
        console.log('Booking change detected in wrapper');
        setLastRefresh(Date.now());
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'blocked_slots',
        filter: `date=eq.${formattedDate}`
      }, () => {
        console.log('Blocked slot change detected in wrapper');
        setLastRefresh(Date.now());
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, selectedCourt?.id, selectedDate]);

  // Pass all props to BookSlotModal including the refresh key
  return (
    <BookSlotModal
      open={open}
      onOpenChange={onOpenChange}
      selectedDate={selectedDate}
      selectedCourt={selectedCourt}
      hourlyRate={hourlyRate}
      onBookingComplete={onBookingComplete}
      allowCashPayments={allowCashPayments}
      onClose={onClose}
      venueId={venueId}
      sportId={sportId}
      key={`modal-wrapper-${lastRefresh}`}
    />
  );
};

export default BookSlotModalWrapper;
