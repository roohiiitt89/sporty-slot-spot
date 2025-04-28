
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface RouteGuardProps {
  requireAuth?: boolean;
}

export const RouteGuard = ({ requireAuth = true }: RouteGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" />;
  }

  if (!requireAuth && user) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};
