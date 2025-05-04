import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StreakData {
  days: boolean[];
  currentStreak: number;
  streakCount: number;
}

export const StreakBar: React.FC = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = React.useState<StreakData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchStreakData = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const pastWeeks = 4;
      const startDate = new Date();
      startDate.setDate(today.getDate() - (pastWeeks * 7 - 1));
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('bookings')
        .select('booking_date')
        .eq('user_id', user.id)
        .gte('booking_date', formatDate(startDate))
        .lte('booking_date', formatDate(today));

      if (error) throw error;

      const bookingDates = Array.from(new Set((data || []).map(b => b.booking_date)));

      const days: boolean[] = [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);

      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(sevenDaysAgo.getDate() + i);
        const dateStr = formatDate(d);
        days.push(bookingDates.includes(dateStr));
      }

      let streakCount = 0;
      let broken = false;

      for (let w = 0; w < pastWeeks; w++) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - w * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() - 6);

        const weekDates: string[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(weekEnd);
          d.setDate(weekEnd.getDate() + i);
          weekDates.push(formatDate(d));
        }

        const booked = weekDates.some(date => bookingDates.includes(date));
        if (booked && !broken) {
          streakCount++;
        } else {
          broken = true;
        }
      }

      setStreakData({
        days,
        currentStreak: days.filter(Boolean).length,
        streakCount,
      });
    } catch (err) {
      console.error('Error fetching streak:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and on Supabase changes
  React.useEffect(() => {
    fetchStreakData();
  }, [user]);

  React.useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('streak-booking-listen')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchStreakData(); // Refresh on new booking
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user || loading || !streakData) return null;

  return (
    <div className="streak-container mb-6 p-4 bg-zinc-900 rounded-xl shadow-md">
      <h4 className="text-lg font-semibold mb-2 text-white">🔥 Weekly Booking Streak</h4>

      <div className="flex flex-row gap-1 mb-2">
        {streakData.days.map((hasBooking, index) => {
          const date = new Date();
          date.setDate(date.getDate() - 6 + index);
          const formatted = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          const isFullStreak = streakData.days.every(Boolean);
          const color = hasBooking
            ? isFullStreak
              ? 'bg-yellow-400'
              : 'bg-green-500'
            : 'bg-gray-600';

          return (
            <div key={index} className="flex-1 group relative">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`h-3 rounded-sm origin-bottom transition-all duration-500 ${color}`}
              />
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 scale-90 rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {hasBooking ? `Booked on ${formatted}` : `No booking on ${formatted}`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-white mb-1">
        {streakData.streakCount > 0 ? (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="inline-block"
          >
            <p>
              🏆 You've maintained your streak for{' '}
              <span className="font-bold text-green-400">{streakData.streakCount}</span>{' '}
              {streakData.streakCount === 1 ? 'week' : 'weeks'} in a row!
            </p>
          </motion.div>
        ) : (
          <p className="text-gray-400">Start your booking streak today!</p>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Keep the streak alive! ✅ Just 1 slot per week keeps your streak going.
      </p>
    </div>
  );
};
