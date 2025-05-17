
import { TournamentWithDetails } from "@/types/tournament";
import { CalendarIcon, MapPinIcon, Users2Icon, TrophyIcon, Coins } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface TournamentCardProps {
  tournament: TournamentWithDetails;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const isUpcoming = new Date(tournament.start_date) > new Date();
  const isOngoing = new Date(tournament.start_date) <= new Date() && new Date(tournament.end_date) >= new Date();
  const registrationOpen = new Date(tournament.registration_deadline) >= new Date();

  return (
    <div className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all">
      <div className={`h-2 ${isUpcoming ? 'bg-blue-500' : isOngoing ? 'bg-green-500' : 'bg-amber-500'}`}></div>
      <div className="p-5">
        <h3 className="text-xl font-bold mb-2">{tournament.name}</h3>
        
        <div className="flex flex-col space-y-2 mb-4">
          <div className="flex items-center text-muted-foreground">
            <TrophyIcon className="w-4 h-4 mr-2" />
            <span>{tournament.sport_name}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <MapPinIcon className="w-4 h-4 mr-2" />
            <span>{tournament.venue_name}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <span>
              {format(new Date(tournament.start_date), 'MMM d, yyyy')} - {format(new Date(tournament.end_date), 'MMM d, yyyy')}
            </span>
          </div>
          
          {tournament.entry_fee ? (
            <div className="flex items-center text-muted-foreground">
              <Coins className="w-4 h-4 mr-2" />
              <span>Entry Fee: ₹{tournament.entry_fee}</span>
            </div>
          ) : null}
          
          <div className="flex items-center text-muted-foreground">
            <Users2Icon className="w-4 h-4 mr-2" />
            <span>
              {tournament.registration_count} / {tournament.max_participants} teams registered
            </span>
          </div>
        </div>
        
        {isUpcoming && (
          <div className="text-sm mb-4">
            Registration {registrationOpen ? (
              <span className="text-green-500 font-medium">Open until {format(new Date(tournament.registration_deadline), 'MMM d, yyyy')}</span>
            ) : (
              <span className="text-red-500 font-medium">Closed</span>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm font-medium">
            <span className={`px-2 py-1 rounded-full ${
              isUpcoming ? 'bg-blue-100 text-blue-800' : 
              isOngoing ? 'bg-green-100 text-green-800' : 
              'bg-amber-100 text-amber-800'
            }`}>
              {isUpcoming ? 'Upcoming' : isOngoing ? 'Ongoing' : 'Completed'}
            </span>
          </div>
          
          <Button asChild>
            <Link to={`/tournaments/${tournament.slug}`}>View Details</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
