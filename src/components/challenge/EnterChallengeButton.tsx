
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

export const EnterChallengeButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);

  const handleEnterChallengeMode = () => {
    navigate('/challenge');
  };

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="my-6"
    >
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          className={`bg-gradient-to-r from-emerald-500 to-teal-700 hover:from-emerald-600 hover:to-teal-800 text-white font-bold py-3 px-8 rounded-xl shadow-lg transform transition-all duration-300 ${
            isHovering ? 'shadow-emerald-400/50' : ''
          }`}
          size="lg"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={handleEnterChallengeMode}
        >
          <Trophy className="mr-2" /> Enter Challenge Mode
        </Button>
      </motion.div>
    </motion.div>
  );
};
