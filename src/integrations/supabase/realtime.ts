import { supabase } from "@/integrations/supabase/client";

// Function to initialize realtime subscriptions
export const initializeRealtime = async () => {
  try {
    // Using the channel method instead of direct supabase.from().on()
    const channel = supabase.channel('realtime-updates');
    
    // Listen to changes on the team_members table
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, (payload) => {
        console.log('Team members change received:', payload);
      })
      .subscribe();

    // To enable realtime functionality at the Supabase project level
    // We need to use a different approach than direct RPC call
    // This would typically be done in the Supabase dashboard or via direct SQL
    
    console.log('Realtime subscriptions initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize realtime subscriptions:', error);
    return false;
  }
};

export const subscribeToTeamUpdates = (teamId: string, callback: (payload: any) => void) => {
  // Using the channel method for subscribing to specific team updates
  const channel = supabase.channel(`team-${teamId}`);
  
  channel
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'teams', filter: `id=eq.${teamId}` }, 
        callback)
    .subscribe();
  
  return () => {
    channel.unsubscribe();
  };
};

// Other realtime helper functions would go here...
