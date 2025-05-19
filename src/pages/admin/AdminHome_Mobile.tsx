import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { BarChart, Calendar, Map, Users, Star, MessageCircle, HelpCircle, LogOut } from 'lucide-react';

const quickLinks = [
  {
    title: 'Analytics',
    path: '/admin/analytics-mobile',
    icon: <BarChart className="w-6 h-6 text-indigo-400" />,
    desc: 'View stats & trends',
    color: 'from-indigo-500 to-blue-400',
  },
  {
    title: 'Bookings',
    path: '/admin/bookings-mobile',
    icon: <Calendar className="w-6 h-6 text-green-400" />,
    desc: 'Manage all bookings',
    color: 'from-green-500 to-teal-400',
  },
  {
    title: 'Venues',
    path: '/admin/venues-mobile',
    icon: <Map className="w-6 h-6 text-pink-400" />,
    desc: 'Edit your venues',
    color: 'from-pink-500 to-red-400',
  },
  {
    title: 'Sports',
    path: '/admin/sports-mobile',
    icon: <Users className="w-6 h-6 text-yellow-400" />,
    desc: 'Manage sports',
    color: 'from-yellow-500 to-orange-400',
  },
  {
    title: 'Reviews',
    path: '/admin/reviews-mobile',
    icon: <Star className="w-6 h-6 text-purple-400" />,
    desc: 'See user reviews',
    color: 'from-purple-500 to-fuchsia-400',
  },
  {
    title: 'Messages',
    path: '/admin/messages-mobile',
    icon: <MessageCircle className="w-6 h-6 text-cyan-400" />,
    desc: 'User messages',
    color: 'from-cyan-500 to-blue-300',
  },
  {
    title: 'Help Desk',
    path: '/admin/help-mobile',
    icon: <HelpCircle className="w-6 h-6 text-rose-400" />,
    desc: 'Support requests',
    color: 'from-rose-500 to-pink-300',
  },
];

const AdminHome_Mobile: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-800 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md shadow-md">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-white tracking-wide">Grid2Play</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300 font-medium">{user?.user_metadata?.full_name || user?.email || 'Admin'}</span>
            <LogOut className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </header>
      {/* Welcome Section */}
      <section className="px-4 pt-6 pb-2">
        <h2 className="text-xl font-semibold text-white mb-1">Welcome, {user?.user_metadata?.full_name || user?.email || 'Admin'}!</h2>
        <p className="text-gray-300 text-sm mb-2">Your admin dashboard for managing venues, bookings, and more.</p>
        <div className="bg-navy-800/80 rounded-lg px-3 py-2 mt-2 text-xs text-gray-200">
          <span className="font-semibold text-emerald-300">Tip:</span> Use the quick links below to access all admin features on the go. This page is optimized for mobile—tap any card to get started!
        </div>
      </section>
      {/* Quick Links */}
      <section className="px-2">
        <div className="grid grid-cols-2 gap-2">
          {quickLinks.map(link => (
            <Link
              to={link.path}
              key={link.title}
              className={`rounded-lg shadow bg-gradient-to-br ${link.color} p-2 flex flex-col items-start min-h-[70px] transition-transform hover:scale-105`}
            >
              <div className="mb-1">{React.cloneElement(link.icon, { className: 'w-5 h-5 ' + link.icon.props.className })}</div>
              <div className="text-white font-semibold text-sm mb-0.5">{link.title}</div>
              <div className="text-[11px] text-white/80 leading-tight">{link.desc}</div>
            </Link>
          ))}
        </div>
      </section>
      {/* Dynamic Info Section */}
      <section className="px-4 mt-8">
        <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-white shadow-md">
          <h3 className="font-semibold text-lg mb-2">Platform Insights</h3>
          <ul className="text-sm space-y-1">
            <li>• Real-time analytics for your venues</li>
            <li>• Manage bookings, customers, and reviews</li>
            <li>• Respond to messages and help requests</li>
            <li>• Mobile-optimized for on-the-go management</li>
          </ul>
        </div>
      </section>
      {/* Footer */}
      <footer className="fixed bottom-0 left-0 w-full bg-black/80 text-gray-300 text-center py-2 text-xs tracking-wide z-20">
        &copy; {new Date().getFullYear()} Grid2Play Admin
      </footer>
    </div>
  );
};

export default AdminHome_Mobile; 