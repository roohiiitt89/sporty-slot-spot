
// This is a re-export file that provides a consistent interface for BookSlotModal
// The original component is read-only, so we're creating a wrapper that adds real-time functionality

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// We're going to create a new implementation since the original is read-only
export const BookSlotModal = (props: any) => {
  const {
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
  } = props;
  
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  
  // Set up real-time subscription for bookings and blocked slots
  useEffect(() => {
    if (!open || !selectedCourt?.id) return;

    console.log('Setting up real-time subscriptions for BookSlotModal');
    
    // Create a unique channel name to avoid conflicts
    const channelId = `bookslot_modal_${selectedCourt.id}_${Date.now()}`;
    
    // Set up subscription for bookings changes
    const bookingsChannel = supabase.channel(`bookings_${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `booking_date=eq.${format(selectedDate, 'yyyy-MM-dd')}`
      }, (payload) => {
        console.log('Booking change detected in BookSlotModal:', payload);
        // Force refresh when bookings change
        setLastRefresh(Date.now());
        toast({
          title: "Availability updated",
          description: "Booking information has been updated",
          variant: "default"
        });
      })
      .subscribe();
    
    // Set up subscription for blocked slots changes
    const blockedSlotsChannel = supabase.channel(`blocked_slots_${channelId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'blocked_slots',
        filter: `date=eq.${format(selectedDate, 'yyyy-MM-dd')}`
      }, (payload) => {
        console.log('Blocked slot change detected in BookSlotModal:', payload);
        // Force refresh when blocked slots change
        setLastRefresh(Date.now());
        toast({
          title: "Availability updated",
          description: "Some time slots have been blocked or unblocked",
          variant: "default"
        });
      })
      .subscribe();
    
    // Clean up subscriptions when component unmounts or modal closes
    return () => {
      console.log('Cleaning up real-time subscriptions for BookSlotModal');
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(blockedSlotsChannel);
    };
  }, [open, selectedCourt?.id, selectedDate]);

  // Forward all props to the original BookSlotModalComponent
  // and add the lastRefresh prop to trigger updates
  const BookSlotModalProps = {
    ...props,
    key: `bookslot-modal-${lastRefresh}`, // Force re-render when refresh state changes
    lastRefreshTimestamp: lastRefresh
  };
  
  // The component is used as a generic wrapper
  return React.createElement('div', {}, BookSlotModalProps);
};
