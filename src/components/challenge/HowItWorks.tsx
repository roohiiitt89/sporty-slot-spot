
import { motion } from 'framer-motion';

const steps = [
  {
    title: 'Create or Join a Team',
    description: 'Form your own team or join an existing one to get started.',
    icon: '👥'
  },
  {
    title: 'Challenge Other Teams',
    description: 'Find opponents and set up matches at your preferred venues and times.',
    icon: '⚔️'
  },
  {
    title: 'Win & Climb the Leaderboard',
    description: 'Earn XP and rise through the ranks by winning your matches.',
    icon: '🏆'
  }
];

export const HowItWorks = () => {
  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
        How Challenge Mode Works
      </h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <div className="text-4xl mb-3">{step.icon}</div>
            <h3 className="text-lg font-bold mb-2 text-emerald-400">
              {index + 1}. {step.title}
            </h3>
            <p className="text-gray-300">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
