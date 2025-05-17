import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TournamentRow = Database['public']['Tables']['tournaments']['Row'];

type SportRow = Database['public']['Tables']['sports']['Row'];
type VenueRow = Database['public']['Tables']['venues']['Row'];

export interface Tournament extends TournamentRow {
  sport_name?: string;
  venue_name?: string;
}

// Fetch all tournaments
export function useTournament() {
  return useQuery<Tournament[], Error>({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments' as const)
        .select('*, sports(name), venues(name)')
        .order('start_date', { ascending: true });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        sport_name: t.sports?.name,
        venue_name: t.venues?.name,
      }));
    }
  });
}

// Fetch tournament details by slug
export function useTournamentDetails(slug?: string) {
  return useQuery<Tournament | null, Error>({
    queryKey: ['tournament', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('tournaments' as const)
        .select('*, sports(name), venues(name)')
        .eq('slug', slug)
        .single();
      console.log('Tournament details result:', { slug, data, error });
      if (error) throw error;
      return {
        ...data,
        sport_name: data?.sports?.name,
        venue_name: data?.venues?.name,
      } as Tournament;
    },
    enabled: !!slug,
  });
} 