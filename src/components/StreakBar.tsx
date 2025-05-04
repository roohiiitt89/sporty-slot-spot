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
        // Get the current date and calculate the past 7 days
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6); // 6 days ago + today = 7 days

        // Format dates for query
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        // Query to get bookings in the last 7 days
        const { data, error } = await supabase
          .from('bookings')
          .select('booking_date')
          .eq('user_id', user.id)
          .gte('booking_date', formatDate(sevenDaysAgo))
          .lte('booking_date', formatDate(today))
          .order('booking_date', { ascending: true });

        if (error) throw error;

        // Create an array of unique booking dates
        const bookingDates = Array.from(new Set((data || []).map(booking => booking.booking_date)));


        // Create streak data for the last 7 days (including today)
        const days: boolean[] = [];
        let currentStreak = 0;
        let checkingStreak = true;

        for (let i = 0; i < 7; i++) {
          const date = new Date(sevenDaysAgo);
          date.setDate(sevenDaysAgo.getDate() + i);
          const dateStr = formatDate(date);

          const hasBooking = bookingDates.includes(dateStr);
          days.push(hasBooking);

          // Calculate current streak (only if we're still checking)
          if (checkingStreak) {
            if (hasBooking) {
              currentStreak++;
            } else {
              // If today is the last day and has no booking, don't break streak yet
              if (i < 6 || !dateStr === formatDate(today)) {
                checkingStreak = false;
                currentStreak = 0;
              }
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

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo"></div>
      </div>
    );
  }

  if (!streakData) return null;

  return (
    <div className="streak-container mb-6">
      <h4 className="text-lg font-semibold mb-3 text-white">Booking Streak</h4>
      <div className="flex justify-between gap-1">
        {streakData.days.map((hasBooking, index) => (
          <div 
            key={index}
            className={`flex-1 h-3 rounded-sm ${hasBooking ? 'bg-green-500' : 'bg-gray-500'}`}
            title={hasBooking ? 'Booked' : 'Not booked'}
          />
        ))}
      </div>
      <div className="mt-2 text-center">
        {streakData.currentStreak === 7 ? (
          <p className="text-green-400 font-medium">🔥 7-Day Streak Achieved!</p>
        ) : streakData.currentStreak > 0 ? (
          <p className="text-white">You're on a {streakData.currentStreak}-day streak!</p>
        ) : (
          <p className="text-gray-300">Start a booking streak!</p>
        )}
      </div>
    </div>
  );
};
