import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import AIChatWidget from '@/components/AIChatWidget';
interface VenueAdmin {
  venue_id: string;
}
const AdminHome: React.FC = () => {
  const {
    user,
    userRole
  } = useAuth();
  const [adminVenues, setAdminVenues] = useState<VenueAdmin[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
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
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL hash for navigation
    window.location.hash = value;
  };

  // Set initial tab based on URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setActiveTab(hash);
    }
  }, []);
  return <div className="p-6 bg-navy-dark min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400">Manage venues, courts, bookings and more</p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
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
          
          <TabsContent value="courts">
            <CourtManagement userRole={userRole} adminVenues={adminVenues} />
          </TabsContent>
          
          <TabsContent value="sports">
            <SportManagement userRole={userRole} />
          </TabsContent>
          
          <TabsContent value="slots">
            <TemplateSlotManagement userRole={userRole} adminVenues={adminVenues} />
          </TabsContent>
          
          <TabsContent value="sportdisplay">
            <SportDisplayNames userRole={userRole} adminVenues={adminVenues} />
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
        
        {/* Add AI Chat Widget */}
        <AIChatWidget />
      </div>
    </div>;
};
export default AdminHome;