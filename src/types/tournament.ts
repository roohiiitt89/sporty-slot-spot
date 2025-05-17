
import { Database } from "@/integrations/supabase/types";

export type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];
export type TournamentRegistration = Database["public"]["Tables"]["tournament_registrations"]["Row"];
export type TournamentMatch = Database["public"]["Tables"]["tournament_matches"]["Row"];
export type TournamentResult = Database["public"]["Tables"]["tournament_results"]["Row"];
export type TournamentHostRequest = Database["public"]["Tables"]["tournament_host_requests"]["Row"];

export type TournamentStatus = "upcoming" | "ongoing" | "completed";
export type TournamentRegistrationStatus = "pending" | "completed" | "failed";
export type TournamentHostRequestStatus = "pending" | "approved" | "rejected";
export type TournamentMatchStatus = "scheduled" | "in_progress" | "completed";

export interface TournamentWithDetails extends Tournament {
  sport_name?: string;
  venue_name?: string;
  registration_count?: number;
  is_registered?: boolean;
}
