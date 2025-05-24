
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tournament } from "@/hooks/use-tournament";
import { TournamentCard } from "./TournamentCard";
import { TournamentListSkeleton } from "./TournamentListSkeleton";

type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';

interface TournamentTabsProps {
  tournaments: Tournament[];
  isLoading: boolean;
  activeTab: TournamentStatus;
  setActiveTab: (tab: TournamentStatus) => void;
}

export function TournamentTabs({
  tournaments,
  isLoading,
  activeTab,
  setActiveTab
}: TournamentTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TournamentStatus)} className="w-full">
      <TabsList className="grid grid-cols-3 mb-8 w-full md:w-[400px]">
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
      </TabsList>
      
      <TabsContent value="upcoming" className="mt-0">
        {isLoading ? (
          <TournamentListSkeleton />
        ) : tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-muted-foreground mb-2">No upcoming tournaments</h3>
            <p className="text-muted-foreground">Check back later for new tournaments</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="ongoing" className="mt-0">
        {isLoading ? (
          <TournamentListSkeleton />
        ) : tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-muted-foreground mb-2">No ongoing tournaments</h3>
            <p className="text-muted-foreground">Check back later for live tournaments</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed" className="mt-0">
        {isLoading ? (
          <TournamentListSkeleton />
        ) : tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-muted-foreground mb-2">No completed tournaments</h3>
            <p className="text-muted-foreground">Check back later for tournament results</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
