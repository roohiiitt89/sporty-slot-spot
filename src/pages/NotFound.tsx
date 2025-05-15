import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error - Route not found:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-blue-100 p-4">
      {/* Animated bouncing balls */}
      <div className="relative h-32 w-full max-w-xs mb-12">
        <div className="absolute left-1/4 animate-bounce">
          <div className="w-16 h-16 bg-orange-500 rounded-full shadow-lg flex items-center justify-center text-white text-2xl">
            🏀
          </div>
        </div>
        <div className="absolute left-2/4 animate-bounce" style={{ animationDelay: '0.2s' }}>
          <div className="w-16 h-16 bg-green-600 rounded-full shadow-lg flex items-center justify-center text-white text-2xl">
            ⚽
          </div>
        </div>
        <div className="absolute left-3/4 animate-bounce" style={{ animationDelay: '0.4s' }}>
          <div className="w-16 h-16 bg-yellow-400 rounded-full shadow-lg flex items-center justify-center text-white text-2xl">
            🎾
          </div>
        </div>
      </div>

      <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
        <h1 className="text-8xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500">
          404
        </h1>
        <p className="text-3xl font-semibold text-gray-800 mb-4">
          Game Over!
        </p>
        <p className="text-lg text-gray-600 mb-6">
          The page <span className="font-mono bg-gray-100 px-2 py-1 rounded">{location.pathname}</span> is out of bounds.
        </p>
        
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur opacity-75 group-hover:opacity-100 transition"></div>
          <a
            href="/"
            className="relative block bg-white text-green-600 font-bold px-8 py-3 rounded-full border-2 border-green-500 group-hover:text-white group-hover:bg-gradient-to-r from-green-500 to-blue-500 transition-all"
          >
            Back to Home Field
          </a>
        </div>

        <p className="mt-8 text-gray-400 text-sm italic">
          "Success is no accident. It's hard work, perseverance, learning..." - Pelé
        </p>
      </div>
    </div>
  );
};

export default NotFound;
