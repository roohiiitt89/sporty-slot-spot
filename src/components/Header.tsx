import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, CalendarDays, LogOut, LayoutGrid, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    user,
    signOut,
    userRole
  } = useAuth();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipedNotifId, setSwipedNotifId] = useState<string | null>(null);
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const prevNotifIdsRef = useRef<string[]>([]);
  const [recentlyMarkedAllRead, setRecentlyMarkedAllRead] = useState(false);
  const suppressUnreadCountRef = useRef(false);
  
  // Notification sound: useRef to persist across renders
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined' && !notificationAudioRef.current) {
      notificationAudioRef.current = new window.Audio('/notification.mp3');
    }
  }, []);
  
  // Store the timestamp of the last fetch to identify new notifications
  const lastFetchTimeRef = useRef<number>(Date.now());
  const highlightedIdsRef = useRef<Set<string>>(new Set());
  
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
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Track read notification IDs in sessionStorage
  const READ_KEY = 'g2p_read_notif_ids';
  const getReadIds = () => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem(READ_KEY) || '[]'));
    } catch {
      return new Set();
    }
  };
  const saveReadIds = (ids: string[]) => {
    sessionStorage.setItem(READ_KEY, JSON.stringify(ids));
  };
  const [venueInfo, setVenueInfo] = useState<Record<string, { name: string; image_url: string | null }>>({});
  
  useEffect(() => {
    if (!user) return;
    let fetchTimeout: NodeJS.Timeout | null = null;
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      // Only show venue_broadcast if approved, others always show
      const filtered = data ? data.filter((n: any) => n.type !== 'venue_broadcast' || n.approved === true || n.approved === null) : [];
      if (!error) {
        // Get locally read IDs
        const readIds = getReadIds();
        // Only highlight and play sound for truly new notifications
        const now = Date.now();
        const newNotifs = filtered.filter((n: any) => {
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
        setNotifications(filtered);
        if (suppressUnreadCountRef.current) {
          setUnreadCount(0);
        } else {
          setUnreadCount(filtered.filter((n: any) => !n.read_status && !readIds.has(n.id)).length);
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
  // eslint-disable-next-line
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
  
  const filteredNotifications = useMemo(() => notifications, [notifications]);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isProfileOpen) setIsProfileOpen(false);
  };
  
  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
  };
  
  const handleSignOut = async () => {
    await signOut();
    setIsProfileOpen(false);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };
  
  const isAdminUser = userRole === 'admin' || userRole === 'super_admin';
  
  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read_status: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read_status: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };
  
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    setSwipeStartX(e.touches[0].clientX);
    setSwipedNotifId(id);
  };
  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    if (swipedNotifId !== id || swipeStartX === null) return;
    const deltaX = e.touches[0].clientX - swipeStartX;
    // Optionally, you can animate the item as it moves
  };
  const handleTouchEnd = (e: React.TouchEvent, id: string) => {
    if (swipedNotifId !== id || swipeStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - swipeStartX;
    if (Math.abs(deltaX) > 60) {
      // Swipe detected, mark as read
      markAsRead(id);
    }
    setSwipeStartX(null);
    setSwipedNotifId(null);
  };
  
  const handleDropdownOpen = async (open: boolean) => {
    setDropdownOpen(open);
    if (open) {
      const unreadIds = notifications.filter(n => !n.read_status).map(n => n.id);
      setUnreadCount(0);
      suppressUnreadCountRef.current = true;
      setTimeout(() => { suppressUnreadCountRef.current = false; }, 2000);
      if (unreadIds.length > 0) {
        setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, read_status: true } : n));
        // Save locally as read
        const prevRead = Array.from(getReadIds());
        saveReadIds([...new Set([...prevRead, ...unreadIds])]);
        try {
          await supabase
            .from('notifications')
            .update({ read_status: true })
            .in('id', unreadIds);
        } catch (e) {
          // Optionally show error
        }
      }
    }
  };
  
  const handleNotificationClick = (notif: any) => {
    markAsRead(notif.id);
    if (notif.type === 'booking' && notif.metadata && notif.metadata.booking_id) {
      navigate('/bookings');
    } else if (notif.type === 'challenge' && notif.metadata && notif.metadata.challenge_id) {
      navigate(`/challenge/${notif.metadata.challenge_id}`);
    } else if (notif.type === 'venue' && notif.metadata && notif.metadata.venue_id) {
      navigate(`/venues/${notif.metadata.venue_id}`);
    } else {
      setSelectedNotif(notif);
      setShowNotifModal(true);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read_status).map(n => n.id);
    if (unreadIds.length > 0) {
      setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, read_status: true } : n));
      setUnreadCount(0);
      suppressUnreadCountRef.current = true;
      setTimeout(() => { suppressUnreadCountRef.current = false; }, 2000);
      try {
        await supabase.from('notifications').update({ read_status: true }).in('id', unreadIds);
      } catch (e) {
        // Optionally show error
      }
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
      } catch (e) {
        // Optionally show error
      }
    }
  };
  
  // Don't show the header on any admin routes
  if (isAdminUser && (location.pathname === '/admin' || location.pathname.startsWith('/admin/'))) {
    return null;
  }
  
  return (
    <header className="fixed w-full z-50 transition-all duration-300 bg-black/60 py-4 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to={isAdminUser ? "/admin" : "/"} className="flex items-center">
            <span className={`text-2xl font-bold transition-colors duration-300 ${isScrolled ? 'text-indigo' : 'text-white'}`}>
  Grid
  <span className="text-green-400">२</span>
  Play
</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {!isAdminUser && (
              // Regular User Navigation Links
              <>
                <Link to="/" className={`font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>Home</Link>
                <Link to="/venues" className={`font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>Venues</Link>
                <Link to="/sports" className={`font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>Sports</Link>
                <Link to="/tournaments" className={`font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>Tournaments</Link>
              </>
            )}
            
            {/* Show different options based on authentication status */}
            {user ? (
              <>
                {!isAdminUser && (
                  <Link to="/bookings" className={`flex items-center font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>
                    <CalendarDays className="w-4 h-4 mr-1" />
                    My Bookings
                  </Link>
                )}
                
                {/* Profile dropdown */}
                <div className="relative">
                  <button onClick={toggleProfileMenu} className={`flex items-center font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>
                    <User className="w-4 h-4 mr-1" />
                    Profile
                  </button>
                  
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      {!isAdminUser && (
                        <Link to="/profile" className="block px-4 py-2 text-sm text-navy-dark hover:bg-slate-light" onClick={() => setIsProfileOpen(false)}>
                          My Profile
                        </Link>
                      )}
                      {isAdminUser && (
                        <Link to="/admin" className="flex items-center px-4 py-2 text-sm text-navy-dark hover:bg-slate-light" onClick={() => setIsProfileOpen(false)}>
                          <LayoutGrid className="w-4 h-4 mr-1" />
                          Admin Dashboard
                        </Link>
                      )}
                      <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                        <LogOut className="w-4 h-4 mr-1" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>

                {user && !isAdminUser && (
                  <div className="relative">
                    <DropdownMenu onOpenChange={handleDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <button className="relative focus:outline-none">
                          <Bell className={`w-6 h-6 ${isScrolled ? 'text-navy-dark' : 'text-white'}`} />
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">{unreadCount}</span>
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto animate-fade-in">
                        <div className="px-3 py-2 font-semibold text-navy-dark flex justify-between items-center">
                          <span>Notifications</span>
                          <div className="flex gap-2">
                            <Link to="/notifications" className="text-xs text-indigo hover:underline">View All</Link>
                            <button onClick={handleMarkAllAsRead} className="text-xs text-indigo hover:underline">Mark all as read</button>
                            <button onClick={handleClearAll} className="text-xs text-red-500 hover:underline">Clear all</button>
                          </div>
                        </div>
                        {notifications.length === 0 && (
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
                              onTouchStart={(e) => handleTouchStart(e, notif.id)}
                              onTouchMove={(e) => handleTouchMove(e, notif.id)}
                              onTouchEnd={(e) => handleTouchEnd(e, notif.id)}
                            >
                              <span className="text-xl mt-0.5">{icon}</span>
                              <span className="flex flex-col items-start gap-0.5">
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
                )}
              </>
            ) : (
              <>
                <Link to="/login" className={`flex items-center font-medium transition-colors duration-300 ${isScrolled ? 'text-navy-dark hover:text-indigo' : 'text-white hover:text-indigo-light'}`}>
                  <User className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
                <Link to="/register" className={`nike-button ${isScrolled ? 'bg-indigo text-white' : 'bg-white text-indigo'}`}>
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          {(!user) && (
            <button onClick={toggleMobileMenu} className={`md:hidden ${isScrolled ? 'text-navy-dark' : 'text-white'}`}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-[61px] left-0 right-0 bg-white shadow-lg z-40">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-lg text-navy-dark">Menu</span>
              {/* Mobile notification bell */}
              {user && !isAdminUser && (
                <div className="md:hidden fixed top-4 right-4 z-50">
                  <DropdownMenu onOpenChange={handleDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <button className="relative focus:outline-none bg-white/80 rounded-full shadow p-2">
                        <Bell className="w-7 h-7 text-navy-dark" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">{unreadCount}</span>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto animate-fade-in">
                      <div className="px-3 py-2 font-semibold text-navy-dark flex justify-between items-center">
                        <span>Notifications</span>
                        <div className="flex gap-2">
                          <Link to="/notifications" className="text-xs text-indigo hover:underline">View All</Link>
                          <button onClick={handleMarkAllAsRead} className="text-xs text-indigo hover:underline">Mark all as read</button>
                          <button onClick={handleClearAll} className="text-xs text-red-500 hover:underline">Clear all</button>
                        </div>
                      </div>
                      {notifications.length === 0 && (
                        <div className="px-4 py-2 text-gray-500">No notifications</div>
                      )}
                      {notifications.map((notif) => (
                        (() => {
                          const { icon, color } = getNotifTypeProps(notif.type);
                          return (
                            <DropdownMenuItem
                              key={notif.id}
                              className={`flex flex-row items-start gap-2 transition-all duration-150 cursor-pointer pl-2 border-l-4 ${color} ${!notif.read_status ? 'bg-indigo/10 font-semibold' : ''} hover:bg-indigo/20 ${highlightedIds.includes(notif.id) ? 'animate-pulse bg-emerald-100' : ''}`}
                              onClick={() => handleNotificationClick(notif)}
                              onTouchStart={(e) => handleTouchStart(e, notif.id)}
                              onTouchMove={(e) => handleTouchMove(e, notif.id)}
                              onTouchEnd={(e) => handleTouchEnd(e, notif.id)}
                            >
                              <span className="text-xl mt-0.5">{icon}</span>
                              <span className="flex flex-col items-start gap-0.5">
                                <span>{notif.title}</span>
                                <span className="text-xs text-gray-500">{notif.message}</span>
                                <span className="text-[10px] text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</span>
                              </span>
                            </DropdownMenuItem>
                          );
                        })()
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            {!isAdminUser && (
              // Regular User Mobile Navigation Links
              <>
                <Link to="/" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Home</Link>
                <Link to="/venues" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Venues</Link>
                <Link to="/sports" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Sports</Link>
                <Link to="/tournaments" className="font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>Tournaments</Link>
              </>
            )}
            
            {user ? (
              <>
                {!isAdminUser && (
                  <Link to="/bookings" className="flex items-center font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>
                    <CalendarDays className="w-4 h-4 mr-1" />
                    My Bookings
                  </Link>
                )}
                
                {isAdminUser && (
                  <Link to="/admin" className="flex items-center font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>
                    <LayoutGrid className="w-4 h-4 mr-1" />
                    Admin Dashboard
                  </Link>
                )}
                
                {!isAdminUser && (
                  <Link to="/profile" className="flex items-center font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>
                    <User className="w-4 h-4 mr-1" />
                    My Profile
                  </Link>
                )}
                
                <button onClick={handleSignOut} className="flex items-center font-medium text-red-600 hover:text-red-800 py-2 w-full text-left">
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="flex items-center font-medium text-navy-dark hover:text-indigo py-2" onClick={toggleMobileMenu}>
                  <User className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
                <Link to="/register" className="bg-indigo text-white py-2 px-4 rounded text-center font-medium" onClick={toggleMobileMenu}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <Dialog open={showNotifModal} onOpenChange={setShowNotifModal}>
        <DialogContent>
          <DialogTitle>{selectedNotif?.title}</DialogTitle>
          <div className="mt-2 text-gray-700">{selectedNotif?.message}</div>
          {selectedNotif?.metadata && (
            <pre className="mt-2 bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(selectedNotif.metadata, null, 2)}</pre>
          )}
          <div className="mt-4 flex justify-end">
            <button onClick={() => setShowNotifModal(false)} className="px-4 py-2 bg-indigo text-white rounded">Close</button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
