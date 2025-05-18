import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import BookingManagement from './BookingManagement';
import VenueManagement from './VenueManagement';
import SportManagement from './SportManagement';
import CourtManagement from './CourtManagement';
import TemplateSlotManagement from './TemplateSlotManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import ReviewManagement from './ReviewManagement';
import MessageManagement from './MessageManagement';
import HelpRequestsManagement from './HelpRequestsManagement';
import SportDisplayNames from './SportDisplayNames';
import {
  BarChart2, Calendar, Settings, Map, Dumbbell, MessageCircle, Star, HelpCircle,
  TrendingUp, Award, Clock, ListChecks
} from 'lucide-react';

interface VenueAdmin {
  venue_id: string;
}

const AdminHome: React.FC = () => {
  const {
    user,
    userRole
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [adminVenues, setAdminVenues] = useState<VenueAdmin[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  useEffect(() => {
    if (user) {
      fetchAdminVenues();
    }
  }, [user]);
  
  const fetchAdminVenues = async () => {
    try {
      if (userRole === 'super_admin') {
        // For super admins, get all venues
        const {
          data,
          error
        } = await supabase.from('venues').select('id').eq('is_active', true);
        if (error) throw error;
        // Transform the data to match the VenueAdmin interface
        const transformedData = data?.map(item => ({
          venue_id: item.id
        })) || [];
        setAdminVenues(transformedData);
      } else {
        // For regular admins, get only assigned venues
        const {
          data,
          error
        } = await supabase.rpc('get_admin_venues');
        if (error) throw error;
        setAdminVenues(data || []);
      }
    } catch (error) {
      console.error('Error fetching admin venues:', error);
    }
  };

  // Redirect to mobile-appropriate pages on small screens
  useEffect(() => {
    if (isMobile && location.pathname === '/admin') {
      navigate('/admin/analytics');
    }
  }, [isMobile, location.pathname, navigate]);

  // On desktop, display the dashboard overview
  if (isMobile) {
    // Don't render anything on mobile as navigation is handled by the bottom nav
    return <div className="p-6 bg-navy-dark min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Analytics Cards */}
          <Card className="bg-white border border-slate-light rounded-lg p-6 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-col items-center text-center p-0 mb-4">
              <div className="w-12 h-12 bg-indigo-light rounded-full flex items-center justify-center mb-2">
                <BarChart2 className="text-indigo" />
              </div>
              <CardTitle className="text-lg">Analytics</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col gap-2">
              <Link to="/admin/analytics/booking-trends" className="text-sm text-center py-1 px-2 hover:bg-slate-100 rounded-md flex items-center justify-center">
                <TrendingUp className="h-4 w-4 mr-2" /> Booking Trends
              </Link>
              <Link to="/admin/analytics/popular-sports" className="text-sm text-center py-1 px-2 hover:bg-slate-100 rounded-md flex items-center justify-center">
                <Award className="h-4 w-4 mr-2" /> Popular Sports
              </Link>
              <Link to="/admin/analytics/peak-hours" className="text-sm text-center py-1 px-2 hover:bg-slate-100 rounded-md flex items-center justify-center">
                <Clock className="h-4 w-4 mr-2" /> Peak Hours
              </Link>
              <Link to="/admin/analytics/recent-bookings" className="text-sm text-center py-1 px-2 hover:bg-slate-100 rounded-md flex items-center justify-center">
                <ListChecks className="h-4 w-4 mr-2" /> Recent Bookings
              </Link>
            </CardContent>
          </Card>

          {/* Bookings Card */}
          <Card className="bg-white border border-slate-light rounded-lg p-6 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-col items-center text-center p-0 mb-4">
              <div className="w-12 h-12 bg-indigo-light rounded-full flex items-center justify-center mb-2">
                <Calendar className="text-indigo" />
              </div>
              <CardTitle className="text-lg">Bookings</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col gap-2">
              <Link to="/admin/bookings" className="text-sm text-center py-1 px-2 hover:bg-slate-100 rounded-md flex items-center justify-center">
                <Calendar className="h-4 w-4 mr-2" /> All Bookings
              </Link>
              <Link to="/admin/bookings/new" className="text-sm text-center py-1 px-2 hover:bg-slate-100 rounded-md flex items-center justify-center">
                <Calendar className="h-4 w-4 mr-2" /> Book for Customer
              </Link>
              <Link to="/admin/bookings/block" className="text-sm text-center py-1 px-2 hover:bg-slate-100 rounded-md flex items-center justify-center">
                <Calendar className="h-4 w-4 mr-2" /> Block Time Slots
              </Link>
            </CardContent>
          </Card>

          {/* Manage Card */}
          <Card className="bg-white border border-slate-light rounded-lg p-6 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-col items-center text-center p-0 mb-4">
              <div className="w-12 h-12 bg-indigo-light rounded-full flex items-center justify-center mb-2">
                <Settings className="text-indigo" />
              </div>
              <CardTitle className="text-lg">Manage</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col gap-2">
              <Link to="/admin/venues" className="text-sm text-center py-1 px-2 hover:bg-slate-100 rounded-md flex items-center justify-center">
                <Map className="h-4 w-4 mr-2" /> Venues
              </Link>
              <Link to="/admin/sports" className="text-sm text-center py-1 px-2 hover:bg-slate-100 rounded-md flex items-center justify-center">
                <Dumbbell className="h-4 w-4 mr-2" /> Sports
              </Link>
            </CardContent>
          </Card>

          {/* More Card */}
          <Card className="bg-white border border-slate-light rounded-lg p-6 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-col items-center text-center p-0 mb-4">
              <div className="w-12 h-12 bg-indigo-light rounded-full flex items-center justify-center mb-2">
                <Settings className="text-indigo" />
              </div>
              <CardTitle className="text-lg">More</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col gap-2">
              <Link to="/admin/reviews" className="text-sm text-center py-1 px-2 hover:bg-slate-100 rounded-md flex items-center justify-center">
                <Star className="h-4 w-4 mr-2" /> Reviews
              </Link>
              <Link to="/admin/messages" className="text-sm text-center py-1 px-2 hover:bg-slate-100 rounded-md flex items-center justify-center">
                <MessageCircle className="h-4 w-4 mr-2" /> Messages
              </Link>
              <Link to="/admin/help-requests" className="text-sm text-center py-1 px-2 hover:bg-slate-100 rounded-md flex items-center justify-center">
                <HelpCircle className="h-4 w-4 mr-2" /> Help Desk
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
  } else {
    // Desktop view with tabs remains the same
    return <div className="p-6 bg-navy-dark min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400">Manage venues, courts, bookings and more</p>
          </div>
        </div>
        
        <Tabs defaultValue="dashboard" className="space-y-4">
          <div className="overflow-x-auto pb-2">
            <TabsList className="bg-navy-light">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="venues">Venues</TabsTrigger>
              <TabsTrigger value="sports">Sports</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="help">Help Desk</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="dashboard" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>
          
          <TabsContent value="bookings">
            <BookingManagement userRole={userRole} adminVenues={adminVenues} />
          </TabsContent>
          
          <TabsContent value="venues">
            <VenueManagement userRole={userRole} adminVenues={adminVenues} />
          </TabsContent>
          
          <TabsContent value="sports">
            <SportManagement userRole={userRole} />
          </TabsContent>
          
          <TabsContent value="reviews">
            <ReviewManagement userRole={userRole} adminVenues={adminVenues} />
          </TabsContent>
          
          <TabsContent value="messages">
            <MessageManagement userRole={userRole} adminVenues={adminVenues} />
          </TabsContent>
          
          <TabsContent value="help">
            <HelpRequestsManagement userRole={userRole} />
          </TabsContent>
        </Tabs>
      </div>
    </div>;
  }
};

export default AdminHome;
