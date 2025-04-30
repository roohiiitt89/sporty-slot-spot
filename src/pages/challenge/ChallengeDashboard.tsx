
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DarkThemeProvider } from '@/components/challenge/DarkThemeProvider';
import { HowItWorks } from '@/components/challenge/HowItWorks';
import { LeaderboardPreview } from '@/components/challenge/LeaderboardPreview';
import { TeamSection } from '@/components/challenge/TeamSection';
import { ProfileCard } from '@/components/challenge/ProfileCard';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

const ChallengeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      toast.error('Please log in to access Challenge Mode');
      navigate('/login', { state: { from: '/challenge' } });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <DarkThemeProvider>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
            Challenge Mode
          </h1>
          <p className="text-gray-300 max-w-3xl mx-auto">
            Create your team, challenge others, and climb the leaderboard in our competitive gaming environment.
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <HowItWorks />
            <TeamSection />
          </div>
          
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
                Your Profile
              </h2>
              <ProfileCard />
            </div>
            
            <LeaderboardPreview />
          </div>
        </div>
      </div>
    </DarkThemeProvider>
  );
};

export default ChallengeDashboard;
