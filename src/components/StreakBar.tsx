import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StreakData {
  days: boolean[];
  currentStreak: number;
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
          new Set((data || []).map(booking => booking.booking_date))
        );

        const days: boolean[] = [];
        let currentStreak = 0;
        let checkingStreak = true;

        for (let i = 0; i < 7; i++) {
          const date = new Date(sevenDaysAgo);
          date.setDate(sevenDaysAgo.getDate() + i);
          const dateStr = formatDate(date);

          const hasBooking = bookingDates.includes(dateStr);
          days.push(hasBooking);

          if (checkingStreak) {
            if (hasBooking) {
              currentStreak++;
            } else {
              checkingStreak = false;
            }
          }
        }

        setStreakData({ days, currentStreak });
      } catch (error) {
        console.error('Error fetching streak data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreakData();
  }, [user]);

  if (!user || loading || !streakData) return null;

  return (
    <div className="streak-container mb-6 p-4 bg-zinc-900 rounded-xl shadow-lg">
      <h4 className="text-lg font-semibold mb-2 text-white">📅 Booking Streak</h4>
      
      <div className="flex justify-between gap-1 mb-2">
        {streakData.days.map((hasBooking, index) => (
          <div
            key={index}
            className={`flex-1 h-3 rounded-sm ${hasBooking ? 'bg-green-500' : 'bg-gray-600'}`}
            title={hasBooking ? 'Booked' : 'Not booked'}
          />
        ))}
      </div>

      <div className="text-center mb-1">
        {streakData.currentStreak === 7 ? (
          <p className="text-green-400 font-semibold">🔥 7-Day Streak Achieved!</p>
        ) : streakData.currentStreak > 0 ? (
          <p className="text-white">You're on a {streakData.currentStreak}-day streak!</p>
        ) : (
          <p className="text-gray-400">Start your streak today!</p>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Don't lose your streak! 1-week streak = 1 slot booking every day 🔒
      </p>
    </div>
  );
};
