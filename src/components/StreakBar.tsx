import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface StreakData {
  days: boolean[];
  streakCount: number;
}

export const StreakBar: React.FC = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = React.useState<StreakData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStreakData = async () => {
      try {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);

        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('bookings')
          .select('booking_date')
          .eq('user_id', user.id)
          .gte('booking_date', formatDate(sevenDaysAgo))
          .lte('booking_date', formatDate(today))
          .order('booking_date', { ascending: true });

        if (error) throw error;

        const bookingDates = Array.from(
          new Set(data?.map(booking => booking.booking_date))
        );

        const days: boolean[] = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(sevenDaysAgo);
          date.setDate(sevenDaysAgo.getDate() + i);
          const formatted = formatDate(date);
          days.push(bookingDates.includes(formatted));
        }

        // Weekly streak count: 1 streak = any booking in last 7 days
        const streakCount = bookingDates.length > 0 ? 1 : 0;

        setStreakData({ days, streakCount });
      } catch (err) {
        console.error('Error fetching streak data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStreakData();
  }, [user]);

  if (loading || !streakData) return null;

  return (
    <div className="mt-4 w-full max-w-md px-2">
      {/* Animated streak count */}
      <motion.div
        key={streakData.streakCount}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: 1,
          boxShadow: [
            '0 0 0px rgba(255, 193, 7, 0)',
            '0 0 8px rgba(255, 193, 7, 0.7)',
            '0 0 0px rgba(255, 193, 7, 0)',
          ],
        }}
        transition={{ duration: 0.8 }}
        className="mb-3 inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-1 text-sm font-semibold text-black shadow-md ring-1 ring-yellow-600/40"
      >
        <span role="img" aria-label="flame">🔥</span>
        Streak Count: <span className="text-base font-bold">{streakData.streakCount}</span> Week
      </motion.div>

      {/* Streak bar */}
      <div className="flex flex-row gap-1 mb-2">
        {streakData.days.map((hasBooking, index) => {
          const date = new Date();
          date.setDate(date.getDate() - 6 + index);
          const formatted = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          return (
            <div key={index} className="flex-1 group relative">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.1 }}
                className={`h-3 rounded-sm origin-bottom ${
                  hasBooking ? 'bg-green-500' : 'bg-gray-600'
                }`}
              />
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 scale-90 rounded bg-black px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {hasBooking ? `Booked on ${formatted}` : `No booking on ${formatted}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
