import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, XAxis, Tooltip, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/AuthContext';
import { Clock, MapPin, Trophy } from 'lucide-react';

// 1. Error Boundary Component
class ErrorBoundary extends React.Component<{
  fallback: React.ReactNode;
  children: React.ReactNode;
}, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// 2. Chart Fallback Wrapper
const ChartFallback = ({ children }: { children: React.ReactNode }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900/10 rounded-lg">
        <p className="text-gray-400 text-sm">Chart unavailable</p>
      </div>
    );
  }

  return (
    <ErrorBoundary 
      fallback={
        <div className="flex items-center justify-center h-full bg-gray-900/10 rounded-lg">
          <p className="text-gray-400 text-sm">Chart failed to load</p>
        </div>
      }
    >
      <div onError={() => setError(true)}>
        {children}
      </div>
    </ErrorBoundary>
  );
};

// 3. Safe Tooltip Component
const SafeTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload || {};
  const displayItems = [
    { label: 'Month', value: data.month },
    { label: 'Hours', value: data.hours },
    { label: 'Visits', value: data.visits },
    { label: 'Count', value: data.count },
    { label: 'Score', value: data.A }
  ].filter(item => item.value !== undefined);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-2 text-xs">
      {displayItems.map(item => (
        <div key={item.label}>{item.label}: <strong>{item.value}</strong></div>
      ))}
    </div>
  );
};

// 4. Dashboard Component
export default function PerformanceDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    timeData: [] as Array<{ month: string; hours: number }>,
    venueData: [] as Array<{ name: string; visits: number }>,
    sportData: [] as Array<{ name: string; count: number }>,
    radarData: [] as Array<{ subject: string; A: number }>,
    stats: {
      totalHours: 0,
      topVenue: '',
      topSport: '',
      sportCount: 0
    }
  });

  useEffect(() => {
    if (!user) return;

    // Mock data load
    setTimeout(() => {
      setData({
        timeData: [
          { month: 'Jan', hours: 5 },
          { month: 'Feb', hours: 8 },
          { month: 'Mar', hours: 12 }
        ],
        venueData: [
          { name: 'East Delhi', visits: 12 },
          { name: 'South Delhi', visits: 8 }
        ],
        sportData: [
          { name: 'Football', count: 18 },
          { name: 'Cricket', count: 12 }
        ],
        radarData: [
          { subject: 'Football', A: 120 },
          { subject: 'Cricket', A: 98 }
        ],
        stats: {
          totalHours: 25,
          topVenue: 'East Delhi',
          topSport: 'Football',
          sportCount: 18
        }
      });
    }, 500);
  }, [user]);

  if (!user) return <div className="text-center py-8">Please sign in</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Performance Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Time Played</span>
              <Clock className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.stats.totalHours} hours</p>
            <div className="h-48 mt-4">
              <ChartFallback>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.timeData}>
                    <XAxis dataKey="month" />
                    <Tooltip content={<SafeTooltip />} />
                    <Area type="monotone" dataKey="hours" stroke="#4CAF50" fill="#4CAF50" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartFallback>
            </div>
          </CardContent>
        </Card>

        {/* Venue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Top Venue</span>
              <MapPin className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.stats.topVenue}</p>
            <div className="h-48 mt-4">
              <ChartFallback>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.venueData}>
                    <XAxis dataKey="name" />
                    <Tooltip content={<SafeTooltip />} />
                    <Bar dataKey="visits">
                      {data.venueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#9b87f5', '#4CAF50'][index % 2]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartFallback>
            </div>
          </CardContent>
        </Card>

        {/* Sport Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>Top Sport</span>
              <Trophy className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.stats.sportCount} sessions</p>
            <div className="h-48 mt-4">
              <ChartFallback>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sportData}>
                    <XAxis dataKey="name" />
                    <Tooltip content={<SafeTooltip />} />
                    <Bar dataKey="count">
                      {data.sportData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#9b87f5', '#4CAF50'][index % 2]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartFallback>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ChartFallback>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar dataKey="A" stroke="#9b87f5" fill="#9b87f5" fillOpacity={0.6} />
                  <Tooltip content={<SafeTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartFallback>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
