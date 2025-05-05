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

// Custom safe tooltip that doesn't use Object.entries
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload || {};
  const displayItems = [];

  if (data.hours !== undefined) displayItems.push(['Hours', data.hours]);
  if (data.visits !== undefined) displayItems.push(['Visits', data.visits]);
  if (data.count !== undefined) displayItems.push(['Sessions', data.count]);
  if (data.A !== undefined) displayItems.push(['Score', data.A]);
  if (payload[0].value !== undefined) displayItems.push(['Value', payload[0].value]);

  return (
    <div className="bg-navy-dark border border-indigo/30 rounded-lg p-4 shadow-lg">
      {label && <p className="font-bold text-white mb-2">{label}</p>}
      <div className="space-y-1">
        {displayItems.map(([key, value]) => (
          <p key={key} className="text-sm text-gray-300">
            <span className="capitalize">{key}: </span>
            <span className="font-medium text-white">{value}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

// Data types
type ChartData = { month: string; hours: number };
type VenueData = { name: string; visits: number };
type SportData = { name: string; count: number };
type RadarData = { subject: string; A: number; fullMark: number };
type Achievement = { id: number; title: string; description: string; icon: string };

interface DashboardData {
  timePlayed: ChartData[];
  venues: VenueData[];
  sports: SportData[];
  radar: RadarData[];
  achievements: Achievement[];
  summary: {
    totalHours: number;
    favoriteVenue: string;
    topSport: string;
    topSportCount: number;
  };
}

const COLORS = ['#9b87f5', '#4CAF50', '#F97316', '#0EA5E9'];

export default function PerformanceDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data - replace with actual API call
        const mockData: DashboardData = {
          timePlayed: [
            { month: 'Jan', hours: 5 },
            { month: 'Feb', hours: 8 },
            { month: 'Mar', hours: 12 },
            { month: 'Apr', hours: 10 },
            { month: 'May', hours: 15 },
          ],
          venues: [
            { name: 'East Delhi Box', visits: 12 },
            { name: 'South Delhi Arena', visits: 8 },
            { name: 'North Delhi Court', visits: 5 },
            { name: 'West Delhi Stadium', visits: 3 },
          ],
          sports: [
            { name: 'Box Football', count: 18 },
            { name: 'Box Cricket', count: 12 },
            { name: 'Badminton', count: 7 },
            { name: 'Basketball', count: 4 },
          ],
          radar: [
            { subject: 'Box Football', A: 120, fullMark: 150 },
            { subject: 'Box Cricket', A: 98, fullMark: 150 },
            { subject: 'Badminton', A: 86, fullMark: 150 },
            { subject: 'Basketball', A: 99, fullMark: 150 },
          ],
          achievements: [
            { id: 1, title: 'Early Bird', description: 'Booked 5 sessions before 8AM', icon: 'clock' },
            { id: 2, title: 'Venue Explorer', description: 'Visited 3+ different venues', icon: 'map-pin' }
          ],
          summary: {
            totalHours: 50,
            favoriteVenue: 'East Delhi Box',
            topSport: 'Box Football',
            topSportCount: 18
          }
        };

        setData(mockData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const renderIcon = (icon: string) => {
    const iconMap: Record<string, JSX.Element> = {
      clock: <Clock className="h-4 w-4" />,
      'map-pin': <MapPin className="h-4 w-4" />,
      award: <Award className="h-4 w-4" />
    };
    return iconMap[icon] || <Trophy className="h-4 w-4" />;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Please sign in to view your dashboard</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Your Sports Performance</h2>
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
      <h2 className="text-2xl font-bold text-white">Your Sports Performance</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Time Played Card */}
        <Card className="bg-navy-dark border-indigo/30 shadow-lg hover:shadow-indigo/10 transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Total Time Played</CardTitle>
              <Clock className="h-5 w-5 text-indigo-light" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <p className="text-2xl font-bold text-white">{data.summary.totalHours} hours</p>
              <p className="text-gray-400 text-sm">Your training hours this year</p>
            </div>
            <div className="h-24">
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.timePlayed}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#6E59A5" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="hours" 
                      stroke="#4CAF50" 
                      fillOpacity={1} 
                      fill="url(#colorHours)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Venues Card */}
        <Card className="bg-navy-dark border-indigo/30 shadow-lg hover:shadow-indigo/10 transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Favorite Venue</CardTitle>
              <MapPin className="h-5 w-5 text-indigo-light" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <p className="text-2xl font-bold text-white">{data.summary.favoriteVenue}</p>
              <p className="text-gray-400 text-sm">Your most visited location</p>
            </div>
            <div className="h-24">
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.venues}>
                    <XAxis dataKey="name" tick={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="visits" radius={[4, 4, 0, 0]}>
                      {data.venues.map((entry, index) => (
                        <Cell key={`venue-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sports Card */}
        <Card className="bg-navy-dark border-indigo/30 shadow-lg hover:shadow-indigo/10 transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Top Sport</CardTitle>
              <Trophy className="h-5 w-5 text-indigo-light" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <p className="text-2xl font-bold text-white">{data.summary.topSportCount} sessions</p>
              <p className="text-gray-400 text-sm">{data.summary.topSport} is your most played</p>
            </div>
            <div className="h-24">
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sports}>
                    <XAxis dataKey="name" tick={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data.sports.map((entry, index) => (
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
        {/* Radar Chart */}
        <Card className="bg-navy-dark border-indigo/30 shadow-lg hover:shadow-indigo/10 transition-shadow">
          <CardHeader>
            <CardTitle className="text-white">Performance Radar</CardTitle>
            <CardDescription className="text-gray-400">Your skills across different sports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ChartContainer>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.radar}>
                    <PolarGrid stroke="#6E59A5" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#C8C8C9' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} />
                    <Radar name="Performance" dataKey="A" stroke="#9b87f5" fill="#9b87f5" fillOpacity={0.6} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="bg-navy-dark border-indigo/30 shadow-lg hover:shadow-indigo/10 transition-shadow">
          <CardHeader>
            <CardTitle className="text-white">🏅 Achievements</CardTitle>
            <CardDescription className="text-gray-400">Your sports milestones</CardDescription>
          </CardHeader>
          <CardContent>
            {data.achievements.length > 0 ? (
              <div className="space-y-4">
                {data.achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-center p-3 rounded-lg border border-indigo/20 bg-navy hover:bg-navy-light transition-colors">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-10 h-10 rounded-full bg-indigo/20 flex items-center justify-center">
                        {renderIcon(achievement.icon)}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-white font-medium">{achievement.title}</h4>
                      <p className="text-gray-400 text-sm">{achievement.description}</p>
                    </div>
                    <Badge variant="outline" className="bg-indigo/10 text-indigo-light border-indigo/30">
                      Earned
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No achievements yet. Keep playing!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
