
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { LayoutGrid, Users, Calendar, Map, Dumbbell, ShieldCheckIcon, Info } from 'lucide-react';

// Admin pages
import VenueManagement from './VenueManagement';
import SportManagement from './SportManagement';
import CourtManagement from './CourtManagement';
import BookingManagement from './BookingManagement';
import TemplateSlotManagement from './TemplateSlotManagement';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      try {
        // Get user role from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (roleError) throw roleError;
        
        if (roleData) {
          setUserRole(roleData.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user role information',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sport-green"></div>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', icon: <LayoutGrid className="mr-2" />, title: 'Dashboard', exact: true },
    { path: '/admin/venues', icon: <Map className="mr-2" />, title: 'Venues' },
    { path: '/admin/sports', icon: <Dumbbell className="mr-2" />, title: 'Sports' },
    { path: '/admin/courts', icon: <ShieldCheckIcon className="mr-2" />, title: 'Courts' },
    { path: '/admin/bookings', icon: <Calendar className="mr-2" />, title: 'Bookings' },
    { path: '/admin/template-slots', icon: <Calendar className="mr-2" />, title: 'Template Slots' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-1/5">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="font-bold text-xl mb-4 text-sport-gray-dark border-b pb-2">
                Admin Dashboard
              </h2>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = 
                    item.exact 
                      ? location.pathname === item.path
                      : location.pathname.startsWith(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block px-4 py-2 rounded-md flex items-center transition-colors ${
                        isActive
                          ? 'bg-sport-green text-white'
                          : 'hover:bg-sport-gray-light'
                      }`}
                    >
                      {item.icon}
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-4 pt-4 border-t">
                <Link 
                  to="/" 
                  className="block px-4 py-2 text-sport-gray-dark hover:bg-sport-gray-light rounded-md"
                >
                  Back to Site
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-4/5">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Routes>
                <Route
                  path="/"
                  element={
                    <div className="space-y-6">
                      <h1 className="text-2xl font-bold text-sport-gray-dark">Welcome to Admin Dashboard</h1>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {navItems.slice(1).map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="bg-white border border-sport-gray-light rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col items-center text-center"
                          >
                            <div className="w-12 h-12 bg-sport-green-light rounded-full flex items-center justify-center text-sport-green mb-4">
                              {item.icon}
                            </div>
                            <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                            <p className="text-sport-gray text-sm">Manage {item.title.toLowerCase()}</p>
                          </Link>
                        ))}
                      </div>
                      
                      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start">
                        <Info className="text-blue-500 mr-3 mt-1" />
                        <div>
                          <h3 className="font-semibold text-blue-800 mb-1">Administrator Access</h3>
                          <p className="text-blue-700 text-sm">
                            As an administrator, you have access to manage venues, sports, courts, and bookings. 
                            Use the navigation menu to access different sections.
                          </p>
                        </div>
                      </div>
                    </div>
                  }
                />
                <Route path="/venues" element={<VenueManagement userRole={userRole} />} />
                <Route path="/sports" element={<SportManagement userRole={userRole} />} />
                <Route path="/courts" element={<CourtManagement userRole={userRole} />} />
                <Route path="/bookings" element={<BookingManagement userRole={userRole} />} />
                <Route path="/template-slots" element={<TemplateSlotManagement userRole={userRole} />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
