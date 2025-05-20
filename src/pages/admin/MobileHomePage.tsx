
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar,
  Ban,
  BarChart3,
  BookOpen,
  Clock,
  Users,
  Settings,
  TrendingUp,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AdminMobileHomePage: React.FC = () => {
  const { user, userRole } = useAuth();

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-navy-900 to-navy-800">
      {/* Header */}
      <header className="bg-navy-900/90 backdrop-blur-sm shadow-md px-4 py-6 mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        {userRole && (
          <Badge variant="outline" className="mt-2 text-xs border-indigo-400 text-indigo-300">
            {userRole === 'super_admin' ? 'Super Administrator' : 'Administrator'}
          </Badge>
        )}
      </header>

      <div className="px-4 pb-6">
        <h2 className="text-lg font-medium text-white mb-4">Court Management</h2>
        
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link to="/admin/book-for-customer-mobile">
            <Card className="h-28 flex flex-col items-center justify-center p-3 bg-indigo-900/60 border-indigo-500/30 hover:bg-indigo-800/70 transition-colors">
              <Calendar className="h-8 w-8 text-indigo-300 mb-2" />
              <span className="text-sm text-center font-medium text-white">Book for Customer</span>
            </Card>
          </Link>
          
          <Link to="/admin/block-time-slots-mobile">
            <Card className="h-28 flex flex-col items-center justify-center p-3 bg-rose-900/60 border-rose-500/30 hover:bg-rose-800/70 transition-colors">
              <Ban className="h-8 w-8 text-rose-300 mb-2" />
              <span className="text-sm text-center font-medium text-white">Block Time Slots</span>
            </Card>
          </Link>
          
          <Link to="/admin/real-time-availability-mobile">
            <Card className="h-28 flex flex-col items-center justify-center p-3 bg-emerald-900/60 border-emerald-500/30 hover:bg-emerald-800/70 transition-colors">
              <Clock className="h-8 w-8 text-emerald-300 mb-2" />
              <span className="text-sm text-center font-medium text-white">Real-Time Availability</span>
            </Card>
          </Link>
          
          <Link to="/admin/booking-management-mobile">
            <Card className="h-28 flex flex-col items-center justify-center p-3 bg-cyan-900/60 border-cyan-500/30 hover:bg-cyan-800/70 transition-colors">
              <BookOpen className="h-8 w-8 text-cyan-300 mb-2" />
              <span className="text-sm text-center font-medium text-white">Manage Bookings</span>
            </Card>
          </Link>
        </div>

        <h2 className="text-lg font-medium text-white mb-4">Analytics & Reports</h2>
        
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link to="/admin/analytics-mobile">
            <Card className="h-28 flex flex-col items-center justify-center p-3 bg-amber-900/60 border-amber-500/30 hover:bg-amber-800/70 transition-colors">
              <BarChart3 className="h-8 w-8 text-amber-300 mb-2" />
              <span className="text-sm text-center font-medium text-white">Analytics</span>
            </Card>
          </Link>
          
          <Link to="/admin/revenue-mobile">
            <Card className="h-28 flex flex-col items-center justify-center p-3 bg-green-900/60 border-green-500/30 hover:bg-green-800/70 transition-colors">
              <TrendingUp className="h-8 w-8 text-green-300 mb-2" />
              <span className="text-sm text-center font-medium text-white">Revenue</span>
            </Card>
          </Link>
        </div>

        <h2 className="text-lg font-medium text-white mb-4">Customer Support</h2>
        
        <div className="grid grid-cols-2 gap-3">
          <Link to="/admin/customer-chats-mobile">
            <Card className="h-28 flex flex-col items-center justify-center p-3 bg-purple-900/60 border-purple-500/30 hover:bg-purple-800/70 transition-colors">
              <MessageCircle className="h-8 w-8 text-purple-300 mb-2" />
              <span className="text-sm text-center font-medium text-white">Customer Chats</span>
            </Card>
          </Link>
          
          <Link to="/admin/help-requests-mobile">
            <Card className="h-28 flex flex-col items-center justify-center p-3 bg-blue-900/60 border-blue-500/30 hover:bg-blue-800/70 transition-colors">
              <HelpCircle className="h-8 w-8 text-blue-300 mb-2" />
              <span className="text-sm text-center font-medium text-white">Help Requests</span>
            </Card>
          </Link>
          
          {userRole === 'super_admin' && (
            <>
              <Link to="/admin/users-mobile">
                <Card className="h-28 flex flex-col items-center justify-center p-3 bg-orange-900/60 border-orange-500/30 hover:bg-orange-800/70 transition-colors">
                  <Users className="h-8 w-8 text-orange-300 mb-2" />
                  <span className="text-sm text-center font-medium text-white">User Management</span>
                </Card>
              </Link>
              
              <Link to="/admin/settings-mobile">
                <Card className="h-28 flex flex-col items-center justify-center p-3 bg-gray-700/60 border-gray-500/30 hover:bg-gray-600/70 transition-colors">
                  <Settings className="h-8 w-8 text-gray-300 mb-2" />
                  <span className="text-sm text-center font-medium text-white">System Settings</span>
                </Card>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMobileHomePage;
