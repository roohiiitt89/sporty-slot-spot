
import { motion } from "framer-motion";
import { Trophy, Users, Medal, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TournamentHeroSectionProps {
  onBookNowClick?: () => void;
}

export function TournamentHeroSection({ onBookNowClick }: TournamentHeroSectionProps = {}) {
  const navigate = useNavigate();
  
  return (
    <div className="relative bg-gradient-to-b from-primary to-primary/80 text-primary-foreground overflow-hidden">
      {/* Back Button */}
      <button
        onClick={() => navigate("/tournaments")}
        className="absolute top-4 left-4 z-20 bg-white/70 hover:bg-white text-primary rounded-full p-2 shadow-lg transition-colors duration-200 flex items-center"
        style={{ backdropFilter: 'blur(6px)' }}
        aria-label="Back to Tournaments"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      
      {/* Animated Trophy Icon for mobile */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }} 
        animate={{ opacity: 0.15, y: 0 }} 
        transition={{ duration: 0.8 }}
        className="absolute left-1/2 top-8 -translate-x-1/2 z-0 md:hidden"
      >
        <Trophy className="w-32 h-32 text-yellow-300 drop-shadow-xl" />
      </motion.div>
      
      {/* Animated SVG background for desktop */}
      <div className="absolute inset-0 z-0 opacity-10 hidden md:block">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <line 
              key={i} 
              x1={i * 5} 
              y1="0" 
              x2={i * 5 + 100} 
              y2="100" 
              stroke="currentColor" 
              strokeWidth="0.5" 
            />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line 
              key={i + 20} 
              x1="0" 
              y1={i * 5} 
              x2="100" 
              y2={i * 5 + 100} 
              stroke="currentColor" 
              strokeWidth="0.5" 
            />
          ))}
        </svg>
      </div>
      
      <div className="container relative z-10 py-12 px-3 md:py-20 md:px-4 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl mx-auto text-center"
        >
          <div className="flex flex-col items-center gap-2 mb-4">
            <Trophy className="w-12 h-12 text-yellow-400 mb-1 hidden md:block" />
            <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight">Tournament Details</h1>
            <p className="text-base md:text-xl opacity-90 mb-2 md:mb-4 max-w-md mx-auto">
              Get ready to compete in this exciting tournament!
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-6 md:mt-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6 text-center flex flex-col items-center w-full max-w-xs"
            >
              <Users className="w-8 h-8 text-indigo mb-2" />
              <div className="text-lg font-bold mb-1">Register</div>
              <p className="text-sm md:text-base">Join this tournament and compete with teams</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6 text-center flex flex-col items-center w-full max-w-xs"
            >
              <Medal className="w-8 h-8 text-emerald-400 mb-2" />
              <div className="text-lg font-bold mb-1">Compete</div>
              <p className="text-sm md:text-base">Battle it out in matches across skill levels</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6 text-center flex flex-col items-center w-full max-w-xs"
            >
              <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
              <div className="text-lg font-bold mb-1">Win</div>
              <p className="text-sm md:text-base">Claim victory and earn your rewards</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
