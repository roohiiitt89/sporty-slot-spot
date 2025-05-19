
export interface Tournament {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  rules: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_participants: number;
  entry_fee: number | null;
  venue_id: string;
  venue_name: string;
  sport_id: string;
  sport_name: string;
  status: string;
  created_at: string;
  created_by: string;
  organizer_name: string;
  contact_info: string;
  registration_count?: number;
  is_approved: boolean;
}

// Add TournamentWithDetails which extends Tournament
export interface TournamentWithDetails extends Tournament {
  registration_count: number;
  registered_users?: TournamentRegistration[];
  matches?: TournamentMatch[];
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  user_id: string;
  team_name: string;
  player_count: number;
  contact_info: string;
  payment_status: string;
  payment_id: string | null;
  created_at: string;
  captain_name: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  team_a_id: string | null;
  team_b_id: string | null;
  match_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_id: string | null;
  court_id: string | null;
  status: string;
  created_at: string;
}

export interface TournamentResult {
  id: string;
  match_id: string;
  team_a_score: number;
  team_b_score: number;
  winner_id: string | null;
  comments: string | null;
  created_at: string;
}
