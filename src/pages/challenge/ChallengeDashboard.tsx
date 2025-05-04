import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const ChallengeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <Lock className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Challenge Mode (Beta Development)
          </h2>
          <p className="text-gray-300 mb-6">
            This feature is currently under active development and not yet available to users.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Home
          </button>
        </div>
      </div>

      {/* Your existing challenge dashboard content */}
      <div className="blur-sm pointer-events-none">
        {/* ALL YOUR EXISTING CHALLENGE DASHBOARD CODE REMAINS HERE */}
        {/* This allows you to continue developing while users see a blurred version */}
      </div>
    </div>
  );
};

export default ChallengeDashboard;
