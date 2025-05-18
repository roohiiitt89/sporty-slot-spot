
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
      if ((!isMobile && !location.pathname.startsWith('/admin')) || 
          (location.pathname === '/' && !location.pathname.includes('#'))) {
        navigate('/admin#dashboard', { replace: true });
      }
    }
  }, [user, userRole, location, navigate, isMobile]);

  return null;
};

export default AdminRedirector;
