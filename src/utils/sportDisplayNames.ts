
import { supabase } from '@/integrations/supabase/client';

/**
 * Gets the custom display name for a sport at a specific venue if one exists
 * Falls back to the default sport name if no custom name is found
 */
export async function getSportDisplayName(venueId: string, sportId: string, defaultName: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('venue_sport_display_names')
      .select('display_name')
      .eq('venue_id', venueId)
      .eq('sport_id', sportId)
      .maybeSingle();
    
    if (error) throw error;
    
    return data?.display_name || defaultName;
  } catch (error) {
    console.error('Error fetching custom sport display name:', error);
    return defaultName;
  }
}

/**
 * Get all sport display names for a venue
 */
export async function getVenueSportDisplayNames(venueId: string): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('venue_sport_display_names')
      .select('sport_id, display_name')
      .eq('venue_id', venueId);
    
    if (error) throw error;
    
    // Create a map of sport_id to display_name
    const displayNames: Record<string, string> = {};
    data?.forEach(item => {
      displayNames[item.sport_id] = item.display_name;
    });
    
    return displayNames;
  } catch (error) {
    console.error('Error fetching venue sport display names:', error);
    return {};
  }
}
