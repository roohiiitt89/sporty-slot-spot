
import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, momentLocalizer, Views, Resource, Event as RBCEvent } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';

// Types
interface CourtResource {
  id: string;
  name: string;
}

interface BookingEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  status: 'confirmed' | 'pending' | 'maintenance' | 'blocked';
  courtName: string;
  userName?: string;
}

interface AdminCalendarViewProps {
  adminVenues: Array<{ venue_id: string }>;
}

const localizer = momentLocalizer(moment);

const statusColors: Record<string, string> = {
  confirmed: '#22c55e', // green
  pending: '#facc15',   // yellow
  maintenance: '#ef4444', // red
  blocked: '#64748b',   // slate
};

const AdminCalendarView: React.FC<AdminCalendarViewProps> = ({ adminVenues }) => {
  const isMobile = useIsMobile();
  const [resources, setResources] = useState<CourtResource[]>([]);
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: moment().startOf('week').toDate(),
    end: moment().endOf('week').toDate(),
  });
  const [selectedMobileDate, setSelectedMobileDate] = useState<Date>(new Date());

  // Fetch courts/rooms as resources
  const fetchResources = useCallback(async () => {
    let query = supabase.from('courts').select('id, name, venue_id').eq('is_active', true);
    if (adminVenues.length > 0) {
      const venueIds = adminVenues.map(v => v.venue_id);
      query = query.in('venue_id', venueIds);
    }
    const { data, error } = await query;
    if (error) {
      toast({ title: 'Error', description: 'Failed to load courts', variant: 'destructive' });
      return;
    }
    setResources((data || []).map((c: any) => ({ id: c.id, name: c.name })));
  }, [adminVenues]);

  // Fetch bookings and blocked slots as events
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch courts for filtering
      let courtIds: string[] = [];
      if (adminVenues.length > 0) {
        // Only fetch courts for these venues
        const { data: courts } = await supabase.from('courts').select('id').in('venue_id', adminVenues.map(v => v.venue_id));
        courtIds = (courts || []).map((c: any) => c.id);
      }
      // Fetch bookings
      let bookingsQuery = supabase
        .from('bookings')
        .select('id, court_id, booking_date, start_time, end_time, status, guest_name');
      if (adminVenues.length > 0 && courtIds.length > 0) {
        bookingsQuery = bookingsQuery.in('court_id', courtIds);
      }
      bookingsQuery = bookingsQuery
        .gte('booking_date', moment(dateRange.start).format('YYYY-MM-DD'))
        .lte('booking_date', moment(dateRange.end).format('YYYY-MM-DD'));
      const { data: bookings, error: bookingsError } = await bookingsQuery;
      if (bookingsError) throw bookingsError;
      // Fetch blocked slots
      let blocksQuery = supabase
        .from('blocked_slots')
        .select('id, court_id, date, start_time, end_time, reason');
      if (adminVenues.length > 0 && courtIds.length > 0) {
        blocksQuery = blocksQuery.in('court_id', courtIds);
      }
      blocksQuery = blocksQuery
        .gte('date', moment(dateRange.start).format('YYYY-MM-DD'))
        .lte('date', moment(dateRange.end).format('YYYY-MM-DD'));
      const { data: blocks, error: blocksError } = await blocksQuery;
      if (blocksError) throw blocksError;
      // Map bookings to events
      const bookingEvents: BookingEvent[] = (bookings || []).map((b: any) => ({
        id: `booking-${b.id}`,
        title: b.guest_name ? `Booking: ${b.guest_name}` : 'Booking',
        start: moment(`${b.booking_date}T${b.start_time}`).toDate(),
        end: moment(`${b.booking_date}T${b.end_time}`).toDate(),
        resourceId: b.court_id,
        status: b.status,
        courtName: '',
      }));
      // Map blocks to events
      const blockEvents: BookingEvent[] = (blocks || []).map((blk: any) => ({
        id: `block-${blk.id}`,
        title: blk.reason ? `Blocked: ${blk.reason}` : 'Maintenance',
        start: moment(`${blk.date}T${blk.start_time}`).toDate(),
        end: moment(`${blk.date}T${blk.end_time}`).toDate(),
        resourceId: blk.court_id,
        status: 'maintenance',
        courtName: '',
      }));
      setEvents([...bookingEvents, ...blockEvents]);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load events', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [dateRange, adminVenues]);

  // Setup real-time subscription
  useEffect(() => {
    const channel = supabase.channel('admin-calendar-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchEvents();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'blocked_slots' },
        () => {
          fetchEvents();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle drag-and-drop (move booking)
  const onEventDrop = async ({ event, start, end, resourceId }: any) => {
    // Only allow moving bookings, not maintenance
    if (event.id.startsWith('block-')) return;
    // Conflict detection: check for overlap with other bookings/blocks
    const hasConflict = events.some(e =>
      e.resourceId === resourceId &&
      e.id !== event.id &&
      ((start < e.end && end > e.start))
    );
    if (hasConflict) {
      toast({ title: 'Conflict', description: 'This time slot is already booked or blocked.', variant: 'destructive' });
      return;
    }
    // Update booking in backend
    const bookingId = event.id.replace('booking-', '');
    const newDate = moment(start).format('YYYY-MM-DD');
    const newStart = moment(start).format('HH:mm:ss');
    const newEnd = moment(end).format('HH:mm:ss');
    const { error } = await supabase
      .from('bookings')
      .update({
        booking_date: newDate,
        start_time: newStart,
        end_time: newEnd,
        court_id: resourceId,
      })
      .eq('id', bookingId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update booking', variant: 'destructive' });
      return;
    }
    toast({ title: 'Success', description: 'Booking updated', variant: 'default' });
    fetchEvents();
  };

  // Event style getter for color-coding
  const eventStyleGetter = (event: BookingEvent) => {
    const backgroundColor = statusColors[event.status] || '#64748b';
    return {
      style: {
        backgroundColor,
        color: '#fff',
        borderRadius: '6px',
        border: 'none',
        padding: '2px 6px',
        fontSize: '0.95em',
      },
    };
  };

  // Filter events for the selected mobile date
  const mobileDayEvents = events.filter(e =>
    format(e.start, 'yyyy-MM-dd') === format(selectedMobileDate, 'yyyy-MM-dd')
  );

  // Group by court
  const mobileEventsByCourt = resources.map(court => ({
    court,
    events: mobileDayEvents.filter(e => e.resourceId === court.id)
  }));

  // Mobile agenda/list view
  const renderMobileAgenda = () => (
    <div className="space-y-2 bg-navy-950 rounded-xl p-2">
      <div className="mb-2">
        <input
          type="date"
          value={format(selectedMobileDate, 'yyyy-MM-dd')}
          onChange={e => setSelectedMobileDate(new Date(e.target.value))}
          className="w-full p-2 rounded bg-navy-800 text-white border border-navy-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {mobileEventsByCourt.map(({ court, events }) => (
        <div key={court.id} className="bg-navy-900 rounded-lg border border-navy-800 shadow-sm p-2">
          <div className="font-semibold text-indigo-300 mb-1 text-xs uppercase tracking-wide">{court.name}</div>
          {events.length === 0 ? (
            <div className="text-gray-400 text-xs">No bookings or blocks</div>
          ) : (
            <div className="space-y-1">
              {events.sort((a, b) => a.start.getTime() - b.start.getTime()).map(event => (
                <div
                  key={event.id}
                  className="rounded flex items-center justify-between px-2 py-1 mb-1 border border-navy-800 bg-opacity-90 shadow-sm"
                  style={{ background: statusColors[event.status], color: '#fff', minHeight: 36 }}
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-medium truncate">
                      <span>{format(event.start, 'HH:mm')}-{format(event.end, 'HH:mm')}</span>
                      <span className="capitalize px-2 py-0.5 rounded bg-black/20 text-xs font-semibold whitespace-nowrap">{event.status}</span>
                      <span className="truncate font-normal text-xs">{event.title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ height: isMobile ? 'auto' : '80vh', background: 'transparent', borderRadius: 8, padding: 8 }}>
      {loading ? (
        <div className="flex justify-center items-center h-full">Loading calendar...</div>
      ) : isMobile ? (
        renderMobileAgenda()
      ) : (
        <Calendar
          localizer={localizer}
          events={events}
          resources={resources}
          resourceIdAccessor="id"
          resourceTitleAccessor="name"
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.WEEK}
          views={[Views.WEEK, Views.DAY, Views.MONTH]}
          onRangeChange={(range: any) => {
            if (Array.isArray(range)) {
              setDateRange({ start: range[0], end: range[range.length - 1] });
            } else {
              setDateRange({ start: range.start, end: range.end });
            }
          }}
          draggableAccessor={() => true}
          onEventDrop={onEventDrop}
          resizable={false}
          eventPropGetter={eventStyleGetter}
          style={{ height: '100%', background: 'transparent' }}
        />
      )}
    </div>
  );
};

export default AdminCalendarView; 
