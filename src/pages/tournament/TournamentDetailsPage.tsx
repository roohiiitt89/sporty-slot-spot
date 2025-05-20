import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Tournament } from '@/types/tournament';
import TournamentTabs from '@/components/tournament/TournamentTabs';

// Extend the Tournament type to include the missing properties
interface TournamentWithDetails extends Tournament {
  registration_count: number;
  created_by?: string;
  organizer_name?: string;
  contact_info?: string;
  is_approved?: boolean;
}

const TournamentDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<TournamentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationDetails, setRegistrationDetails] = useState<any>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setLoading(true);
        
        // Fetch tournament details
        const { data, error } = await supabase
          .from('tournaments')
          .select(`
            *,
            venues:venue_id (name, address),
            registration_count:tournament_registrations (count)
          `)
          .eq('slug', slug)
          .single();
        
        if (error) throw error;
        
        if (!data) {
          setError('Tournament not found');
          return;
        }
        
        // Format the data
        const tournamentData = {
          ...data,
          registration_count: data.registration_count[0]?.count || 0
        };
        
        setTournament(tournamentData);
        
        // Check if current user is the organizer
        if (user && data.created_by === user.id) {
          setIsOrganizer(true);
        }
        
        // Check if user is registered
        if (user) {
          const { data: regData, error: regError } = await supabase
            .from('tournament_registrations')
            .select('*')
            .eq('tournament_id', data.id)
            .eq('user_id', user.id)
            .single();
          
          if (!regError && regData) {
            setIsRegistered(true);
            setRegistrationDetails(regData);
          }
        }
      } catch (err: any) {
        console.error('Error fetching tournament:', err);
        setError(err.message || 'Failed to load tournament details');
      } finally {
        setLoading(false);
      }
    };
    
    if (slug) {
      fetchTournament();
    }
  }, [slug, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error || 'Tournament not found'}</p>
          <button 
            onClick={() => navigate('/tournaments')}
            className="mt-2 bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <TournamentTabs 
        tournament={tournament} 
        isRegistered={isRegistered}
        registrationDetails={registrationDetails}
        isOrganizer={isOrganizer}
        onRegistrationChange={(status) => {
          setIsRegistered(status);
        }}
      />
    </div>
  );
};

export default TournamentDetailsPage;
