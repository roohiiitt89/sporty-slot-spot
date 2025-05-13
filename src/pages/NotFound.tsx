import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Soccer, Tennis, Basketball } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Sports balls animation variants
  const ballVariants = {
    bounce: {
      y: [0, -30, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <motion.div 
        className="text-center p-8 max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated sports balls */}
        <div className="flex justify-center space-x-8 mb-8">
          <motion.div
            variants={ballVariants}
            animate="bounce"
            className="text-orange-500"
          >
            <Basketball size={48} />
          </motion.div>
          <motion.div
            variants={ballVariants}
            animate="bounce"
            transition={{ delay: 0.2 }}
            className="text-green-600"
          >
            <Soccer size={48} />
          </motion.div>
          <motion.div
            variants={ballVariants}
            animate="bounce"
            transition={{ delay: 0.4 }}
            className="text-yellow-500"
          >
            <Tennis size={48} />
          </motion.div>
        </div>

        <h1 className="text-6xl font-bold mb-4 text-gray-800">404</h1>
        <motion.p 
          className="text-2xl text-gray-600 mb-6"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          Oops! Page not found
        </motion.p>
        <p className="text-gray-500 mb-8">
          The page <span className="font-mono bg-gray-200 px-2 py-1 rounded">{location.pathname}</span> doesn't exist.
        </p>
        
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link 
            to="/" 
            className="inline-block bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Return to Home
          </Link>
        </motion.div>

        <motion.p 
          className="mt-8 text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Keep playing, keep scoring!
        </motion.p>
      </motion.div>
    </div>
  );
};

export default NotFound;
