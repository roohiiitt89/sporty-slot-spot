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
  Zap,
  ChevronRight
} from 'lucide-react';

export const getLevelTitle = (level: number): string => {
  const titles = [
    { threshold: 5, title: 'Novice Warrior' },
    { threshold: 10, title: 'Battle-Tested' },
    { threshold: 15, title: 'Elite Champion' },
    { threshold: 20, title: 'Legendary Gladiator' },
    { threshold: Infinity, title: 'Mythic Overlord' }
  ];
  return titles.find(t => level < t.threshold)?.title || 'Mythic Overlord';
};

export const getXpForNextLevel = (level: number): number => {
  return Math.pow(level, 2) * 100;
};

export const getRankColor = (level: number) => {
  const ranks = [
    { threshold: 5, bg: 'bg-gray-600/20', text: 'text-gray-300', border: 'border-gray-500', glow: 'shadow-gray-500/20' },
    { threshold: 10, bg: 'bg-blue-600/20', text: 'text-blue-400', border: 'border-blue-500', glow: 'shadow-blue-500/20' },
    { threshold: 15, bg: 'bg-emerald-600/20', text: 'text-emerald-400', border: 'border-emerald-500', glow: 'shadow-emerald-500/20' },
    { threshold: 20, bg: 'bg-purple-600/20', text: 'text-purple-400', border: 'border-purple-500', glow: 'shadow-purple-500/20' },
    { threshold: Infinity, bg: 'bg-amber-600/20', text: 'text-amber-400', border: 'border-amber-500', glow: 'shadow-amber-500/20' }
  ];
  return ranks.find(r => level < r.threshold) || ranks[ranks.length - 1];
};

export const ProfileCard = () => {
  const { profile, loading, fetchprofile, updateProfileName } = useChallengeMode();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    fetchprofile();
  }, []);

  useEffect(() => {
    if (profile && !profile.profile_name) {
      setShowNameDialog(true);
    }
  }, [profile]);

  const handleSaveProfileName = async () => {
    if (!profileName.trim()) {
      toast({
        title: "Warrior name required",
        description: "You must have a name to enter the arena",
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
        title: "Warrior christened!",
        description: "Your name echoes through the arena halls",
      });
    } else {
      toast({
        title: "Battlefield error",
        description: "The scribes failed to record your name. Try again!",
        variant: "destructive"
      });
    }
  };

  if (loading || !profile) {
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

  const levelTitle = getLevelTitle(profile.level);
  const nextLevelXp = getXpForNextLevel(profile.level);
  const progressPercentage = (profile.xp / nextLevelXp) * 100;
  const rankColors = getRankColor(profile.level);
  const winRate = profile.wins + profile.losses > 0 
    ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
    : 0;

  const copyProfileLink = () => {
    const profileLink = `${window.location.origin}/player/${profile.id}`;
    navigator.clipboard.writeText(profileLink);
    setCopied(true);
    toast({
      title: "Battle standard copied!",
      description: "Share your warrior profile with allies",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditProfile = () => {
    setProfileName(profile.profile_name || '');
    setShowNameDialog(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`bg-gradient-to-br from-gray-900 to-gray-800/50 ${rankColors.border} border rounded-xl p-6 shadow-lg relative overflow-hidden ${rankColors.glow}`}
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
              {profile.profile_name ? 
                profile.profile_name.substring(0, 2).toUpperCase() : 
                <Swords size={24} className="opacity-80" />}
            </motion.div>
            <div className="ml-4">
              <div className="flex items-center">
                <h3 className={`font-bold text-xl ${rankColors.text}`}>
                  {profile.profile_name || 'Unnamed Warrior'}
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
                {levelTitle} • Level {profile.level}
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
              {profile.xp} / {nextLevelXp} XP
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
          <div className={`bg-gray-900/30 border ${rankColors.border} rounded-lg p-3 text-center group hover:bg-gray-800/50 transition-colors`}>
            <div className="text-green-400 text-xl font-bold flex items-center justify-center group-hover:text-green-300 transition-colors">
              <Swords size={18} className="mr-1" /> {profile.wins}
            </div>
            <div className="text-xs text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">Victories</div>
          </div>
          <div className={`bg-gray-900/30 border ${rankColors.border} rounded-lg p-3 text-center group hover:bg-gray-800/50 transition-colors`}>
            <div className="text-red-400 text-xl font-bold flex items-center justify-center group-hover:text-red-300 transition-colors">
              <Skull size={18} className="mr-1" /> {profile.losses}
            </div>
            <div className="text-xs text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">Defeats</div>
          </div>
          <div className={`bg-gray-900/30 border ${rankColors.border} rounded-lg p-3 text-center group hover:bg-gray-800/50 transition-colors`}>
            <div className="text-gray-300 text-xl font-bold flex items-center justify-center group-hover:text-white transition-colors">
              <Shield size={18} className="mr-1" /> {profile.draws}
            </div>
            <div className="text-xs text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">Standoffs</div>
          </div>
          <div className={`bg-gray-900/30 border ${rankColors.border} rounded-lg p-3 text-center group hover:bg-gray-800/50 transition-colors`}>
            <div className="text-amber-400 text-xl font-bold flex items-center justify-center group-hover:text-amber-300 transition-colors">
              <BarChart2 size={18} className="mr-1" /> {winRate}%
            </div>
            <div className="text-xs text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">Win Rate</div>
          </div>
        </div>

        {/* View full profile button */}
        <motion.button
          whileHover={{ x: 5 }}
          onClick={() => window.location.href = `/player/${profile.id}`}
          className={`w-full mt-6 py-2 px-4 rounded-lg flex items-center justify-center ${rankColors.bg} ${rankColors.border} border hover:opacity-90 transition-opacity`}
        >
          <span className={`text-sm font-medium ${rankColors.text}`}>View Full Battle Profile</span>
          <ChevronRight size={16} className={`ml-2 ${rankColors.text}`} />
        </motion.button>
      </motion.div>

      {/* Edit Profile Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="bg-gray-800 border border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
              <Swords size={20} />
              {profile.profile_name ? 'Edit Warrior Name' : 'Claim Your Warrior Identity'}
            </DialogTitle>
          </DialogHeader>
          
          {!profile.profile_name && (
            <p className="text-gray-300 text-center px-4">
              Choose a mighty name to represent you in the Challenge Arena!
            </p>
          )}
          
          <div className="mt-6 px-4">
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-400 mb-2">
              Warrior Name
            </label>
            <Input
              id="profile-name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Enter your warrior name"
              className="bg-gray-900 border-gray-700 text-white text-center text-lg py-5 font-medium"
              autoFocus
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Max 20 characters. Choose wisely!
            </p>
          </div>
          
          <DialogFooter className="mt-6 px-4 pb-4">
            {profile.profile_name && (
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
              className={`bg-gradient-to-r ${rankColors.text.replace('text', 'from')} to-teal-600 hover:opacity-90 min-w-[120px]`}
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Carving Stone...
                </span>
              ) : 'Claim Name'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
