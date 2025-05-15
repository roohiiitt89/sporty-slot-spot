
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
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Clock, MapPin, Star, Medal, Trophy, Award } from 'lucide-react';

// Mock data for initial render (will be replaced with actual data)
const mockData = {
  timePlayedTrend: [
    { month: 'Jan', hours: 5 },
    { month: 'Feb', hours: 8 },
    { month: 'Mar', hours: 12 },
    { month: 'Apr', hours: 10 },
    { month: 'May', hours: 15 },
  ],
  venuesVisited: [
    { name: 'East Delhi Box', visits: 12 },
    { name: 'South Delhi Arena', visits: 8 },
    { name: 'North Delhi Court', visits: 5 },
    { name: 'West Delhi Stadium', visits: 3 },
  ],
  sportsPlayed: [
    { name: 'Box Football', count: 18 },
    { name: 'Box Cricket', count: 12 },
    { name: 'Badminton', count: 7 },
    { name: 'Basketball', count: 4 },
  ],
  radarData: [
    { subject: 'Box Football', A: 120, fullMark: 150 },
    { subject: 'Box Cricket', A: 98, fullMark: 150 },
    { subject: 'Badminton', A: 86, fullMark: 150 },
    { subject: 'Basketball', A: 99, fullMark: 150 },
    { subject: 'Tennis', A: 85, fullMark: 150 },
    { subject: 'Volleyball', A: 65, fullMark: 150 },
  ],
  achievements: [
    { id: 1, title: 'Early Bird', description: 'Booked 5 sessions before 8AM', icon: 'clock' },
    { id: 2, title: 'Venue Explorer', description: 'Visited 3+ different venues', icon: 'map-pin' },
    { id: 3, title: 'Consistency Champion', description: 'Booked 5+ weeks in a row', icon: 'award' }
  ]
};

interface UserStats {
  totalHours: number;
  favoriteVenue: string;
  topSport: string;
  topSportCount: number;
  monthlyTrend: any[];
  venueDistribution: any[];
  sportsDistribution: any[];
  radarData: any[];
  achievements: any[];
}

export function UserPerformanceDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalHours: 0,
    favoriteVenue: '',
    topSport: '',
    topSportCount: 0,
    monthlyTrend: mockData.timePlayedTrend,
    venueDistribution: mockData.venuesVisited,
    sportsDistribution: mockData.sportsPlayed,
    radarData: mockData.radarData,
    achievements: mockData.achievements
  });

  // Define chart configuration for different data series
  const chartConfig = {
    hours: {
      label: "Hours",
      theme: {
        light: "#4CAF50",
        dark: "#4CAF50",
      },
    },
    visits: {
      label: "Visits",
      theme: {
        light: "#6E59A5",
        dark: "#9b87f5",
      },
    },
    count: {
      label: "Sessions",
      theme: {
        light: "#F97316",
        dark: "#F97316",
      },
    },
    performance: {
      label: "Performance",
      theme: {
        light: "#9b87f5",
        dark: "#9b87f5",
      },
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchUserStats = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, we would fetch actual user data from Supabase
        // For now, we'll simulate a data fetch with a timeout
        setTimeout(() => {
          // Calculate total hours (sum of all monthly hours)
          const totalHours = mockData.timePlayedTrend.reduce((sum, item) => sum + item.hours, 0);
          
          // Find favorite venue (most visited)
          const favoriteVenue = [...mockData.venuesVisited].sort((a, b) => b.visits - a.visits)[0].name;
          
          // Find top sport
          const topSport = [...mockData.sportsPlayed].sort((a, b) => b.count - a.count)[0];
          
          setStats({
            totalHours,
            favoriteVenue,
            topSport: topSport.name,
            topSportCount: topSport.count,
            monthlyTrend: mockData.timePlayedTrend,
            venueDistribution: mockData.venuesVisited,
            sportsDistribution: mockData.sportsPlayed,
            radarData: mockData.radarData,
            achievements: mockData.achievements
          });
          
          setIsLoading(false);
        }, 500);
        
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  if (!user) return null;

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'clock':
        return <Clock className="h-4 w-4" />;
      case 'map-pin':
        return <MapPin className="h-4 w-4" />;
      case 'award':
        return <Award className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  const COLORS = ['#9b87f5', '#4CAF50', '#F97316', '#0EA5E9'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Your Sports Performance</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-navy-light rounded-lg h-52"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total Time Played */}
            <Card className="bg-navy-dark border-indigo/30 shadow-lg hover:shadow-indigo/10 transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">Total Time Played</CardTitle>
                  <Clock className="h-5 w-5 text-indigo-light" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <p className="text-2xl font-bold text-white">{stats.totalHours} hours</p>
                  <p className="text-gray-400 text-sm">You've spent {stats.totalHours} hours in training this year</p>
                </div>
                <div className="h-24">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.monthlyTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#6E59A5" />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="hours" stroke="#4CAF50" fillOpacity={1} fill="url(#colorHours)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Favorite Venue */}
            <Card className="bg-navy-dark border-indigo/30 shadow-lg hover:shadow-indigo/10 transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">Favorite Venue</CardTitle>
                  <MapPin className="h-5 w-5 text-indigo-light" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <p className="text-2xl font-bold text-white">{stats.favoriteVenue}</p>
                  <p className="text-gray-400 text-sm">You trained most at this venue</p>
                </div>
                <div className="h-24">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.venueDistribution} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <XAxis dataKey="name" tick={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="visits" name="Visits" radius={[4, 4, 0, 0]}>
                          {stats.venueDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Sport Consistency */}
            <Card className="bg-navy-dark border-indigo/30 shadow-lg hover:shadow-indigo/10 transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">Sport Consistency</CardTitle>
                  <Trophy className="h-5 w-5 text-indigo-light" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <p className="text-2xl font-bold text-white">{stats.topSportCount} sessions</p>
                  <p className="text-gray-400 text-sm">You played {stats.topSport} {stats.topSportCount} times this year</p>
                </div>
                <div className="h-24">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.sportsDistribution} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <XAxis dataKey="name" tick={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" name="Sessions" radius={[4, 4, 0, 0]}>
                          {stats.sportsDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            {/* Skill Radar */}
            <Card className="bg-navy-dark border-indigo/30 shadow-lg hover:shadow-indigo/10 transition-shadow">
              <CardHeader>
                <CardTitle className="text-white">Your Activity Radar</CardTitle>
                <CardDescription className="text-gray-400">Time spent on different sports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.radarData}>
                        <PolarGrid stroke="#6E59A5" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#C8C8C9' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} />
                        <Radar name="Performance" dataKey="A" stroke="#9b87f5" fill="#9b87f5" fillOpacity={0.6} />
                        <Legend />
                        <Tooltip content={<ChartTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* Personal Bests & Achievements */}
            <Card className="bg-navy-dark border-indigo/30 shadow-lg hover:shadow-indigo/10 transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-white">🏅 Your Highlights</CardTitle>
                </div>
                <CardDescription className="text-gray-400">Personal bests and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center p-3 rounded-lg border border-indigo/20 bg-navy hover:bg-navy-light transition-colors">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-10 h-10 rounded-full bg-indigo/20 flex items-center justify-center">
                          {getIconComponent(achievement.icon)}
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
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
