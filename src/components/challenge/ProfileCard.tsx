import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChallengeMode } from '@/hooks/use-challenge-mode';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

export const getLevelTitle = (level: number): string => {
  if (level < 5) return 'Rookie';
  if (level < 10) return 'Regular';
  if (level < 15) return 'Pro';
  if (level < 20) return 'Beast';
  return 'Mastermind';
};

export const getXpForNextLevel = (level: number): number => {
  return level * 100;
};

export const ProfileCard = () => {
  const { playerProfile, loading, fetchPlayerProfile } = useChallengeMode();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    fetchPlayerProfile();
  }, []);

  if (loading || !playerProfile) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 animate-pulse">
        <div className="flex items-center mb-4">
          <div className="w-14 h-14 rounded-full bg-gray-700"></div>
          <div className="ml-4">
            <div className="h-5 w-32 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-20 bg-gray-700 rounded"></div>
          </div>
        </div>
        <div className="h-4 w-full bg-gray-700 rounded mb-4"></div>
        <div className="h-12 w-full bg-gray-700 rounded"></div>
      </div>
    );
  }

  const levelTitle = getLevelTitle(playerProfile.level);
  const nextLevelXp = getXpForNextLevel(playerProfile.level);
  const progressPercentage = (playerProfile.xp / nextLevelXp) * 100;
  
  const getBorderColor = () => {
    if (playerProfile.level < 5) return 'border-gray-600';
    if (playerProfile.level < 10) return 'border-blue-600';
    if (playerProfile.level < 15) return 'border-emerald-600';
    if (playerProfile.level < 20) return 'border-purple-600';
    return 'border-amber-600';
  };
  
  const getGlowColor = () => {
    if (playerProfile.level < 5) return '';
    if (playerProfile.level < 10) return 'shadow-blue-500/30';
    if (playerProfile.level < 15) return 'shadow-emerald-500/30';
    if (playerProfile.level < 20) return 'shadow-purple-500/30';
    return 'shadow-amber-500/30';
  };

  const getTextColor = () => {
    if (playerProfile.level < 5) return 'text-white';
    if (playerProfile.level < 10) return 'text-blue-400';
    if (playerProfile.level < 15) return 'text-emerald-400';
    if (playerProfile.level < 20) return 'text-purple-400';
    return 'text-amber-400';
  };

  const copyProfileLink = () => {
    const profileLink = `${window.location.origin}/player/${playerProfile.id}`;
    navigator.clipboard.writeText(profileLink);
    setCopied(true);
    toast({
      title: "Profile link copied!",
      description: "Share your profile with friends.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-gray-800 border ${getBorderColor()} rounded-xl p-6 shadow-lg ${getGlowColor()}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-14 h-14 rounded-full bg-gray-700 ${getTextColor()} font-bold text-xl`}>
            {playerProfile.profile_name ? playerProfile.profile_name.substring(0, 2).toUpperCase() : 'P'}
          </div>
          <div className="ml-4">
            <h3 className="font-bold text-lg">{playerProfile.profile_name || 'Player'}</h3>
            <div className={`flex items-center ${getTextColor()} text-sm font-medium`}>
              {levelTitle} • Level {playerProfile.level}
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={copyProfileLink}
          className="text-gray-400 hover:text-white"
          title="Copy Profile Link"
        >
          {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          )}
        </motion.button>
      </div>

      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-400">XP Progress</span>
        <span className="text-gray-300">{playerProfile.xp} / {nextLevelXp}</span>
      </div>
      <Progress 
        value={progressPercentage} 
        className="h-2 mb-4 bg-gray-700"
        indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-600" 
      />
      
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-2">
          <div className="text-green-400 text-lg font-bold">{playerProfile.wins}</div>
          <div className="text-xs text-gray-400">Wins</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-2">
          <div className="text-gray-300 text-lg font-bold">{playerProfile.draws}</div>
          <div className="text-xs text-gray-400">Draws</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-2">
          <div className="text-red-400 text-lg font-bold">{playerProfile.losses}</div>
          <div className="text-xs text-gray-400">Losses</div>
        </div>
      </div>
    </motion.div>
  );
};
