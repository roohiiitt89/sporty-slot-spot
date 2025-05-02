
import { supabase } from './client';

// Enable realtime for specific tables
export const setupRealtimeSubscriptions = async () => {
  // For team_chats table
  await supabase
    .from('team_chats')
    .on('INSERT', (payload) => {
      console.log('New chat message:', payload);
    })
    .subscribe();

  // For team_join_requests table
  await supabase
    .from('team_join_requests')
    .on('UPDATE', (payload) => {
      console.log('Join request updated:', payload);
    })
    .subscribe();
};

// Call this function once when your app initializes
export const enableRealtimeForTeamTables = async () => {
  try {
    // Enable realtime for team_chats
    await supabase.rpc('supabase_functions.enable_realtime', {
      table_name: 'team_chats'
    });
    
    // Enable realtime for team_join_requests  
    await supabase.rpc('supabase_functions.enable_realtime', {
      table_name: 'team_join_requests'
    });
    
    console.log('Realtime enabled for team tables');
  } catch (error) {
    console.error('Error enabling realtime:', error);
  }
};
