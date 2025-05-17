import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Phone } from 'lucide-react';
import Header from '../components/Header';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !phone || !password) {
      toast({
        title: "Missing information",
        description: "Please fill in all the required fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, { name, phone });

      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration successful",
          description: "Welcome to Grid2Play!",
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "There was an issue creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) {
      toast({
        title: "Google Sign-Up failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-navy-dark to-indigo/30 animate-gradient-x">
      <Header />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto backdrop-blur-sm bg-white/10 rounded-xl shadow-xl overflow-hidden border border-white/20 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-indigo-light bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <line x1="19" y1="8" x2="19" y2="14"></line>
                    <line x1="22" y1="11" x2="16" y2="11"></line>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white">Create Account</h1>
                <p className="text-gray-300 mt-2">Join Grid2Play today</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="group">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-1 transition-all duration-300 group-focus-within:text-indigo-light">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-indigo-light" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 w-full p-3 border bg-navy-light/50 border-indigo/30 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-light transition-all duration-300"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1 transition-all duration-300 group-focus-within:text-indigo-light">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-indigo-light" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 w-full p-3 border bg-navy-light/50 border-indigo/30 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-light transition-all duration-300"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-200 mb-1 transition-all duration-300 group-focus-within:text-indigo-light">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-indigo-light" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 w-full p-3 border bg-navy-light/50 border-indigo/30 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-light transition-all duration-300"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1 transition-all duration-300 group-focus-within:text-indigo-light">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-indigo-light" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 w-full p-3 border bg-navy-light/50 border-indigo/30 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-light transition-all duration-300"
                      placeholder="Create a password"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-indigo-light focus:outline-none transition-colors duration-300"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-1 transition-all duration-300 group-focus-within:text-indigo-light">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-indigo-light" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 w-full p-3 border bg-navy-light/50 border-indigo/30 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-light transition-all duration-300"
                      placeholder="Confirm your password"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-indigo-light focus:outline-none transition-colors duration-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo to-indigo-dark text-white rounded-md hover:from-indigo-dark hover:to-indigo transition-all font-semibold flex justify-center items-center transform hover:scale-[1.02] shadow-lg relative overflow-hidden group"
                    disabled={isLoading}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    {isLoading ? (
                      <span className="flex items-center z-10">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </span>
                    ) : (
                      <span className="z-10">Sign Up</span>
                    )}
                  </button>
                </div>
              </form>

              <div className="my-6 text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-transparent text-gray-400 text-sm">or continue with</span>
                  </div>
                </div>
                <button
                  onClick={handleGoogleSignUp}
                  className="w-full mt-6 py-3 px-4 bg-white/90 text-black font-medium rounded-md hover:bg-white transition-all flex items-center justify-center gap-2 transform hover:scale-[1.02] shadow-lg"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                  Google
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-300">
                  Already have an account?{' '}
                  <Link to="/login" className="text-indigo-light hover:text-white font-medium transition-colors duration-300">
                    Sign in
                  </Link>
                </p>
              </div>
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

export default Register;
