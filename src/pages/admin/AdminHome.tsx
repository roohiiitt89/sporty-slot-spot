
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dumbbell, Calendar, Map, Users, MessageCircle, BarChart, Settings } from 'lucide-react';

// Define TypeScript interfaces for our data
interface Venue {
  id: string;
  name: string;
  location: string;
  image_url: string | null;
  bookings_count: number;
  courts_count: number;
}

interface AdminHomeStats {
  total_venues: number;
  total_bookings: number;
  recent_bookings: number;
  total_courts: number;
}

const AdminHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [stats, setStats] = useState<AdminHomeStats>({
    total_venues: 0,
    total_bookings: 0,
    recent_bookings: 0,
    total_courts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch venues administered by this admin - using a type assertion for the RPC call
        const { data: venueData, error: venueError } = await (supabase
          .rpc('get_admin_venues_with_stats') as unknown as Promise<{ data: Venue[] | null, error: any }>);
          
        if (venueError) throw venueError;

        // Get aggregate stats - using a type assertion for the RPC call
        const { data: statsData, error: statsError } = await (supabase
          .rpc('get_admin_dashboard_stats') as unknown as Promise<{ data: AdminHomeStats[] | null, error: any }>);
          
        if (statsError) throw statsError;
        
        if (venueData) setVenues(venueData);
        if (statsData && statsData.length > 0) setStats(statsData[0]);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, [user]);

  const quickLinks = [
    { 
      title: 'Manage Bookings', 
      icon: <Calendar className="w-8 h-8 text-indigo" />, 
      path: '/admin/bookings',
      description: 'View and manage all bookings'
    },
    { 
      title: 'Manage Venues', 
      icon: <Map className="w-8 h-8 text-indigo" />, 
      path: '/admin/venues',
      description: 'Configure venues and settings'
    },
    { 
      title: 'Courts & Groups', 
      icon: <Dumbbell className="w-8 h-8 text-indigo" />, 
      path: '/admin/courts',
      description: 'Manage courts and court groups'
    },
    { 
      title: 'Analytics', 
      icon: <BarChart className="w-8 h-8 text-indigo" />, 
      path: '/admin/analytics',
      description: 'View performance metrics'
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl p-6 md:p-8 mb-8 shadow-lg text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Welcome, Admin
          </h1>
          <p className="text-indigo-100">
            Manage your venues, courts, and bookings all in one place
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Venues</p>
                <h3 className="text-xl md:text-2xl font-bold text-navy-dark">{stats.total_venues}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Map className="w-5 h-5 text-indigo" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Courts</p>
                <h3 className="text-xl md:text-2xl font-bold text-navy-dark">{stats.total_courts}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-indigo" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <h3 className="text-xl md:text-2xl font-bold text-navy-dark">{stats.total_bookings}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-indigo" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recent Bookings</p>
                <h3 className="text-xl md:text-2xl font-bold text-navy-dark">{stats.recent_bookings}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <h2 className="text-xl font-bold mb-4 text-navy-dark">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickLinks.map((link, index) => (
            <div 
              key={index} 
              onClick={() => navigate(link.path)}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  {link.icon}
                </div>
                <h3 className="text-lg font-semibold mb-1 text-navy-dark">{link.title}</h3>
                <p className="text-sm text-gray-500">{link.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Venues List */}
        <h2 className="text-xl font-bold mb-4 text-navy-dark">Your Venues</h2>
        {venues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {venues.map(venue => (
              <div 
                key={venue.id} 
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate('/admin/venues')}
              >
                <div className="h-40 overflow-hidden">
                  <img 
                    src={venue.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000'} 
                    alt={venue.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 text-navy-dark">{venue.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{venue.location}</p>
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="font-semibold">{venue.courts_count}</span> Courts
                    </div>
                    <div>
                      <span className="font-semibold">{venue.bookings_count}</span> Bookings
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <Map className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold mb-2">No venues assigned to you</h3>
            <p className="text-gray-500">Contact a super admin to assign venues to your account.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHome;
