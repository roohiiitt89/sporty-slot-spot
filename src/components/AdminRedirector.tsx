import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const AdminRedirector = () => {
  const { user, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && (userRole === 'admin' || userRole === 'super_admin')) {
      if (!location.pathname.startsWith('/admin')) {
        navigate('/admin#dashboard', { replace: true });
      }
    }
  }, [user, userRole, location, navigate]);

  return null;
};

export default AdminRedirector; 
