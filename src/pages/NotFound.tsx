import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      {/* Sports balls illustration using simple emojis */}
      <div className="flex gap-8 mb-8 text-4xl animate-bounce">
        <span className="animate-[bounce_1s_infinite_0.1s]">🏀</span>
        <span className="animate-[bounce_1s_infinite_0.2s]">⚽</span>
        <span className="animate-[bounce_1s_infinite_0.3s]">🎾</span>
      </div>

      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold mb-4 text-gray-800">404</h1>
        <p className="text-2xl text-gray-600 mb-6 animate-pulse">
          Oops! Page not found
        </p>
        
        <div className="bg-gray-100 p-3 rounded-lg mb-8">
          <code className="text-gray-800 font-mono">
            {location.pathname}
          </code>
        </div>
        
        <a
          href="/"
          className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-full transition-colors shadow-md hover:shadow-lg"
        >
          Return to Home
        </a>

        <p className="mt-8 text-gray-400 text-sm">
          Keep playing, keep scoring!
        </p>
      </div>
    </div>
  );
};

export default NotFound;
