
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: 'user' | 'admin' | 'super_admin' | null;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isSessionExpired: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'super_admin' | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          setIsSessionExpired(false);
          // Fetch user role after sign in
          if (currentSession?.user) {
            fetchUserRole(currentSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setUserRole(null);
          navigate('/login');
        } else if (event === 'TOKEN_REFRESHED') {
          setIsSessionExpired(false);
        } else if (event === 'USER_UPDATED') {
          setUser(currentSession?.user ?? null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Fetch user role for existing session
      if (currentSession?.user) {
        fetchUserRole(currentSession.user.id);
      }
      
      setLoading(false);
    });

    // Add session expiration check
    const checkSessionExpiration = () => {
      const expiresAt = session?.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt < now) {
          setIsSessionExpired(true);
        }
      }
    };

    const interval = setInterval(checkSessionExpiration, 60000); // Check every minute
    
    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [navigate, session?.expires_at]);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }
      
      // Find the highest role (super_admin > admin > user)
      if (data && data.length > 0) {
        if (data.some(r => r.role === 'super_admin')) {
          setUserRole('super_admin');
        } else if (data.some(r => r.role === 'admin')) {
          setUserRole('admin');
        } else {
          setUserRole('user');
        }
      } else {
        setUserRole('user'); // Default role
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone
          }
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };
  
  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      userRole, 
      signUp, 
      signIn, 
      signOut,
      isSessionExpired,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
