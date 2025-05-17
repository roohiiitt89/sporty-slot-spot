import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Trophy, Sword } from 'lucide-react';
import NewAIChatWidget from '@/components/NewAIChatWidget';

export default function MorePage() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-dark to-navy-light text-white flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">More</h1>
      <div className="w-full max-w-md space-y-6">
        {/* Chat Assistant Card */}
        <div className="bg-card border border-navy rounded-xl p-6 flex flex-col items-center shadow-lg">
          <MessageCircle className="w-10 h-10 text-indigo mb-3" />
          <h2 className="text-xl font-semibold mb-2">Chat-assistant</h2>
          <p className="text-muted-foreground mb-4 text-center">Get instant help, ask questions, or chat with our AI assistant for support and guidance.</p>
          <button onClick={() => setIsChatOpen(true)} className="bg-indigo text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-dark transition">Open Chat</button>
        </div>
        {/* Tournament Section Card */}
        <div className="bg-card border border-navy rounded-xl p-6 flex flex-col items-center shadow-lg">
          <Trophy className="w-10 h-10 text-yellow-400 mb-3" />
          <h2 className="text-xl font-semibold mb-2">Tournament Section</h2>
          <p className="text-muted-foreground mb-4 text-center">Browse, join, or host tournaments. View fixtures, results, and more in our tournament hub.</p>
          <button onClick={() => navigate('/tournaments')} className="bg-yellow-400 text-navy px-6 py-2 rounded-lg font-medium hover:bg-yellow-500 transition">Go to Tournaments</button>
        </div>
        {/* Challenge Mode Card */}
        <div className="bg-card border border-navy rounded-xl p-6 flex flex-col items-center shadow-lg">
          <Sword className="w-10 h-10 text-emerald-400 mb-3" />
          <h2 className="text-xl font-semibold mb-2">Challenge Mode</h2>
          <p className="text-muted-foreground mb-4 text-center">Create or join a team, challenge rivals, and climb the leaderboard in our competitive arena.</p>
          <button onClick={() => navigate('/challenge')} className="bg-emerald-400 text-navy px-6 py-2 rounded-lg font-medium hover:bg-emerald-500 transition">Enter Challenge Mode</button>
        </div>
      </div>
      {/* Chat Widget Modal */}
      <NewAIChatWidget isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
    </div>
  );
} 
