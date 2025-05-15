
import { supabase } from './client';

// Enable realtime for specific tables
export const setupRealtimeSubscriptions = async () => {
  try {
    // Enable realtime for relevant tables
    await supabase.rpc('supabase_realtime', { 
      table: 'bookings',
      action: 'subscribe'
    });
    
    await supabase.rpc('supabase_realtime', { 
      table: 'blocked_slots',
      action: 'subscribe'
    });
    
    console.log('Realtime subscriptions set up successfully');
  } catch (error) {
    console.error('Error setting up realtime subscriptions:', error);
  }

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
      { event: 'UPDATE', schema: 'public', table: 'team_join_requests' },
      (payload) => {
        console.log('Join request updated:', payload);
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
};

// Enable realtime globally on application start
export const enableRealtimeForBookingSystem = async () => {
  try {
    console.log('Enabling realtime for booking system tables');
    
    // Make sure tables have replica identity full for complete data
    await supabase.rpc('supabase_realtime', { 
      table: 'bookings',
      action: 'subscribe'
    });
    
    await supabase.rpc('supabase_realtime', { 
      table: 'blocked_slots',
      action: 'subscribe'
    });
  } catch (error) {
    console.error('Error enabling realtime for booking system:', error);
  }
};
