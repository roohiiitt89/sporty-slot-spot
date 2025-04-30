
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Team } from '@/types/challenge';
import { useChallengeMode } from '@/hooks/use-challenge-mode';
import { Badge } from '@/components/ui/badge';

export const LeaderboardPreview = () => {
  const { topTeams, fetchTopTeams } = useChallengeMode();
  
  useEffect(() => {
    fetchTopTeams(5);
  }, []);

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
        Top Teams
      </h2>
      
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 bg-gray-800 border-b border-gray-700 grid grid-cols-12 text-sm font-medium text-gray-400">
          <div className="col-span-1">Rank</div>
          <div className="col-span-5">Team</div>
          <div className="col-span-2 text-center">XP</div>
          <div className="col-span-4 text-center">W / D / L</div>
        </div>
        
        {topTeams.length > 0 ? (
          <div className="divide-y divide-gray-700">
            {topTeams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="grid grid-cols-12 p-4 hover:bg-gray-750 transition-colors"
              >
                <div className="col-span-1 flex items-center">
                  {index === 0 ? (
                    <span className="text-xl">🥇</span>
                  ) : index === 1 ? (
                    <span className="text-xl">🥈</span>
                  ) : index === 2 ? (
                    <span className="text-xl">🥉</span>
                  ) : (
                    <span className="text-gray-400 font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="col-span-5 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center mr-3 text-xs font-bold">
                    {team.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{team.name}</div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-center">
                  <Badge variant="outline" className="bg-emerald-900/40 text-emerald-400 border-emerald-600/50">
                    {team.xp} XP
                  </Badge>
                </div>
                <div className="col-span-4 flex items-center justify-center space-x-3 text-sm">
                  <span className="text-green-400">{team.wins}W</span>
                  <span className="text-gray-400">{team.draws}D</span>
                  <span className="text-red-400">{team.losses}L</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400">
            No teams found. Be the first to create a team and start competing!
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <motion.a 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="/challenge/leaderboard"
          className="text-emerald-400 hover:text-emerald-300 text-sm inline-flex items-center"
        >
          View Full Leaderboard
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.a>
      </div>
    </div>
  );
};
