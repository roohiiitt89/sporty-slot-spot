
import { supabase } from './client';

// Enable realtime for specific tables
export const setupRealtimeSubscriptions = async () => {
  try {
    // For Supabase v2, we don't need to use rpc to enable realtime
    // Instead, we can directly establish channels
    console.log('Setting up realtime subscriptions');
    
    // For team_chats table
    const teamChatsChannel = supabase
      .channel('team_chats_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_chats' },
        (payload) => {
          console.log('New chat message:', payload);
        }
      )
      .subscribe();

    // For team_join_requests table
    const joinRequestsChannel = supabase
      .channel('team_join_requests_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_join_requests' },
        (payload) => {
          console.log('Team join request update:', payload);
        }
      )
      .subscribe();
      
    // For bookings table - application-wide subscription
    const bookingsChannel = supabase
      .channel('bookings_global_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Booking updated globally:', payload);
        }
      )
      .subscribe();

    // For blocked_slots table - application-wide subscription
    const blockedSlotsChannel = supabase
      .channel('blocked_slots_global_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blocked_slots' },
        (payload) => {
          console.log('Blocked slot updated globally:', payload);
        }
      )
      .subscribe();
      
    console.log('Realtime subscriptions set up successfully');
  } catch (error) {
    console.error('Error setting up realtime subscriptions:', error);
  }
};

// Enable realtime globally on application start
export const enableRealtimeForBookingSystem = async () => {
  try {
    console.log('Enabling realtime for booking system');
    
    // For Supabase v2, we'll use channels approach
    const bookingsChannel = supabase
      .channel('bookings_system_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Booking system update:', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blocked_slots' },
        (payload) => {
          console.log('Blocked slot update:', payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log('Notification update (system):', payload);
        }
      )
      .subscribe();
      
    console.log('Realtime enabled for booking system tables');
  } catch (error) {
    console.error('Error enabling realtime for booking system:', error);
  }
};
