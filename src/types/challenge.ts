
export interface PlayerProfile {
  id: string;
  xp: number;
  level: number;
  profile_name: string | null;
  share_link: string | null;
  wins: number;
  losses: number;
  draws: number;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  creator_id: string;
  xp: number;
  wins: number;
  losses: number;
  draws: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'creator' | 'member';
  joined_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

export interface TeamChallenge {
  id: string;
  challenger_team_id: string;
  opponent_team_id: string;
  sport_id: string;
  venue_id: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  format: string;
  created_at: string;
  updated_at: string;
}

export interface MatchResult {
  id: string;
  challenge_id: string;
  winner_team_id: string | null;
  team_a_score: number;
  team_b_score: number;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface PlayerStats {
  id: string;
  user_id: string;
  challenge_id: string;
  goals: number;
  assists: number;
  rating: number | null;
  is_mvp: boolean | null;
  created_at: string;
  updated_at: string;
}
