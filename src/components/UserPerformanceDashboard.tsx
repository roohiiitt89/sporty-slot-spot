import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { useAuth } from '@/context/AuthContext';
import { Clock, MapPin, Trophy, Award } from 'lucide-react';

// Extremely simple tooltip that never uses Object.entries
const SimpleTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload[0]) return null;
  
  const { name, value } = payload[0];
  return (
    <div className="bg-navy-dark border border-indigo/30 rounded-lg p-3 text-sm">
      <p className="font-medium text-white">{name || 'Value'}: {value}</p>
    </div>
  );
};

// Data structure
interface DashboardData {
  timeData: { month: string; hours: number }[];
  venueData: { name: string; visits: number }[];
  sportData: { name: string; count: number }[];
  radarData: { subject: string; score: number; max: number }[];
  achievements: {
    id: number;
    title: string;
    description: string;
    icon: string;
  }[];
  stats: {
    totalHours: number;
    topVenue: string;
    topSport: string;
    sportCount: number;
  };
}

const COLORS = ['#9b87f5', '#4CAF50', '#F97316', '#0EA5E9'];

export default function PerformanceDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        const mockData: DashboardData = {
          timeData: [
            { month: 'Jan', hours: 5 },
            { month: 'Feb', hours: 8 },
            { month: 'Mar', hours: 12 },
            { month: 'Apr', hours: 10 },
            { month: 'May', hours: 15 },
          ],
          venueData: [
            { name: 'East Delhi Box', visits: 12 },
            { name: 'South Delhi Arena', visits: 8 },
            { name: 'North Delhi Court', visits: 5 },
            { name: 'West Delhi Stadium', visits: 3 },
          ],
          sportData: [
            { name: 'Box Football', count: 18 },
            { name: 'Box Cricket', count: 12 },
            { name: 'Badminton', count: 7 },
            { name: 'Basketball', count: 4 },
          ],
          radarData: [
            { subject: 'Football', score: 120, max: 150 },
            { subject: 'Cricket', score: 98, max: 150 },
            { subject: 'Badminton', score: 86, max: 150 },
            { subject: 'Basketball', score: 99, max: 150 },
          ],
          achievements: [
            { id: 1, title: 'Early Bird', description: '5 morning sessions', icon: 'clock' },
            { id: 2, title: 'Explorer', description: '3+ venues', icon: 'map-pin' }
          ],
          stats: {
            totalHours: 50,
            topVenue: 'East Delhi Box',
            topSport: 'Box Football',
            sportCount: 18
          }
        };

        setData(mockData);
      } catch (error) {
        console.error('Data loading failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getIcon = (icon: string) => {
    const icons: Record<string, JSX.Element> = {
      clock: <Clock className="h-4 w-4" />,
      'map-pin': <MapPin className="h-4 w-4" />,
      award: <Award className="h-4 w-4" />
    };
    return icons[icon] || <Trophy className="h-4 w-4" />;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Sign in to view dashboard</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Your Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-navy-light rounded-lg h-52"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Sports Performance</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Time Card */}
        <Card className="bg-navy-dark border-indigo/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Time Played</CardTitle>
              <Clock className="h-5 w-5 text-indigo-light" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{data.stats.totalHours} hours</p>
            <div className="h-24 mt-2">
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.timeData}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <Tooltip content={<SimpleTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="#4CAF50" 
                      fill="url(#timeGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Venue Card */}
        <Card className="bg-navy-dark border-indigo/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Top Venue</CardTitle>
              <MapPin className="h-5 w-5 text-indigo-light" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{data.stats.topVenue}</p>
            <div className="h-24 mt-2">
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.venueData}>
                    <XAxis dataKey="name" tick={false} />
                    <Tooltip content={<SimpleTooltip />} />
                    <Bar dataKey="visits">
                      {data.venueData.map((entry, index) => (
                        <Cell key={`venue-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sport Card */}
        <Card className="bg-navy-dark border-indigo/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Top Sport</CardTitle>
              <Trophy className="h-5 w-5 text-indigo-light" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{data.stats.sportCount} sessions</p>
            <div className="h-24 mt-2">
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sportData}>
                    <XAxis dataKey="name" tick={false} />
                    <Tooltip content={<SimpleTooltip />} />
                    <Bar dataKey="count">
                      {data.sportData.map((entry, index) => (
                        <Cell key={`sport-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar Card */}
        <Card className="bg-navy-dark border-indigo/30">
          <CardHeader>
            <CardTitle className="text-white">Skills Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={data.radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <Radar 
                      name="Performance" 
                      dataKey="score" 
                      stroke="#9b87f5" 
                      fill="#9b87f5" 
                      fillOpacity={0.6} 
                    />
                    <Tooltip content={<SimpleTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Achievements Card */}
        <Card className="bg-navy-dark border-indigo/30">
          <CardHeader>
            <CardTitle className="text-white">Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.achievements.map((item) => (
                <div key={item.id} className="flex items-center p-3 border border-indigo/20 rounded-lg">
                  <div className="mr-3 p-2 rounded-full bg-indigo/20">
                    {getIcon(item.icon)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
