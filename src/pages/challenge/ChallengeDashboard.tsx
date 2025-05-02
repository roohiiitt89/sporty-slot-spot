
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DarkThemeProvider } from '@/components/challenge/DarkThemeProvider';
import { HowItWorks } from '@/components/challenge/HowItWorks';
import { LeaderboardPreview } from '@/components/challenge/LeaderboardPreview';
import { TeamSection } from '@/components/challenge/TeamSection';
import { ProfileCard } from '@/components/challenge/ProfileCard';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { useChallengeMode } from '@/hooks/use-challenge-mode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  RefreshCcw, 
  ChevronRight,
  Trophy,
  Award,
  Users,
  Flag
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Team } from '@/types/challenge';
import { motion } from 'framer-motion';

const ChallengeDashboard = () => {
  const { user } = useAuth();
  const { error, loading, fetchPlayerProfile, userTeam } = useChallengeMode();
  const navigate = useNavigate();
  const [upcomingChallenges, setUpcomingChallenges] = useState([]);
  const [topTeams, setTopTeams] = useState<Team[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('Please log in to access Challenge Mode');
      navigate('/login', { state: { from: '/challenge' } });
    } else {
      fetchTopTeams();
      if (userTeam) {
        fetchUpcomingChallenges(userTeam.id);
      }
    }
  }, [user, navigate, userTeam]);

  const fetchTopTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('xp', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTopTeams(data);
    } catch (error) {
      console.error('Error fetching top teams:', error);
    }
  };

  const fetchUpcomingChallenges = async (teamId: string) => {
    setLoadingChallenges(true);
    try {
      const { data, error } = await supabase
        .from('team_challenges')
        .select(`
          *,
          challenger_team:challenger_team_id(*),
          opponent_team:opponent_team_id(*)
        `)
        .or(`challenger_team_id.eq.${teamId},opponent_team_id.eq.${teamId}`)
        .in('status', ['pending', 'accepted'])
        .order('booking_date', { ascending: true })
        .limit(3);

      if (error) throw error;
      setUpcomingChallenges(data);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoadingChallenges(false);
    }
  };

  const handleRefresh = () => {
    fetchPlayerProfile();
    if (userTeam) {
      fetchUpcomingChallenges(userTeam.id);
    }
    fetchTopTeams();
    toast.success('Refreshing data...');
  };

  if (!user) {
    return null;
  }

  return (
    <DarkThemeProvider>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300"
          >
            Challenge Mode
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 max-w-3xl mx-auto"
          >
            Create your team, challenge others, and climb the leaderboard in our competitive gaming environment.
          </motion.p>
        </header>
        
        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-800 text-red-300">
            <AlertTitle className="flex items-center justify-between">
              <span>Something went wrong</span>
              <button 
                onClick={handleRefresh} 
                className="p-1 hover:bg-red-800/30 rounded-full"
                title="Refresh data"
              >
                <RefreshCcw size={16} />
              </button>
            </AlertTitle>
            <AlertDescription>
              {error}. Please try refreshing the page or contact support if the issue persists.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Welcome to Challenge Mode!</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <RefreshCcw size={16} className="mr-1" /> Refresh
                </Button>
              </div>
              <p className="text-gray-300 mb-4">
                Challenge Mode allows you to compete against other teams, track your progress, 
                and climb the ranking ladder. Get started by creating or joining a team!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center mb-2">
                    <Trophy className="text-emerald-400" size={24} />
                  </div>
                  <h3 className="font-medium mb-1">Compete</h3>
                  <p className="text-sm text-center text-gray-400">Challenge other teams and win matches</p>
                </div>
                
                <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center mb-2">
                    <Award className="text-emerald-400" size={24} />
                  </div>
                  <h3 className="font-medium mb-1">Earn XP</h3>
                  <p className="text-sm text-center text-gray-400">Win matches to gain XP and level up</p>
                </div>
                
                <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center mb-2">
                    <Users className="text-emerald-400" size={24} />
                  </div>
                  <h3 className="font-medium mb-1">Team Up</h3>
                  <p className="text-sm text-center text-gray-400">Create or join teams with friends</p>
                </div>
              </div>
            </motion.div>
            
            <TeamSection />
          </div>
          
          <div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
                Your Profile
              </h2>
              <ProfileCard />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
                  Top Teams
                </h2>
              </div>
              
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                {topTeams.length > 0 ? (
                  <div className="divide-y divide-gray-700">
                    {topTeams.map((team, index) => (
                      <div 
                        key={team.id}
                        className="p-3 hover:bg-gray-700/30 transition-colors flex items-center cursor-pointer"
                        onClick={() => navigate(`/team/${team.slug}`)}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-sm font-bold 
                          ${index === 0 ? 'bg-yellow-500/20 text-yellow-300' : 
                            index === 1 ? 'bg-gray-400/20 text-gray-300' : 
                              index === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-gray-700 text-gray-400'}`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{team.name}</div>
                          <div className="text-xs text-gray-400">{team.wins} wins - {team.losses} losses</div>
                        </div>
                        <div className="bg-emerald-900/40 text-emerald-400 rounded-full px-2 py-1 text-xs font-medium">
                          {team.xp} XP
                        </div>
                        <ChevronRight size={16} className="ml-2 text-gray-500" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-400">
                    No teams found
                  </div>
                )}
                <div className="border-t border-gray-700 p-2 bg-gray-800/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs text-gray-400 hover:text-white hover:bg-gray-700/50"
                  >
                    View Full Leaderboard
                  </Button>
                </div>
              </div>
            </motion.div>

            {userTeam && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
                    Upcoming Challenges
                  </h2>
                </div>
                
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  {loadingChallenges ? (
                    <div className="p-4 animate-pulse">
                      <div className="h-12 bg-gray-700 rounded mb-3"></div>
                      <div className="h-12 bg-gray-700 rounded"></div>
                    </div>
                  ) : upcomingChallenges && upcomingChallenges.length > 0 ? (
                    <div className="divide-y divide-gray-700">
                      {upcomingChallenges.map((challenge: any) => (
                        <div 
                          key={challenge.id}
                          className="p-3 hover:bg-gray-700/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium flex items-center">
                              <Flag size={16} className="mr-2 text-emerald-400" />
                              {challenge.challenger_team.name} vs {challenge.opponent_team.name}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium
                              ${challenge.status === 'pending' ? 'bg-yellow-900/20 text-yellow-300' : 
                                challenge.status === 'accepted' ? 'bg-green-900/20 text-green-300' : 
                                'bg-red-900/20 text-red-300'}`}>
                              {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(challenge.booking_date).toLocaleDateString()} • {challenge.start_time} - {challenge.end_time}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400">
                      <Flag size={24} className="mx-auto mb-2 opacity-50" />
                      <p>No upcoming challenges</p>
                      <p className="text-sm mt-1">Challenge other teams to compete!</p>
                    </div>
                  )}
                  {userTeam && (
                    <div className="border-t border-gray-700 p-2 bg-gray-800/50">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs text-gray-400 hover:text-white hover:bg-gray-700/50"
                      >
                        View All Challenges
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DarkThemeProvider>
  );
};

export default ChallengeDashboard;
