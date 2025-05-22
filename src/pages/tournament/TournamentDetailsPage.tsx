
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTournamentDetails } from "@/hooks/use-tournament";
import { Button } from "@/components/ui/button";
import { RegisterTournamentForm } from "@/components/tournament/RegisterTournamentForm";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, MapPinIcon, TrophyIcon, Users2Icon, ArrowLeft, Coins, ArrowRightCircle, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { TournamentFixtures } from "@/components/tournament/TournamentFixtures";

export function TournamentDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: tournament, isLoading } = useTournamentDetails(slug);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isUpcoming = tournament && new Date(tournament.start_date) > new Date();
  const isOngoing = tournament && new Date(tournament.start_date) <= new Date() && new Date(tournament.end_date) >= new Date();
  const registrationOpen = tournament && new Date(tournament.registration_deadline) >= new Date();
  const daysUntilStart = tournament && isUpcoming ? differenceInDays(new Date(tournament.start_date), new Date()) : 0;
  // Use a default value or optional chaining for registration_count
  const registrationCount = tournament?.registration_count || 0;

  // Check if user is registered for this tournament
  const checkRegistration = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data } = await (supabase.from as any)("tournament_registrations")
      .select("id")
      .eq("tournament_id", tournament?.id)
      .eq("user_id", session.user.id)
      .single();

    setIsUserRegistered(!!data);
  };

  // Check registration when tournament data loads
  if (tournament && !isLoading) {
    checkRegistration();
  }

  const handleRegistrationClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please log in to register for the tournament",
        variant: "destructive",
      });
      navigate("/login", { state: { returnUrl: `/tournaments/${slug}` } });
      return;
    }

    setIsDialogOpen(true);
  };

  const handleRegistrationSuccess = () => {
    setIsDialogOpen(false);
    setIsUserRegistered(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-12">
          <Skeleton className="h-8 w-40 mb-8" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-60 w-full rounded-lg mb-8" />
              
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="h-5 w-5 mr-3" />
                    <Skeleton className="h-5 flex-1" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
          <p className="text-muted-foreground mb-6">The tournament you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/tournaments">Back to Tournaments</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-12">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/tournaments" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tournaments
          </Link>
        </Button>
        
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              isUpcoming ? 'bg-blue-100 text-blue-800' : 
              isOngoing ? 'bg-green-100 text-green-800' : 
              'bg-amber-100 text-amber-800'
            }`}>
              {isUpcoming ? 'Upcoming' : isOngoing ? 'Ongoing' : 'Completed'}
            </span>
            
            {tournament.sport_name && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                {tournament.sport_name}
              </span>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{tournament.name}</h1>
          <div className="flex items-center text-muted-foreground">
            <MapPinIcon className="w-4 h-4 mr-2" />
            <span>{tournament.venue_name}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {isUpcoming && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6 mb-8 flex items-center justify-between"
              >
                <div>
                  <h2 className="text-xl font-bold mb-1">Tournament starting in {daysUntilStart} days</h2>
                  <p className="opacity-90">
                    {registrationOpen ? 
                      `Registration open until ${format(new Date(tournament.registration_deadline), 'MMM d, yyyy')}` : 
                      'Registration is closed'
                    }
                  </p>
                </div>
                
                {registrationOpen && !isUserRegistered && (
                  <Button 
                    onClick={handleRegistrationClick} 
                    variant="secondary"
                    className="whitespace-nowrap"
                  >
                    Register Now
                    <ArrowRightCircle className="ml-2 h-4 w-4" />
                  </Button>
                )}
                
                {isUserRegistered && (
                  <div className="bg-background/20 text-primary-foreground px-4 py-2 rounded-md font-medium">
                    You are registered
                  </div>
                )}
              </motion.div>
            )}
            
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">About the Tournament</h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {tournament.description || "No description provided."}
                </p>
              </div>
              
              {tournament.rules && (
                <div>
                  <h3 className="text-xl font-medium mb-3">Rules & Guidelines</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{tournament.rules}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-8">
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CalendarIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                    <h3 className="font-medium">Tournament Period</h3>
                  </div>
                  <p className="text-muted-foreground">
                    {format(new Date(tournament.start_date), 'MMM d, yyyy')} - {format(new Date(tournament.end_date), 'MMM d, yyyy')}
                  </p>
                </div>
                
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                    <h3 className="font-medium">Registration Deadline</h3>
                  </div>
                  <p className="text-muted-foreground">
                    {format(new Date(tournament.registration_deadline), 'MMM d, yyyy')}
                  </p>
                </div>
                
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Users2Icon className="h-5 w-5 mr-2 text-muted-foreground" />
                    <h3 className="font-medium">Participants</h3>
                  </div>
                  <p className="text-muted-foreground">
                    {registrationCount} / {tournament.max_participants} registered
                  </p>
                </div>
                
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Coins className="h-5 w-5 mr-2 text-muted-foreground" />
                    <h3 className="font-medium">Entry Fee</h3>
                  </div>
                  <p className="text-muted-foreground">
                    {tournament.entry_fee ? `₹${tournament.entry_fee}` : 'Free'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-card border rounded-lg p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-4">Tournament Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <TrophyIcon className="w-5 h-5 mr-3 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Sport</p>
                    <p className="text-muted-foreground">{tournament.sport_name}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPinIcon className="w-5 h-5 mr-3 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Venue</p>
                    <p className="text-muted-foreground">{tournament.venue_name}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CalendarIcon className="w-5 h-5 mr-3 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Dates</p>
                    <p className="text-muted-foreground">
                      {format(new Date(tournament.start_date), 'MMM d')} - {format(new Date(tournament.end_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="w-5 h-5 mr-3 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Registration Deadline</p>
                    <p className="text-muted-foreground">
                      {format(new Date(tournament.registration_deadline), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Users2Icon className="w-5 h-5 mr-3 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Max Teams</p>
                    <p className="text-muted-foreground">{tournament.max_participants}</p>
                  </div>
                </div>
                
                {tournament.entry_fee && (
                  <div className="flex items-start">
                    <Coins className="w-5 h-5 mr-3 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Entry Fee</p>
                      <p className="text-muted-foreground">₹{tournament.entry_fee}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {isUpcoming && registrationOpen && !isUserRegistered ? (
                <Button onClick={handleRegistrationClick} className="w-full mt-6">
                  Register for Tournament
                </Button>
              ) : isUserRegistered ? (
                <div className="mt-6 bg-primary/10 border border-primary/20 text-primary rounded-md p-4 text-center">
                  <p className="font-medium">You are registered for this tournament</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        
        {/* Fixtures Section */}
        <TournamentFixtures tournamentId={tournament.id} />
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Register for Tournament</DialogTitle>
          <RegisterTournamentForm 
            tournament={tournament} 
            onSuccess={handleRegistrationSuccess} 
            onCancel={() => setIsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
