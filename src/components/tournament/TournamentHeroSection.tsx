
import { motion } from "framer-motion";

export function TournamentHeroSection() {
  return (
    <div className="relative bg-gradient-to-b from-primary to-primary/70 text-primary-foreground overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10">
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
      
      <div className="container relative z-10 py-20 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Tournaments</h1>
          <p className="text-xl opacity-90 mb-8">
            Join exciting sports tournaments, compete with other players and teams, and win prizes!
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center flex-1 max-w-xs"
            >
              <div className="text-4xl font-bold mb-2">Join</div>
              <p>Register for upcoming tournaments and compete with other teams</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center flex-1 max-w-xs"
            >
              <div className="text-4xl font-bold mb-2">Compete</div>
              <p>Participate in matches with teams across various skill levels</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center flex-1 max-w-xs"
            >
              <div className="text-4xl font-bold mb-2">Win</div>
              <p>Claim victory and prizes in your favorite sports</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
