
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TournamentWithDetails, TournamentStatus } from "@/types/tournament";

export function useTournament() {
  const [filter, setFilter] = useState<TournamentStatus>("upcoming");

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ["tournaments", filter],
    queryFn: async () => {
      const now = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from("tournaments")
        .select(`
          *,
          sport:sports(name),
          venue:venues(name),
          registrations:tournament_registrations(count)
        `)
        .order("start_date", { ascending: filter === "upcoming" });

      if (filter === "upcoming") {
        query = query.gt("start_date", now);
      } else if (filter === "ongoing") {
        query = query.lte("start_date", now).gte("end_date", now);
      } else if (filter === "completed") {
        query = query.lt("end_date", now);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching tournaments:", error);
        return [];
      }

      return data.map(tournament => ({
        ...tournament,
        sport_name: tournament.sport?.name,
        venue_name: tournament.venue?.name,
        registration_count: tournament.registrations?.length || 0
      })) as TournamentWithDetails[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    tournaments: tournaments || [],
    isLoading,
    filter,
    setFilter,
  };
}

export function useTournamentDetails(slug?: string) {
  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("tournaments")
        .select(`
          *,
          sport:sports(name, id),
          venue:venues(name, id, location),
          registrations:tournament_registrations(*)
        `)
        .eq("slug", slug)
        .single();

      if (error) {
        console.error("Error fetching tournament:", error);
        return null;
      }

      return {
        ...data,
        sport_name: data.sport?.name,
        venue_name: data.venue?.name,
        registration_count: data.registrations?.length || 0
      } as TournamentWithDetails;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    tournament,
    isLoading,
  };
}
