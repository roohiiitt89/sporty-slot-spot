import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const { user, userRole } = useAuth();
  const isAdminUser = userRole === 'admin' || userRole === 'super_admin';
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const suppressUnreadCountRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(Date.now());
  const highlightedIdsRef = useRef<Set<string>>(new Set());
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const [filter, setFilter] = useState<'all' | 'venue' | 'booking'>('all');
  const [venueInfo, setVenueInfo] = useState<Record<string, { name: string; image_url: string | null }>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && !notificationAudioRef.current) {
      notificationAudioRef.current = new window.Audio('/notification.mp3');
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let fetchTimeout: NodeJS.Timeout | null = null;
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .or('approved.is.true,approved.is.null')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data) {
        const now = Date.now();
        const newNotifs = data.filter((n: any) => {
          const created = new Date(n.created_at).getTime();
          return created > lastFetchTimeRef.current && !highlightedIdsRef.current.has(n.id);
        });
        if (newNotifs.length > 0) {
          if (notificationAudioRef.current) {
            notificationAudioRef.current.currentTime = 0;
            notificationAudioRef.current.play().catch(() => {});
          }
          setHighlightedIds(newNotifs.map((n: any) => n.id));
          newNotifs.forEach((n: any) => highlightedIdsRef.current.add(n.id));
          setTimeout(() => setHighlightedIds([]), 2000);
        }
        lastFetchTimeRef.current = now;
        setNotifications(data);
        if (suppressUnreadCountRef.current) {
          setUnreadCount(0);
        } else {
          setUnreadCount(data.filter((n: any) => !n.read_status).length);
        }
      }
    };
    fetchNotifications();
    if (dropdownOpen) {
      fetchTimeout = setTimeout(fetchNotifications, 1200);
    }
    return () => {
      if (fetchTimeout) clearTimeout(fetchTimeout);
    };
  }, [user, dropdownOpen]);

  // Fetch venue info for venue_broadcast notifications
  useEffect(() => {
    const fetchVenueInfo = async () => {
      const venueIds = notifications
        .filter(n => n.type === 'venue_broadcast' && n.metadata && n.metadata.venue_id)
        .map(n => n.metadata.venue_id);
      const uniqueVenueIds = Array.from(new Set(venueIds));
      if (uniqueVenueIds.length === 0) return;
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, image_url')
        .in('id', uniqueVenueIds);
      if (!error && data) {
        const info: Record<string, { name: string; image_url: string | null }> = {};
        data.forEach((v: any) => {
          info[v.id] = { name: v.name, image_url: v.image_url };
        });
        setVenueInfo(info);
      }
    };
    fetchVenueInfo();
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'venue') return notifications.filter(n => n.type === 'venue_broadcast');
    if (filter === 'booking') return notifications.filter(n => n.type === 'booking');
    return notifications;
  }, [notifications, filter]);

  const handleDropdownOpen = async (open: boolean) => {
    setDropdownOpen(open);
    if (open && notifications.some(n => !n.read_status)) {
      const unreadIds = notifications.filter(n => !n.read_status).map(n => n.id);
      if (unreadIds.length > 0) {
        setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, read_status: true } : n));
        setUnreadCount(0);
        suppressUnreadCountRef.current = true;
        setTimeout(() => { suppressUnreadCountRef.current = false; }, 2000);
        try {
          await supabase
            .from('notifications')
            .update({ read_status: true })
            .in('id', unreadIds);
        } catch (e) {}
      }
    }
  };

  const handleNotificationClick = (notif: any) => {
    if (notif.type === 'booking' && notif.metadata && notif.metadata.booking_id) {
      navigate('/bookings');
    } else if (notif.type === 'challenge' && notif.metadata && notif.metadata.challenge_id) {
      navigate(`/challenge/${notif.metadata.challenge_id}`);
    } else if (notif.type === 'venue' && notif.metadata && notif.metadata.venue_id) {
      navigate(`/venues/${notif.metadata.venue_id}`);
    } else {
      // Optionally show a modal for other types
    }
  };

  const handleClearAll = async () => {
    const ids = notifications.map(n => n.id);
    if (ids.length > 0) {
      setNotifications([]);
      setUnreadCount(0);
      suppressUnreadCountRef.current = true;
      setTimeout(() => { suppressUnreadCountRef.current = false; }, 2000);
      try {
        await supabase.from('notifications').delete().in('id', ids);
      } catch (e) {}
    }
  };

  // Notification type icons and colors
  const notifTypeMap: Record<string, { icon: React.ReactNode; color: string }> = {
    booking: { icon: <span role="img" aria-label="Booking">📅</span>, color: 'border-blue-400' },
    challenge: { icon: <span role="img" aria-label="Challenge">🏆</span>, color: 'border-yellow-500' },
    tournament: { icon: <span role="img" aria-label="Tournament">🎾</span>, color: 'border-green-500' },
    venue: { icon: <span role="img" aria-label="Venue">🏟️</span>, color: 'border-purple-500' },
    promo: { icon: <span role="img" aria-label="Promo">🎉</span>, color: 'border-pink-500' },
    system: { icon: <span role="img" aria-label="System">⚙️</span>, color: 'border-gray-400' },
    payment: { icon: <span role="img" aria-label="Payment">💳</span>, color: 'border-red-500' },
  };
  const getNotifTypeProps = (type: string) => notifTypeMap[type] || { icon: <span role="img" aria-label="Notification">🔔</span>, color: 'border-slate-300' };

  if (!user || isAdminUser) return null;

  return (
    <div className="md:hidden fixed top-2 right-4 z-[9999] pointer-events-auto">
      <DropdownMenu onOpenChange={handleDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="relative focus:outline-none bg-[#1E3B2C]/80 border border-green-400/30 shadow-lg p-3 min-w-[40px] min-h-[40px] rounded-2xl flex items-center justify-center transition-all duration-200 hover:bg-green-900/80 active:scale-95"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-green-400 drop-shadow" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center border-2 border-white shadow">{unreadCount}</span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto animate-fade-in">
          <div className="px-3 py-2 font-semibold text-navy-dark flex justify-between items-center">
            <span>Notifications</span>
            <div className="flex gap-2">
              <button onClick={handleClearAll} className="text-xs text-red-500 hover:underline">Clear all</button>
            </div>
          </div>
          {/* Filter Tabs */}
          <div className="flex gap-2 px-3 pb-2">
            <button onClick={() => setFilter('all')} className={`text-xs px-2 py-1 rounded ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-navy-700 text-gray-300'}`}>All</button>
            <button onClick={() => setFilter('venue')} className={`text-xs px-2 py-1 rounded ${filter === 'venue' ? 'bg-green-600 text-white' : 'bg-navy-700 text-gray-300'}`}>Venue Updates</button>
            <button onClick={() => setFilter('booking')} className={`text-xs px-2 py-1 rounded ${filter === 'booking' ? 'bg-green-600 text-white' : 'bg-navy-700 text-gray-300'}`}>Bookings</button>
          </div>
          {filteredNotifications.length === 0 && (
            <div className="px-4 py-2 text-gray-500">No notifications</div>
          )}
          {filteredNotifications.map((notif) => {
            const { icon, color } = getNotifTypeProps(notif.type);
            const isVenueBroadcast = notif.type === 'venue_broadcast';
            const venue = isVenueBroadcast && notif.metadata && notif.metadata.venue_id ? venueInfo[notif.metadata.venue_id] : null;
            return (
              <DropdownMenuItem
                key={notif.id}
                className={`flex flex-row items-start gap-2 transition-all duration-150 cursor-pointer pl-2 border-l-4 ${color} ${!notif.read_status ? 'bg-indigo/10 font-semibold' : ''} hover:bg-indigo/20 ${highlightedIds.includes(notif.id) ? 'animate-pulse bg-emerald-100' : ''}`}
                onClick={() => handleNotificationClick(notif)}
              >
                <span className="text-xl mt-0.5">{icon}</span>
                <span className="flex flex-col items-start gap-0.5 w-full">
                  <span className="flex items-center gap-2">
                    {isVenueBroadcast && venue && (
                      <>
                        {venue.image_url && <img src={venue.image_url} alt={venue.name} className="w-5 h-5 rounded-full object-cover border border-gray-400" />}
                        <span className="text-xs text-green-700 font-bold">{venue.name}</span>
                      </>
                    )}
                    <span>{notif.title}</span>
                  </span>
                  <span className="text-xs text-gray-500">{notif.message}</span>
                  <span className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</span>
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NotificationBell; 
