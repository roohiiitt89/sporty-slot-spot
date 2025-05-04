
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useChallengeMode } from '@/hooks/use-challenge-mode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

export const TeamSection = () => {
  const { userTeam, loading, createTeam } = useChallengeMode();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast({
        title: "Team name required",
        description: "Please provide a name for your team.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Pass all three parameters to createTeam
      const result = await createTeam(teamName, '', teamDescription);
      if (result) {
        toast({
          title: "Team Created!",
          description: "Your team has been created successfully.",
        });
        setIsCreatingTeam(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to create team. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating team:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const viewTeam = () => {
    if (userTeam) {
      navigate(`/team/${userTeam.slug}`);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
          Your Team
        </h2>
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 animate-pulse flex flex-col items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-gray-700 mb-4"></div>
          <div className="h-6 w-40 bg-gray-700 rounded mb-3"></div>
          <div className="h-4 w-60 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (isCreatingTeam) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
          Create Your Team
        </h2>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <form onSubmit={handleCreateTeam}>
            <div className="mb-4">
              <label htmlFor="team-name" className="block text-sm font-medium text-gray-300 mb-1">
                Team Name*
              </label>
              <Input 
                id="team-name" 
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="Enter team name"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="team-description" className="block text-sm font-medium text-gray-300 mb-1">
                Team Description
              </label>
              <Textarea 
                id="team-description" 
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white h-24"
                placeholder="Describe your team (optional)"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsCreatingTeam(false)}
                disabled={submitting}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Team'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
        Your Team
      </h2>
      
      {userTeam ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
        >
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-xl font-bold mb-4">
              {userTeam.name.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="text-xl font-bold mb-1">{userTeam.name}</h3>
            {userTeam.description && (
              <p className="text-gray-300 text-center mb-3">{userTeam.description}</p>
            )}
            
            <div className="flex items-center space-x-6 my-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{userTeam.wins}</div>
                <div className="text-xs text-gray-400">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">{userTeam.draws}</div>
                <div className="text-xs text-gray-400">Draws</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{userTeam.losses}</div>
                <div className="text-xs text-gray-400">Losses</div>
              </div>
            </div>
            
            <div className="flex items-center mt-2">
              <div className="bg-emerald-900/40 text-emerald-400 rounded-full px-3 py-1 text-xs font-medium border border-emerald-600/30">
                {userTeam.xp} XP
              </div>
            </div>
            
            <Button 
              onClick={viewTeam}
              className="mt-6 bg-emerald-600 hover:bg-emerald-700"
            >
              View Team Details
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-8 border border-gray-700 flex flex-col items-center justify-center"
        >
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-xl font-bold mb-2">No Team Yet</h3>
          <p className="text-gray-300 text-center mb-6">
            Create your own team to start challenging others and earning XP!
          </p>
          <Button 
            onClick={() => setIsCreatingTeam(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Create Team
          </Button>
        </motion.div>
      )}
    </div>
  );
};
