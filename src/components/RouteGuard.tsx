
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface RouteGuardProps {
  requireAuth?: boolean;
  requiredRole?: 'user' | 'admin' | 'super_admin';
}

export const RouteGuard = ({ requireAuth = true, requiredRole }: RouteGuardProps) => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Not logged in but auth required
  if (requireAuth && !user) {
    return <Navigate to="/login" />;
  }

  // Logged in but on a non-auth page (like login)
  if (!requireAuth && user) {
    return <Navigate to="/" />;
  }

  // Role-based access check
  if (requiredRole && user) {
    const hasAccess = 
      requiredRole === 'super_admin' ? userRole === 'super_admin' :
      requiredRole === 'admin' ? (userRole === 'admin' || userRole === 'super_admin') :
      true; // 'user' role is default

    if (!hasAccess) {
      return <Navigate to="/" />;
    }
  }

  return <Outlet />;
};
