export interface Player {
  id: string;
  full_name: string | null;
  profile_name: string | null;
  avatar_url: string | null;
  level: number;
  wins: number;
  losses: number;
  draws: number;
  xp: number;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  xp: number;
  wins: number;
  losses: number;
  draws: number;
  created_at: string;
  updated_at: string;
  creator_id: string;
}

export interface TeamChallenge {
  id: string;
  challenger_team_id: string;
  opponent_team_id: string;
  venue_id: string;
  court_id: string;
  sport_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  format: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  image_url: string | null;
  is_active: boolean;
  rating: number | null;
}

export interface Court {
  id: string;
  name: string;
  venue_id: string;
  sport_id: string;
  is_active: boolean;
  hourly_rate: number | null;
}

export interface Sport {
  id: string;
  name: string;
  icon: string | null;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
}

export interface MatchResult {
  id: string;
  challenge_id: string;
  team_a_score: number;
  team_b_score: number;
  winner_team_id: string | null;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface PlayerStats {
  id: string;
  challenge_id: string;
  user_id: string;
  goals: number;
  assists: number;
  is_mvp: boolean | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface MatchChat {
  id: string;
  challenge_id: string;
  team_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface TeamJoinRequest {
  id: string;
  team_id: string;
  user_id: string;
  status: string;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  rules: string | null;
  entry_fee: number | null;
  max_participants: number;
  start_date: string;
  end_date: string;
  status: string;
  venue_id: string;
  sport_id: string;
  organizer_id: string;
  registration_deadline: string;
  created_at: string;
  updated_at: string;
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  user_id: string;
  team_name: string;
  player_count: number;
  registration_date: string;
  payment_status: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  venue_id: string;
  court_id: string;
  team_a_id: string | null;
  team_b_id: string | null;
  match_number: number;
  round: number;
  match_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TournamentResult {
  id: string;
  tournament_match_id: string;
  team_a_score: number;
  team_b_score: number;
  winner_id: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TournamentHostRequest {
  id: string;
  user_id: string;
  venue_id: string;
  sport_id: string;
  tournament_name: string;
  organizer_name: string;
  contact_info: string;
  description: string | null;
  start_date: string;
  end_date: string;
  max_participants: number;
  entry_fee: number | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VenueSportDisplayName {
  id: string;
  venue_id: string;
  sport_id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface TournamentRegistrationCount {
  tournament_id: string;
  count: number;
}

// Export interface for tournament with details including registration count
// This replaces the old TournamentDetails which was a duplicate of Tournament
export interface TournamentWithDetails extends Tournament {
  registration_count?: TournamentRegistrationCount[];
}
