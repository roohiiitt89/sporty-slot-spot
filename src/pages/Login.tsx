
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import Header from '../components/Header';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login successful",
          description: "Welcome back to SportySlot!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "There was an issue signing in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sport-gray-light">
      <Header />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-sport-gray-dark">Welcome Back</h1>
                <p className="text-sport-gray mt-2">Sign in to continue with SportySlot</p>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-sport-gray-dark mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-sport-gray" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 w-full p-3 border border-sport-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-sport-gray-dark mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-sport-gray" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 w-full p-3 border border-sport-gray-light rounded-md focus:outline-none focus:ring-2 focus:ring-sport-green"
                        placeholder="Enter your password"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-sport-gray hover:text-sport-gray-dark focus:outline-none"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-sport-green focus:ring-sport-green border-sport-gray-light rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-sport-gray-dark">
                        Remember me
                      </label>
                    </div>
                    
                    <div className="text-sm">
                      <a href="#" className="font-medium text-sport-green hover:text-sport-green-dark">
                        Forgot password?
                      </a>
                    </div>
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-sport-green text-white rounded-md hover:bg-sport-green-dark transition-colors font-semibold flex justify-center items-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing In...
                        </span>
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </div>
                </div>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sport-gray-dark">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-sport-green hover:text-sport-green-dark font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
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

export default Login;
