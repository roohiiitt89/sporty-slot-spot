
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
    if (user && (userRole === 'admin' || userRole === 'super_admin')) {
      // Only redirect if we're on the root path or the /admin path
      if (location.pathname === '/') {
        // For mobile, send to analytics page
        if (isMobile) {
          navigate('/admin/analytics', { replace: true });
        } else {
          // For desktop, send to admin dashboard
          navigate('/admin', { replace: true });
        }
      } 
      // For mobile users, when directly accessing /admin
      else if (isMobile && location.pathname === '/admin') {
        navigate('/admin/analytics', { replace: true });
      }
    }
  }, [user, userRole, location.pathname, navigate, isMobile]);

  return null;
};

export default AdminRedirector;
