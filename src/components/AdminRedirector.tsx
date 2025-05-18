
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminRedirector = () => {
  const { user, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Only redirect on non-mobile devices or if explicitly on the root path
    if (user && (userRole === 'admin' || userRole === 'super_admin')) {
      // For mobile users, send to analytics page
      if (isMobile && location.pathname === '/') {
        navigate('/admin/analytics', { replace: true });
      } 
      // For mobile users, when directly accessing /admin
      else if (isMobile && location.pathname === '/admin') {
        navigate('/admin/analytics', { replace: true });
      }
      // For desktop users, maintain existing behavior
      else if (!isMobile && !location.pathname.startsWith('/admin')) {
        navigate('/admin', { replace: true });
      }
    }
  }, [user, userRole, location, navigate, isMobile]);

  return null;
};

export default AdminRedirector;
