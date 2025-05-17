import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarIcon, Users2Icon, Clock, MapPinIcon, TrophyIcon } from "lucide-react";

interface TournamentFixturesProps {
  tournamentId: string;
}

interface Match {
  id: string;
  round: number;
  match_number: number;
  match_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string;
  team_a?: { id: string; team_name: string; player_count?: number } | null;
  team_b?: { id: string; team_name: string; player_count?: number } | null;
  venue?: { name: string } | null;
  court?: { name: string } | null;
  result?: {
    team_a_score: number;
    team_b_score: number;
    winner_id: string | null;
  } | null;
}

export function TournamentFixtures({ tournamentId }: TournamentFixturesProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFixtures = async () => {
      setLoading(true);
      const { data, error } = await (supabase.from as any)("tournament_matches")
        .select(`
          id, round, match_number, match_date, start_time, end_time, status,
          team_a:team_a_id (id, team_name, player_count),
          team_b:team_b_id (id, team_name, player_count),
          venue:venue_id (name),
          court:court_id (name),
          result:tournament_results (team_a_score, team_b_score, winner_id)
        `)
        .eq('tournament_id', tournamentId)
        .order('round')
        .order('match_number');
      if (!error && data) setMatches(data);
      setLoading(false);
    };
    if (tournamentId) fetchFixtures();
  }, [tournamentId]);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading fixtures...</div>;
  if (!matches.length) return <div className="py-8 text-center text-muted-foreground">No fixtures scheduled yet.</div>;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Fixtures</h2>
      <div className="space-y-4">
        {matches.map(match => {
          const winner = match.result?.winner_id === match.team_a?.id ? match.team_a?.team_name :
                         match.result?.winner_id === match.team_b?.id ? match.team_b?.team_name : null;
          return (
            <div key={match.id} className="bg-card border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-indigo-600">Round {match.round}</span>
                <span className="text-muted-foreground">Match {match.match_number}</span>
              </div>
              <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-center gap-2 text-lg font-medium">
                <div className="flex flex-col items-center">
                  <span>{match.team_a?.team_name || 'TBD'}</span>
                  {match.team_a && <span className="text-xs text-muted-foreground">Players: {match.team_a.player_count}</span>}
                </div>
                <span className="mx-2 text-muted-foreground">vs</span>
                <div className="flex flex-col items-center">
                  <span>{match.team_b?.team_name || 'TBD'}</span>
                  {match.team_b && <span className="text-xs text-muted-foreground">Players: {match.team_b.player_count}</span>}
                </div>
              </div>
              <div className="flex flex-col md:items-end gap-1 text-sm text-muted-foreground min-w-[160px]">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {match.match_date ? match.match_date : 'TBD'}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {match.start_time ? match.start_time.slice(0,5) : 'TBD'}
                </div>
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  {match.venue?.name || 'Venue TBD'}
                </div>
                <div className="flex items-center gap-1">
                  <TrophyIcon className="h-4 w-4" />
                  {match.court?.name || 'Court TBD'}
                </div>
                <div className="flex items-center gap-1">
                  <Users2Icon className="h-4 w-4" />
                  <span className={
                    match.status === 'completed' ? 'text-green-600' :
                    match.status === 'confirmed' ? 'text-blue-600' :
                    'text-yellow-600'
                  }>
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                  </span>
                </div>
                {match.status === 'completed' && match.result && (
                  <div className="flex flex-col mt-1">
                    <span className="text-xs text-muted-foreground">Result: {match.result.team_a_score} - {match.result.team_b_score}</span>
                    {winner && <span className="text-xs font-semibold text-green-700">Winner: {winner}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 