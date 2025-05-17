
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  role?: string; 
}

export const RouteGuard = ({ children, requireAuth = true, role }: RouteGuardProps) => {
  const { user, loading, userRole } = useAuth();
  const location = useLocation();
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Not logged in but auth required
  if (requireAuth && !user) {
    return <Navigate to="/login" />;
  }

  // Logged in but on a non-auth page (like login)
  if (!requireAuth && user) {
    // Always redirect admins to admin dashboard
    if (isAdmin) {
      return <Navigate to="/admin" />;
    }
    
    return <Navigate to="/" />;
  }

  // Role-based access check
  if (role && user) {
    const hasAccess = 
      role === 'super_admin' ? userRole === 'super_admin' :
      role === 'admin' ? (userRole === 'admin' || userRole === 'super_admin') :
      true; // 'user' role is default

    if (!hasAccess) {
      return <Navigate to={isAdmin ? "/admin" : "/"} />;
    }
  }

  // Always redirect admins to admin dashboard if they try to access any non-admin route
  if (user && isAdmin && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" />;
  }

  return <>{children}</>;
};
