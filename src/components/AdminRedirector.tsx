
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const AdminRedirector = () => {
  const { user, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  useEffect(() => {
    // Only redirect on non-mobile devices or if explicitly on the root path
    if (user && (userRole === 'admin' || userRole === 'super_admin')) {
      // For mobile users, send to analytics page
      if (isMobile && location.pathname === '/') {
        navigate('/admin/analytics', { replace: true });
      } 
      // For desktop users, maintain existing behavior
      else if (!isMobile && !location.pathname.startsWith('/admin')) {
        navigate('/admin', { replace: true });
      }
      // For direct access to /admin on mobile
      else if (isMobile && location.pathname === '/admin') {
        navigate('/admin/analytics', { replace: true });
      }
    }
  }, [user, userRole, location, navigate, isMobile]);

  return null;
};

export default AdminRedirector;
