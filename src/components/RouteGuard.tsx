
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export interface RouteGuardProps {
  requireAuth?: boolean;
  requiredRole?: 'user' | 'admin' | 'super_admin';
  adminOnly?: boolean;
}

export const RouteGuard = ({ requireAuth = true, requiredRole, adminOnly = false }: RouteGuardProps) => {
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
  if (requiredRole && user) {
    const hasAccess = 
      requiredRole === 'super_admin' ? userRole === 'super_admin' :
      requiredRole === 'admin' ? (userRole === 'admin' || userRole === 'super_admin') :
      true; // 'user' role is default

    if (!hasAccess) {
      return <Navigate to={isAdmin ? "/admin" : "/"} />;
    }
  }

  // Check if this is an admin-only route, and user is not admin
  if (adminOnly && user && !isAdmin) {
    return <Navigate to="/" />;
  }

  // Always redirect admins to admin dashboard if they try to access any non-admin route
  if (user && isAdmin && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" />;
  }

  return <Outlet />;
};
