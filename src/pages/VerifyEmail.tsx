
import React from 'react';
import { Mail } from 'lucide-react';
import Header from '../components/Header';

const VerifyEmail: React.FC = () => {
  return (
    <div className="min-h-screen bg-sport-gray-light">
      <Header />
      
      <div className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-sport-green bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-10 w-10 text-sport-green" />
              </div>
              
              <h1 className="text-3xl font-bold text-sport-gray-dark mb-4">Check Your Email</h1>
              
              <p className="text-sport-gray mb-6">
                We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
              </p>
              
              <div className="bg-sport-gray-light p-4 rounded-md mb-6">
                <p className="text-sm text-sport-gray">
                  If you don't see the email, check your spam folder or click the button below to request a new verification link.
                </p>
              </div>
              
              <button
                className="mb-4 w-full py-3 px-4 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors font-semibold"
                onClick={() => window.location.reload()}
              >
                Request New Link
              </button>
              
              <p className="text-sport-gray-dark">
                <a href="/login" className="text-sport-green hover:underline">
                  Return to Login
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sport-gray">&copy; 2025 SportySlot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default VerifyEmail;
