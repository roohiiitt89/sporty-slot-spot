
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
      // On mobile, if the admin is at the root path, send them to the mobile admin home
      if (isMobile && location.pathname === '/') {
        navigate('/admin/mobile-home', { replace: true });
        return;
      }
      
      // On desktop, if the admin is not on an admin path, send them to the desktop admin dashboard
      if (!isMobile && !location.pathname.startsWith('/admin')) {
        navigate('/admin#dashboard', { replace: true });
        return;
      }
      
      // If the admin is at exactly /admin without a hash, add the dashboard hash
      if (location.pathname === '/admin' && !location.hash) {
        navigate('/admin#dashboard', { replace: true });
      }
    }
  }, [user, userRole, location, navigate, isMobile]);

  return null;
};

export default AdminRedirector;
