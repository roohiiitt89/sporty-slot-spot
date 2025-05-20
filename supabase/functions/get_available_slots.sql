
-- Function to get available slots for a court on a specific date
CREATE OR REPLACE FUNCTION public.get_available_slots(p_court_id uuid, p_date date)
 RETURNS TABLE(start_time time without time zone, end_time time without time zone, is_available boolean)
 LANGUAGE plpgsql
AS $function$
DECLARE
  court_exists boolean;
  court_group_id uuid;
  related_courts uuid[];
BEGIN
  -- First, check if the court exists
  SELECT EXISTS(SELECT 1 FROM courts WHERE id = p_court_id) INTO court_exists;
  IF NOT court_exists THEN
    RAISE EXCEPTION 'Court with ID % does not exist', p_court_id;
  END IF;

  -- Get the court group ID if it exists
  SELECT c.court_group_id INTO court_group_id 
  FROM courts c WHERE c.id = p_court_id;
  
  -- Get all related courts (in the same group)
  IF court_group_id IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO related_courts
    FROM courts
    WHERE court_group_id = court_group_id;
  ELSE
    related_courts := ARRAY[p_court_id];
  END IF;

  RETURN QUERY
  WITH all_slots AS (
    -- Get all template slots for the day of week
    SELECT 
      ts.start_time,
      ts.end_time
    FROM template_slots ts
    WHERE 
      ts.court_id = p_court_id
      AND ts.day_of_week = EXTRACT(DOW FROM p_date)
      AND ts.is_available = true
  ),
  booked_slots AS (
    -- Get all bookings for the specific date and related courts
    SELECT 
      b.start_time,
      b.end_time
    FROM bookings b
    WHERE 
      b.court_id = ANY(related_courts)
      AND b.booking_date = p_date
      AND b.status IN ('confirmed', 'pending')
  ),
  blocked_slots AS (
    -- Get all blocked slots for the specific date and related courts
    SELECT 
      bs.start_time,
      bs.end_time
    FROM blocked_slots bs
    WHERE 
      bs.court_id = ANY(related_courts)
      AND bs.date = p_date
  )
  SELECT 
    s.start_time,
    s.end_time,
    (
      NOT EXISTS (
        SELECT 1 FROM booked_slots b 
        WHERE b.start_time = s.start_time AND b.end_time = s.end_time
      )
      AND
      NOT EXISTS (
        SELECT 1 FROM blocked_slots bl 
        WHERE bl.start_time = s.start_time AND bl.end_time = s.end_time
      )
    ) as is_available
  FROM all_slots s
  ORDER BY s.start_time;
END;
$function$;

-- Create an index to improve query performance on bookings table
DROP INDEX IF EXISTS idx_bookings_court_date_time;
CREATE INDEX IF NOT EXISTS idx_bookings_court_date_time 
ON public.bookings (court_id, booking_date, start_time, end_time);

-- Create an index for blocked slots to improve query performance
DROP INDEX IF EXISTS idx_blocked_slots_court_date_time;
CREATE INDEX IF NOT EXISTS idx_blocked_slots_court_date_time 
ON public.blocked_slots (court_id, date, start_time, end_time);

-- Create or replace the notification trigger to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.notify_booking_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  insert into notifications (
    user_id,
    title,
    message,
    type,
    read_status,
    metadata
  ) values (
    COALESCE(NEW.user_id, NEW.booked_by_admin_id),
    'Booking Confirmed!',
    'Your booking has been confirmed. Get ready to play!',
    'booking',
    false,
    jsonb_build_object('booking_id', NEW.id)
  );
  return NEW;
end;
$function$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS trg_notify_booking_created ON public.bookings;
CREATE TRIGGER trg_notify_booking_created
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_booking_created();

-- Enable realtime for bookings and blocked_slots tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_slots;

-- Set replica identity to FULL for both tables to ensure we get full row data in realtime events
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.blocked_slots REPLICA IDENTITY FULL;

-- Function to fix the Tournament type error
CREATE OR REPLACE FUNCTION public.get_tournament_details(p_tournament_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'id', t.id,
        'name', t.name,
        'description', t.description,
        'slug', t.slug,
        'start_date', t.start_date,
        'end_date', t.end_date,
        'registration_deadline', t.registration_deadline,
        'venue_id', t.venue_id,
        'sport_id', t.sport_id,
        'status', t.status,
        'max_participants', t.max_participants,
        'entry_fee', t.entry_fee,
        'rules', t.rules,
        'registration_count', (SELECT COUNT(*) FROM tournament_registrations tr WHERE tr.tournament_id = t.id),
        'created_by', t.organizer_id,
        'organizer_name', p.full_name,
        'contact_info', p.email,
        'is_approved', true
    ) INTO result
    FROM tournaments t
    JOIN profiles p ON t.organizer_id = p.id
    WHERE t.id = p_tournament_id;
    
    RETURN result;
END;
$function$;
