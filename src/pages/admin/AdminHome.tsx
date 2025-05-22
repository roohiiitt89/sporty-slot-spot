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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface VenueAdmin {
  venue_id: string;
}

// WeatherWidget for AdminHome
const WeatherWidget: React.FC<{ venueId: string }> = ({ venueId }) => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        const sessionResult = await supabase.auth.getSession();
        const jwt = sessionResult.data.session?.access_token;
        if (!jwt) throw new Error('Not authenticated');
        const weatherUrl = 'https://lrtirloetmulgmdxnusl.supabase.co/functions/v1/weather-proxy';
        const res = await fetch(weatherUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
          },
          body: JSON.stringify({ venue_id: venueId, daily: true }),
        });
        const weatherData = await res.json();
        if (!res.ok) throw new Error(weatherData.error || 'Failed to fetch weather');
        setWeather(weatherData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (venueId) fetchWeather();
  }, [venueId]);

  if (!venueId) return null;

  // Helper: Weather Impact Score
  function getImpactScore() {
    if (!weather) return null;
    if (weather.severe && weather.severe.length > 0) return { label: 'Poor', color: 'bg-red-500' };
    if (weather.forecast && weather.forecast.some((f: any) => f.precipitation > 2)) return { label: 'Moderate', color: 'bg-yellow-500' };
    return { label: 'Good', color: 'bg-green-500' };
  }
  const impact = getImpactScore();

  return (
    <Card className="mb-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Weather Forecast</CardTitle>
        {impact && (
          <span className={`text-xs px-2 py-1 rounded ${impact.color} text-white`}>{impact.label} for outdoor play</span>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {loading && <div className="text-xs text-gray-500">Loading weather...</div>}
        {error && <div className="text-xs text-red-500">{error}</div>}
        {weather && (
          <>
            {/* Current Weather */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold">{Math.round(weather.current.temp)}°C</span>
              <span className="text-xs text-gray-500">Now</span>
              {weather.severe && weather.severe.length > 0 && (
                <Badge variant="destructive">Severe Weather</Badge>
              )}
            </div>
            {/* 3-Day Compact Forecast */}
            {weather.daily && (
              <div className="flex gap-2 mb-2">
                {weather.daily.slice(0, 3).map((d: any, i: number) => (
                  <div key={d.date} className="flex flex-col items-center min-w-[56px]">
                    <span className="text-xs text-gray-500 font-medium">{d.day}</span>
                    <span className="text-lg font-bold">{Math.round(d.temp_max)}°</span>
                    <span className="text-xs text-gray-400">{Math.round(d.temp_min)}°</span>
                    <span className="text-xs">{d.icon}</span>
                    {d.rain > 0 && <span className="text-blue-500 text-xs">{d.rain}mm</span>}
                  </div>
                ))}
              </div>
            )}
            {/* Hourly Rain/Storm Timeline (next 12h) */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {weather.forecast.slice(0, 12).map((f: any, i: number) => (
                <div key={f.time} className="flex flex-col items-center min-w-[40px]">
                  <span className="text-xs text-gray-500">{new Date(f.time).getHours()}:00</span>
                  <span className="font-medium text-sm">{Math.round(f.temp)}°</span>
                  {f.precipitation > 0 && (
                    <span className="text-blue-500 text-xs">{f.precipitation}mm</span>
                  )}
                  {[95,96,99].includes(f.weathercode) && (
                    <span className="text-red-500 text-xs">Storm</span>
                  )}
                </div>
              ))}
            </div>
            {/* Expandable details */}
            {expanded && weather.daily && (
              <div className="mt-2">
                <div className="text-xs text-gray-400 mb-1">3-Day Details</div>
                <div className="flex gap-2">
                  {weather.daily.slice(0, 3).map((d: any, i: number) => (
                    <div key={d.date} className="flex flex-col items-center min-w-[80px] p-2 rounded bg-green-600/80 text-white">
                      <span className="text-xs font-medium">{d.day}</span>
                      <span className="text-lg font-bold">{Math.round(d.temp_max)}° / {Math.round(d.temp_min)}°</span>
                      <span className="text-xs">{d.icon}</span>
                      <span className="text-xs text-blue-200">Rain: {d.rain}mm</span>
                      <span className="text-xs text-white/80">{d.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

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
            {adminVenues[0] && <WeatherWidget venueId={adminVenues[0].venue_id} />}
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
      </div>
    </div>;
};
export default AdminHome;
