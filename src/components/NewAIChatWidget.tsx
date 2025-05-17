
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, X, Send, Info, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: number;
}

const NewAIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "👋 Hi there! I'm your AI sports assistant. How can I help you today?",
      type: 'ai',
      timestamp: Date.now(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      type: 'user',
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsTyping(true);
    
    // Simulate AI response
    setTimeout(() => {
      const responseOptions = [
        "I can help you find sports venues near you! Would you like to search by location or sport type?",
        "Great question! Our most popular sports are basketball, tennis, and football. Would you like to book a court?",
        "You can book a venue directly through our app. Just search for available slots and choose a time that works for you.",
        "We have special discounts for regular members. Would you like to learn more about our membership options?",
        "I'd recommend checking out our new courts at Central Park. They were just renovated last month!",
      ];
      
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        content: responseOptions[Math.floor(Math.random() * responseOptions.length)],
        type: 'ai',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-indigo text-white p-4 rounded-full shadow-lg hover:bg-indigo-dark transition-colors z-50 flex items-center justify-center"
      >
        <Bot className="w-6 h-6" />
      </button>
      
      {/* Chat modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 w-80 sm:w-96 bg-navy-light border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 32px)' }}
          >
            {/* Header */}
            <div className="bg-indigo p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Bot className="w-6 h-6 mr-2 text-white" />
                <h3 className="text-white font-bold">Sports Assistant</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Chat content */}
            <div className="flex-1 overflow-y-auto p-4 bg-navy-dark">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`mb-4 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3/4 rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-indigo text-white'
                        : 'bg-navy-light text-white'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex mb-4">
                  <div className="max-w-3/4 bg-navy-light text-white rounded-lg p-3">
                    <div className="flex space-x-2">
                      <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse"></span>
                      <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse delay-150"></span>
                      <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse delay-300"></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input area */}
            <div className="p-3 bg-navy">
              <div className="flex items-center">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-navy-light text-white border border-gray-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo resize-none"
                  rows={1}
                  style={{ minHeight: '40px', maxHeight: '100px' }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className={`ml-2 p-2 rounded-full ${
                    inputValue.trim()
                      ? 'bg-indigo hover:bg-indigo-dark text-white'
                      : 'bg-gray-700 text-gray-400'
                  } transition-colors`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-3 py-2 bg-navy-dark/80 border-t border-gray-700 flex justify-between items-center text-xs text-gray-400">
              <div className="flex items-center">
                <Info className="w-3 h-3 mr-1" />
                <span>Powered by AI</span>
              </div>
              {user ? (
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  <span>Logged in</span>
                </div>
              ) : (
                <button
                  onClick={() => {}}
                  className="text-indigo-light hover:text-indigo hover:underline"
                >
                  Login for history
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NewAIChatWidget;
