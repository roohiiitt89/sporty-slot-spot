
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { TournamentHeroSection } from '@/components/tournament/TournamentHeroSection';
import { TournamentTabs } from '@/components/tournament/TournamentTabs';
import type { Database } from '@/integrations/supabase/types';

type TournamentRow = Database['public']['Tables']['tournaments']['Row'];

interface Tournament extends TournamentRow {
  sport_name?: string;
  venue_name?: string;
  venue_location?: string;
}

const TournamentDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const fetchTournamentDetails = async () => {
      try {
        setLoading(true);
        if (!slug) return;

        const { data, error } = await supabase
          .from('tournaments')
          .select(`
            *,
            sports(name),
            venues(name, location)
          `)
          .eq('slug', slug)
          .eq('status', 'upcoming')
          .single();

        if (error) throw error;

        const tournamentData: Tournament = {
          ...data,
          sport_name: data.sports?.name,
          venue_name: data.venues?.name,
          venue_location: data.venues?.location
        };

        setTournament(tournamentData);
      } catch (error) {
        console.error('Error fetching tournament details:', error);
        toast.error("Failed to load tournament details.");
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentDetails();
  }, [slug]);

  useEffect(() => {
    const fetchRegistrationCount = async () => {
      if (!tournament) return;

      const { count, error } = await supabase
        .from('tournament_registrations')
        .select('*', { count: 'exact', head: false })
        .eq('tournament_id', tournament.id);

      if (error) {
        console.error('Error fetching registration count:', error);
        return;
      }

      setRegistrationCount(count || 0);
    };

    fetchRegistrationCount();
  }, [tournament]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (!user || !tournament) return;

      const { data, error } = await supabase
        .from('tournament_registrations')
        .select('id')
        .eq('tournament_id', tournament.id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking registration:', error);
        return;
      }

      setIsRegistered(!!data);
    };

    checkRegistration();
  }, [user, tournament]);

  const handleRegister = async () => {
    if (!user || !tournament) {
      navigate('/login');
      return;
    }

    setIsRegistering(true);
    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournament.id,
          user_id: user.id,
          team_name: `${user.user_metadata?.full_name || 'Team'} Squad`,
          player_count: 1,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Registration successful!');
      setIsRegistered(true);
      setRegistrationCount(prev => prev + 1);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register for tournament');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-dark">
      <div className="bg-gradient-to-b from-[#1e3b2c] to-black pt-24 pb-12 md:pb-16 relative">
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">Tournament Details</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2def80]"></div>
          </div>
        ) : !tournament ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Tournament not found</h2>
            <button
              onClick={() => navigate('/tournaments')}
              className="px-4 py-2 bg-[#1e3b2c] text-white rounded-md hover:bg-[#2a4d3a] transition-colors"
            >
              Back to Tournaments
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <TournamentHeroSection />
              <div className="mt-8 space-y-6">
                <div className="bg-navy-light p-6 rounded-lg">
                  <h2 className="text-2xl font-bold text-white mb-4">{tournament.name}</h2>
                  <p className="text-gray-300 mb-4">{tournament.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Sport:</span>
                      <span className="text-white ml-2">{tournament.sport_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Venue:</span>
                      <span className="text-white ml-2">{tournament.venue_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Start Date:</span>
                      <span className="text-white ml-2">{format(new Date(tournament.start_date), 'MMM dd, yyyy')}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">End Date:</span>
                      <span className="text-white ml-2">{format(new Date(tournament.end_date), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <Card className="bg-navy-light border-navy shadow-lg sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Tournament Registration</h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Entry Fee:</span>
                      <span className="text-white font-semibold">
                        {tournament.entry_fee ? `₹${tournament.entry_fee}` : 'Free'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Participants:</span>
                      <span className="text-white font-semibold">
                        {registrationCount}/{tournament.max_participants}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Registration Deadline:</span>
                      <span className="text-white font-semibold">
                        {format(new Date(tournament.registration_deadline), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  
                  {isRegistered ? (
                    <Button disabled className="w-full">
                      Already Registered
                    </Button>
                  ) : (
                    <Button
                      onClick={handleRegister}
                      disabled={isRegistering || registrationCount >= tournament.max_participants}
                      className="w-full py-6 bg-[#1e3b2c] text-white font-semibold hover:bg-[#2a4d3a] transition-colors"
                    >
                      {isRegistering ? 'Registering...' : 'Register Now'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDetailsPage;
