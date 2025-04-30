
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DarkThemeProvider } from '@/components/challenge/DarkThemeProvider';
import { supabase } from '@/integrations/supabase/client';
import { Team, TeamMember } from '@/types/challenge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const TeamDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!slug) return;
      
      setLoading(true);
      
      try {
        // Get team by slug
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('slug', slug)
          .single();
          
        if (teamError) {
          console.error('Error fetching team:', teamError);
          toast.error('Team not found');
          navigate('/challenge');
          return;
        }
        
        setTeam(teamData);
        
        // Get team members
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select(`
            *,
            profiles:user_id (full_name, email)
          `)
          .eq('team_id', teamData.id);
          
        if (membersError) {
          console.error('Error fetching team members:', membersError);
        } else {
          setMembers(membersData);
        }
        
        // Check if current user is a member
        if (user) {
          const userIsMember = membersData?.some(member => member.user_id === user.id);
          setIsTeamMember(userIsMember || false);
          
          const userIsCreator = teamData.creator_id === user.id;
          setIsCreator(userIsCreator);
        }
      } catch (error) {
        console.error('Error in fetchTeam:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (slug) {
      fetchTeam();
    }
  }, [slug, user, navigate]);

  if (loading) {
    return (
      <DarkThemeProvider>
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
          <div className="w-full max-w-4xl">
            <div className="animate-pulse">
              <div className="h-10 w-1/3 bg-gray-700 rounded mb-8"></div>
              <div className="h-40 w-full bg-gray-700 rounded mb-8"></div>
              <div className="h-20 w-full bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </DarkThemeProvider>
    );
  }

  if (!team) {
    return (
      <DarkThemeProvider>
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Team Not Found</h2>
            <p className="text-gray-300 mb-6">The team you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/challenge')} className="bg-emerald-600 hover:bg-emerald-700">
              Return to Challenge Mode
            </Button>
          </div>
        </div>
      </DarkThemeProvider>
    );
  }

  return (
    <DarkThemeProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              className="text-gray-400 hover:text-white mr-3"
              onClick={() => navigate('/challenge')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Back
            </Button>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
              Team Details
            </h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-8 border border-gray-700 mb-8"
          >
            <div className="md:flex items-start">
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-3xl font-bold mb-6 md:mb-0 md:mr-8">
                {team.name.substring(0, 2).toUpperCase()}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{team.name}</h2>
                    {team.description && (
                      <p className="text-gray-300 mb-4">{team.description}</p>
                    )}
                  </div>
                  
                  <div className="bg-emerald-900/40 text-emerald-400 rounded-full px-3 py-1 text-sm font-medium border border-emerald-600/30">
                    {team.xp} XP
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{team.wins}</div>
                    <div className="text-xs text-gray-400">Wins</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-300">{team.draws}</div>
                    <div className="text-xs text-gray-400">Draws</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">{team.losses}</div>
                    <div className="text-xs text-gray-400">Losses</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl font-bold mb-4">Team Members</h3>
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              {members.length > 0 ? (
                <div className="divide-y divide-gray-700">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3 text-sm font-medium">
                          {member.profiles?.full_name ? member.profiles.full_name.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-medium">{member.profiles?.full_name || 'Unknown User'}</div>
                          <div className="text-sm text-gray-400">{member.profiles?.email || 'No email'}</div>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          member.role === 'creator' ? 'bg-amber-900/30 text-amber-400 border border-amber-600/30' : 'bg-gray-700 text-gray-300'
                        }`}>
                          {member.role === 'creator' ? 'Team Creator' : 'Member'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400">
                  No team members found.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DarkThemeProvider>
  );
};

export default TeamDetails;
