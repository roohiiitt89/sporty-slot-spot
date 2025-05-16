
import { AvailabilitySlot, GetAvailableSlotsResult } from '@/types/help';
import { supabase } from './client';

// Type definition for custom RPC calls that aren't in the auto-generated types
export interface CustomSupabaseRpcFunctions {
  get_available_slots: (params: {
    p_court_id: string;
    p_date: string;
  }) => Promise<{ data: GetAvailableSlotsResult; error: any }>;
}

// Helper to call the get_available_slots function with proper typing
export const getAvailableSlots = async (
  courtId: string, 
  date: string
): Promise<{ data: GetAvailableSlotsResult | null; error: any }> => {
  try {
    console.log(`Calling get_available_slots with courtId=${courtId}, date=${date}`);
    
    // We need to use the any type here since the function isn't in the auto-generated types
    const response = await (supabase.rpc as any)('get_available_slots', {
      p_court_id: courtId,
      p_date: date,
    });
    
    if (response.error) {
      console.error('Error fetching available slots:', response.error);
      return { data: null, error: response.error };
    }
    
    console.log('Available slots response:', response.data);
    return { data: response.data, error: null };
  } catch (error) {
    console.error('Exception fetching available slots:', error);
    return { data: null, error };
  }
};
