import React from 'react';
import { Mail } from 'lucide-react';
import Header from '../components/Header';
import { useIsMobile } from '@/hooks/use-mobile';

const VerifyEmail: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-navy-dark to-indigo/30">
      <Header />
      
      <div className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto backdrop-blur-sm bg-white/10 rounded-xl shadow-xl overflow-hidden border border-white/20">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-indigo-light bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-10 w-10 text-indigo-light" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">Check Your Email</h1>
              
              <p className="text-gray-300 mb-6">
                We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
              </p>
              
              <div className="bg-navy-light/50 backdrop-blur-sm p-4 rounded-md mb-6 border border-indigo/20">
                <p className="text-sm text-gray-300">
                  If you don't see the email, check your spam folder or click the button below to request a new verification link.
                </p>
              </div>
              
              <button
                className="mb-4 w-full py-3 px-4 bg-gradient-to-r from-indigo to-indigo-dark text-white rounded-md hover:from-indigo-dark hover:to-indigo transition-all font-semibold transform hover:scale-[1.02] shadow-lg"
                onClick={() => window.location.reload()}
              >
                Request New Link
              </button>
              
              <p className="text-gray-300">
                <a href="/login" className="text-indigo-light hover:text-white hover:underline transition-colors">
                  Return to Login
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-navy-dark/50 backdrop-blur-sm py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; 2025 Grid2Play. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default VerifyEmail;
