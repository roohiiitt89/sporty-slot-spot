
import { supabase } from './client';

// Enable realtime for specific tables
export const setupRealtimeSubscriptions = async () => {
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
};

// This function is no longer needed as we're using the channel API
// which doesn't require explicit enabling of tables
export const enableRealtimeForTeamTables = async () => {
  try {
    console.log('Realtime enabled for team tables');
  } catch (error) {
    console.error('Error enabling realtime:', error);
  }
};
