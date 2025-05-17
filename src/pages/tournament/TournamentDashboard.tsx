import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TournamentHeroSection } from "@/components/tournament/TournamentHeroSection";
import { TournamentTabs } from "@/components/tournament/TournamentTabs";
import { Button } from "@/components/ui/button";
import { useTournament } from "@/hooks/use-tournament";
import { PlusIcon, TrophyIcon } from "lucide-react";
import { motion } from "framer-motion";

type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';

export function TournamentDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TournamentStatus>('upcoming');
  const { data: tournaments = [], isLoading } = useTournament();

  // Optionally filter tournaments by status
  const filteredTournaments = tournaments.filter(t => {
    if (filter === 'upcoming') {
      return new Date(t.start_date) > new Date();
    } else if (filter === 'ongoing') {
      return new Date(t.start_date) <= new Date() && new Date(t.end_date) >= new Date();
    } else if (filter === 'completed') {
      return new Date(t.end_date) < new Date();
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <TournamentHeroSection />
      
      <div className="container px-4 py-12" id="tournament-list">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold">Tournaments</h2>
            <p className="text-muted-foreground">Browse, join and participate in sports tournaments</p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate("/tournaments/host")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Host Tournament
            </Button>
            
            <Button 
              onClick={() => setFilter("upcoming")}
              className="flex items-center gap-2"
            >
              <TrophyIcon className="h-4 w-4" />
              Enter Tournament
            </Button>
          </div>
        </div>
        
        <div className="mt-8">
          <TournamentTabs 
            tournaments={filteredTournaments} 
            isLoading={isLoading}
            activeTab={filter}
            setActiveTab={setFilter}
          />
        </div>
      </div>
    </div>
  );
}
