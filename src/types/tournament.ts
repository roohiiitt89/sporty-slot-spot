
import { Database } from '@/integrations/supabase/types';

export type Tournament = Database['public']['Tables']['tournaments']['Row'] & {
  registration_count: number;
  created_by: string;
  organizer_name: string;
  contact_info: string;
  is_approved: boolean;
  venue_name?: string;
  sport_name?: string;
};

export interface TournamentWithDetails extends Tournament {
  registration_count: number;
  created_by: string;
  organizer_name: string;
  contact_info: string;
  is_approved: boolean;
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  team_id: string | null;
  user_id: string;
  registration_date: string;
  payment_status: string;
  payment_amount: number | null;
  payment_method: string | null;
  team_name: string | null;
  team_size: number | null;
  created_at: string;
  payment_reference?: string | null;
  tournament_name?: string;
  start_date?: string;
}

export interface TournamentFixture {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  team_a_id: string | null;
  team_b_id: string | null;
  team_a_name: string | null;
  team_b_name: string | null;
  venue_id: string | null;
  court_id: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  winner_id: string | null;
  team_a_score: number | null;
  team_b_score: number | null;
  match_notes: string | null;
  created_at: string;
  updated_at: string;
  venue_name?: string;
  court_name?: string;
}

export interface TournamentTeam {
  id: string;
  tournament_id: string;
  team_id: string | null; // can be null for manually registered teams
  team_name: string;
  captain_name: string;
  captain_contact: string;
  registration_status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  updated_at: string;
  team_logo?: string;
  members_count?: number;
}

export interface TournamentType {
  id: string;
  name: string;
  created_at: string;
}
