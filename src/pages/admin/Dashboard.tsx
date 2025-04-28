
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import VenueManagement from './VenueManagement';
import SportManagement from './SportManagement';
import CourtManagement from './CourtManagement';
import BookingManagement from './BookingManagement';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUserRole();
  }, [user]);

  const checkUserRole = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Check user role from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      
      if (profileData && (profileData.role === 'admin' || profileData.role === 'super_admin')) {
        setUserRole(profileData.role);
      } else {
        // Also check user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        if (roleError) throw roleError;
        
        const isAdmin = roleData?.some(r => r.role === 'admin' || r.role === 'super_admin');
        
        if (isAdmin) {
          setUserRole(roleData.find(r => r.role === 'super_admin') ? 'super_admin' : 'admin');
        } else {
          // Not an admin
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin dashboard.",
            variant: "destructive",
          });
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast({
        title: "Error",
        description: "There was an issue verifying your admin privileges.",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sport-gray-light">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sport-green"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between px-6 py-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                  <p className="text-gray-600 text-sm">
                    Role: <span className="font-semibold">{userRole}</span>
                  </p>
                </div>
              </div>
              
              {/* Admin Navigation */}
              <div className="flex overflow-x-auto">
                <Link
                  to="/admin"
                  className="px-6 py-3 inline-block text-gray-700 hover:text-sport-green border-b-2 border-transparent hover:border-sport-green transition-colors"
                >
                  Overview
                </Link>
                <Link
                  to="/admin/venues"
                  className="px-6 py-3 inline-block text-gray-700 hover:text-sport-green border-b-2 border-transparent hover:border-sport-green transition-colors"
                >
                  Venues
                </Link>
                <Link
                  to="/admin/sports"
                  className="px-6 py-3 inline-block text-gray-700 hover:text-sport-green border-b-2 border-transparent hover:border-sport-green transition-colors"
                >
                  Sports
                </Link>
                <Link
                  to="/admin/courts"
                  className="px-6 py-3 inline-block text-gray-700 hover:text-sport-green border-b-2 border-transparent hover:border-sport-green transition-colors"
                >
                  Courts
                </Link>
                <Link
                  to="/admin/bookings"
                  className="px-6 py-3 inline-block text-gray-700 hover:text-sport-green border-b-2 border-transparent hover:border-sport-green transition-colors"
                >
                  Bookings
                </Link>
              </div>
            </div>
            
            {/* Admin Content Area */}
            <div className="p-6">
              <Routes>
                <Route path="/" element={<AdminOverview userRole={userRole} />} />
                <Route path="/venues" element={<VenueManagement userRole={userRole} />} />
                <Route path="/sports" element={<SportManagement userRole={userRole} />} />
                <Route path="/courts" element={<CourtManagement userRole={userRole} />} />
                <Route path="/bookings" element={<BookingManagement userRole={userRole} />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder admin overview component
const AdminOverview: React.FC<{ userRole: string | null }> = ({ userRole }) => {
  const [stats, setStats] = useState({
    venues: 0,
    sports: 0,
    courts: 0,
    pendingBookings: 0,
    confirmedBookings: 0
  });
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    const fetchCount = async (table: string, condition?: { column: string, value: any }) => {
      let query = supabase.from(table).select('id', { count: 'exact' });
      
      if (condition) {
        query = query.eq(condition.column, condition.value);
      }
      
      const { count } = await query;
      return count || 0;
    };
    
    try {
      const venues = await fetchCount('venues');
      const sports = await fetchCount('sports');
      const courts = await fetchCount('courts');
      const pendingBookings = await fetchCount('bookings', { column: 'status', value: 'pending' });
      const confirmedBookings = await fetchCount('bookings', { column: 'status', value: 'confirmed' });
      
      setStats({
        venues,
        sports,
        courts,
        pendingBookings,
        confirmedBookings
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Venues" value={stats.venues} color="bg-blue-500" />
        <StatCard title="Total Sports" value={stats.sports} color="bg-green-500" />
        <StatCard title="Total Courts" value={stats.courts} color="bg-purple-500" />
        <StatCard title="Pending Bookings" value={stats.pendingBookings} color="bg-yellow-500" />
        <StatCard title="Confirmed Bookings" value={stats.confirmedBookings} color="bg-sport-green" />
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-md">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Admin Panel Access</h3>
        <p className="text-blue-600">
          {userRole === 'super_admin' 
            ? 'You have full access to all venues and features as a super admin.' 
            : 'You have access to manage your assigned venues as an admin.'}
        </p>
      </div>
    </div>
  );
};

// Reusable stat card component
const StatCard: React.FC<{ title: string, value: number, color: string }> = ({ title, value, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border overflow-hidden">
      <div className={`${color} h-2 w-full`}></div>
      <div className="p-6">
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
