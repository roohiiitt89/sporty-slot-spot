import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChallengeMode } from '@/hooks/use-challenge-mode';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Swords,
  Copy,
  Check,
  Edit,
  Trophy,
  Skull,
  Shield,
  BarChart2,
  Zap
} from 'lucide-react';

export const getLevelTitle = (level: number): string => {
  if (level < 5) return 'Novice Warrior';
  if (level < 10) return 'Battle-Tested';
  if (level < 15) return 'Elite Champion';
  if (level < 20) return 'Legendary Gladiator';
  return 'Mythic Overlord';
};

export const getXpForNextLevel = (level: number): number => {
  return level * 100;
};

export const getRankColor = (level: number) => {
  if (level < 5) return { bg: 'bg-gray-600', text: 'text-gray-300', border: 'border-gray-500' };
  if (level < 10) return { bg: 'bg-blue-600/20', text: 'text-blue-400', border: 'border-blue-500' };
  if (level < 15) return { bg: 'bg-emerald-600/20', text: 'text-emerald-400', border: 'border-emerald-500' };
  if (level < 20) return { bg: 'bg-purple-600/20', text: 'text-purple-400', border: 'border-purple-500' };
  return { bg: 'bg-amber-600/20', text: 'text-amber-400', border: 'border-amber-500' };
};

export const ProfileCard = () => {
  const { playerProfile, loading, fetchPlayerProfile, updateProfileName } = useChallengeMode();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    fetchPlayerProfile();
  }, []);

  useEffect(() => {
    if (playerProfile && !playerProfile.profile_name) {
      setShowNameDialog(true);
    }
  }, [playerProfile]);

  const handleSaveProfileName = async () => {
    if (!profileName.trim()) {
      toast({
        title: "Profile name required",
        description: "Please enter a name for your profile",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    const success = await updateProfileName(profileName);
    setSaving(false);
    
    if (success) {
      setShowNameDialog(false);
      toast({
        title: "Profile updated",
        description: "Your warrior name has been set!",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading || !playerProfile) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 animate-pulse">
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
  const rankColors = getRankColor(playerProfile.level);
  
  const copyProfileLink = () => {
    const profileLink = `${window.location.origin}/player/${playerProfile.id}`;
    navigator.clipboard.writeText(profileLink);
    setCopied(true);
    toast({
      title: "Battle Profile Copied!",
      description: "Share your warrior profile with allies.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditProfile = () => {
    setProfileName(playerProfile.profile_name || '');
    setShowNameDialog(true);
  };

  const winRate = playerProfile.wins + playerProfile.losses > 0 
    ? Math.round((playerProfile.wins / (playerProfile.wins + playerProfile.losses)) * 100
    : 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`bg-gradient-to-br from-gray-900 to-gray-800/50 ${rankColors.border} border rounded-xl p-6 shadow-lg relative overflow-hidden`}
      >
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl"></div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-teal-400/10 rounded-full blur-xl"></div>
        
        {/* Profile header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              onClick={handleEditProfile}
              className={`flex items-center justify-center w-16 h-16 rounded-full ${rankColors.bg} ${rankColors.border} border-2 font-bold text-2xl cursor-pointer hover:opacity-90 shadow-lg`}
              title="Edit warrior profile"
            >
              {playerProfile.profile_name ? 
                playerProfile.profile_name.substring(0, 2).toUpperCase() : 
                <Swords size={24} className="opacity-80" />}
            </motion.div>
            <div className="ml-4">
              <div className="flex items-center">
                <h3 className={`font-bold text-xl ${rankColors.text}`}>
                  {playerProfile.profile_name || 'Unnamed Warrior'}
                </h3>
                <button
                  onClick={handleEditProfile}
                  className="ml-2 opacity-50 hover:opacity-100"
                  title="Edit profile"
                >
                  <Edit size={16} className={rankColors.text} />
                </button>
              </div>
              <div className={`flex items-center text-sm font-medium ${rankColors.text}`}>
                <Trophy size={14} className="mr-1" />
                {levelTitle} • Level {playerProfile.level}
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyProfileLink}
            className="text-gray-400 hover:text-white p-1"
            title="Copy Battle Profile Link"
          >
            {copied ? (
              <Check size={18} className="text-emerald-400" />
            ) : (
              <Copy size={18} />
            )}
          </motion.button>
        </div>

        {/* XP Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400 flex items-center">
              <Zap size={14} className="mr-1" /> Battle XP
            </span>
            <span className="text-gray-300">
              {playerProfile.xp} / {nextLevelXp} XP
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-gray-700/50"
            indicatorClassName={`bg-gradient-to-r ${rankColors.text.replace('text', 'from')} to-teal-500`} 
          />
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3 mt-6">
          <div className={`bg-gray-900/30 border ${rankColors.border} rounded-lg p-3 text-center`}>
            <div className="text-green-400 text-xl font-bold flex items-center justify-center">
              <Swords size={18} className="mr-1" /> {playerProfile.wins}
            </div>
            <div className="text-xs text-gray-400 mt-1">Victories</div>
          </div>
          <div className={`bg-gray-900/30 border ${rankColors.border} rounded-lg p-3 text-center`}>
            <div className="text-red-400 text-xl font-bold flex items-center justify-center">
              <Skull size={18} className="mr-1" /> {playerProfile.losses}
            </div>
            <div className="text-xs text-gray-400 mt-1">Defeats</div>
          </div>
          <div className={`bg-gray-900/30 border ${rankColors.border} rounded-lg p-3 text-center`}>
            <div className="text-gray-300 text-xl font-bold flex items-center justify-center">
              <Shield size={18} className="mr-1" /> {playerProfile.draws}
            </div>
            <div className="text-xs text-gray-400 mt-1">Standoffs</div>
          </div>
          <div className={`bg-gray-900/30 border ${rankColors.border} rounded-lg p-3 text-center`}>
            <div className="text-amber-400 text-xl font-bold flex items-center justify-center">
              <BarChart2 size={18} className="mr-1" /> {winRate}%
            </div>
            <div className="text-xs text-gray-400 mt-1">Win Rate</div>
          </div>
        </div>
      </motion.div>

      {/* Edit Profile Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="bg-gray-800 border border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
              <Swords size={20} />
              {playerProfile.profile_name ? 'Edit Warrior Name' : 'Claim Your Warrior Identity'}
            </DialogTitle>
          </DialogHeader>
          
          {!playerProfile.profile_name && (
            <p className="text-gray-300 text-center">
              Choose a mighty name to represent you in the Challenge Arena!
            </p>
          )}
          
          <div className="mt-6">
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-400 mb-2">
              Warrior Name
            </label>
            <Input
              id="profile-name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Enter your warrior name"
              className="bg-gray-900 border-gray-700 text-white text-center text-lg py-5"
              autoFocus
            />
          </div>
          
          <DialogFooter className="mt-4">
            {playerProfile.profile_name && (
              <Button 
                onClick={() => setShowNameDialog(false)} 
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 mr-2"
              >
                Cancel
              </Button>
            )}
            <Button 
              onClick={handleSaveProfileName}
              disabled={saving || !profileName.trim()}
              className={`bg-gradient-to-r ${rankColors.text.replace('text', 'from')} to-teal-600 hover:opacity-90`}
            >
              {saving ? 'Carving Stone...' : 'Claim Name'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
