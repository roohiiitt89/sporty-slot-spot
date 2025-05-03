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
  Flag,
  ArrowLeft,
  Swords,
  Zap,
  Shield,
  BarChart2,
  Clock
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
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Button>

        <header className="mb-10 text-center relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-8 left-1/2 transform -translate-x-1/2"
          >
            <Swords className="w-16 h-16 text-emerald-400/20" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300"
          >
            Challenge Arena
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 max-w-3xl mx-auto text-lg"
          >
            Prove your team's dominance in competitive battles. Challenge rivals, track your progress, and climb to the top!
          </motion.p>
        </header>
        
        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-800 text-red-300">
            <AlertTitle className="flex items-center justify-between">
              <span>Battle Station Malfunction</span>
              <button 
                onClick={handleRefresh} 
                className="p-1 hover:bg-red-800/30 rounded-full"
                title="Refresh data"
              >
                <RefreshCcw size={16} />
              </button>
            </AlertTitle>
            <AlertDescription>
              {error}. Recalibrating systems... Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 mb-8 relative overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl"></div>
              <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-teal-400/10 rounded-full blur-xl"></div>
              
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Zap className="text-emerald-400" size={24} />
                  Welcome to the Arena!
                </h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-1"
                >
                  <RefreshCcw size={16} /> Refresh
                </Button>
              </div>
              <p className="text-gray-300 mb-6 text-lg">
                The Challenge Arena is where teams prove their worth. Engage in strategic battles, 
                earn glory, and establish your legacy on the leaderboard.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-5 rounded-xl flex flex-col items-center transition-all hover:border-emerald-400/30"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-900/20 flex items-center justify-center mb-3 border border-emerald-400/20">
                    <Swords className="text-emerald-400" size={28} />
                  </div>
                  <h3 className="font-bold mb-2 text-lg">Compete</h3>
                  <p className="text-sm text-center text-gray-400">Challenge rivals in strategic battles</p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-5 rounded-xl flex flex-col items-center transition-all hover:border-emerald-400/30"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-900/20 flex items-center justify-center mb-3 border border-emerald-400/20">
                    <BarChart2 className="text-emerald-400" size={28} />
                  </div>
                  <h3 className="font-bold mb-2 text-lg">Earn XP</h3>
                  <p className="text-sm text-center text-gray-400">Gain experience and level up</p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-5 rounded-xl flex flex-col items-center transition-all hover:border-emerald-400/30"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-900/20 flex items-center justify-center mb-3 border border-emerald-400/20">
                    <Shield className="text-emerald-400" size={28} />
                  </div>
                  <h3 className="font-bold mb-2 text-lg">Team Up</h3>
                  <p className="text-sm text-center text-gray-400">Build your ultimate squad</p>
                </motion.div>
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
              <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300 flex items-center justify-center gap-2">
                <Shield size={24} />
                Your Warrior Profile
              </h2>
              <ProfileCard />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300 flex items-center gap-2">
                  <Trophy size={20} />
                  Elite Teams
                </h2>
              </div>
              
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                {topTeams.length > 0 ? (
                  <div className="divide-y divide-gray-700">
                    {topTeams.map((team, index) => (
                      <motion.div 
                        key={team.id}
                        whileHover={{ x: 5 }}
                        className="p-3 hover:bg-gray-700/30 transition-colors flex items-center cursor-pointer group"
                        onClick={() => navigate(`/team/${team.slug}`)}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold 
                          ${index === 0 ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 
                            index === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' : 
                              index === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' : 
                              'bg-gray-700 text-gray-400 border border-gray-600'}`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium group-hover:text-emerald-300 transition-colors">{team.name}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1">
                              <span className="text-green-400">{team.wins}W</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-red-400">{team.losses}L</span>
                            </span>
                          </div>
                        </div>
                        <div className="bg-emerald-900/40 text-emerald-400 rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1">
                          <span>{team.xp}</span>
                          <span className="text-xs">XP</span>
                        </div>
                        <ChevronRight size={16} className="ml-2 text-gray-500 group-hover:text-white transition-colors" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-400">
                    No teams found in the arena
                  </div>
                )}
                <div className="border-t border-gray-700 p-2 bg-gray-800/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs text-gray-400 hover:text-white hover:bg-gray-700/50 flex items-center justify-center gap-1"
                    onClick={() => navigate('/leaderboard')}
                  >
                    View Full Leaderboard
                    <ChevronRight size={14} />
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
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300 flex items-center gap-2">
                    <Flag size={20} />
                    Scheduled Battles
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
                        <motion.div 
                          key={challenge.id}
                          whileHover={{ x: 5 }}
                          className="p-4 hover:bg-gray-700/30 transition-colors cursor-pointer"
                          onClick={() => navigate(`/challenge/${challenge.id}`)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium flex items-center gap-2">
                              <Swords size={16} className="text-emerald-400" />
                              <span className="text-emerald-300">{challenge.challenger_team.name}</span>
                              <span className="text-gray-400 mx-1">vs</span>
                              <span className="text-amber-300">{challenge.opponent_team.name}</span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium
                              ${challenge.status === 'pending' ? 'bg-yellow-900/20 text-yellow-300 border border-yellow-800/30' : 
                                challenge.status === 'accepted' ? 'bg-green-900/20 text-green-300 border border-green-800/30' : 
                                'bg-red-900/20 text-red-300 border border-red-800/30'}`}>
                              {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Clock size={14} className="opacity-70" />
                              <span>{new Date(challenge.booking_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>{challenge.start_time} - {challenge.end_time}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400">
                      <Flag size={24} className="mx-auto mb-3 opacity-50" />
                      <p>No battles scheduled</p>
                      <p className="text-sm mt-1">Issue a challenge to prove your might!</p>
                    </div>
                  )}
                  {userTeam && (
                    <div className="border-t border-gray-700 p-2 bg-gray-800/50">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs text-gray-400 hover:text-white hover:bg-gray-700/50 flex items-center justify-center gap-1"
                        onClick={() => navigate('/challenges')}
                      >
                        View All Battles
                        <ChevronRight size={14} />
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
