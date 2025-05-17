
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: any | null;
  userRole: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          try {
            const { data: isAdmin } = await supabase.rpc("is_admin");
            
            if (isAdmin) {
              const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");
              setUserRole(isSuperAdmin ? "super_admin" : "admin");
            } else {
              setUserRole("user");
            }
          } catch (error) {
            console.error("Error checking admin status:", error);
            setUserRole("user");
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          setUser(session.user);
          
          try {
            const { data: isAdmin } = await supabase.rpc("is_admin");
            
            if (isAdmin) {
              const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");
              setUserRole(isSuperAdmin ? "super_admin" : "admin");
            } else {
              setUserRole("user");
            }
          } catch (error) {
            console.error("Error checking admin status:", error);
            setUserRole("user");
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setUserRole(null);
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
