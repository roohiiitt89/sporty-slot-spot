
-- Function to get available slots for a court on a specific date
CREATE OR REPLACE FUNCTION public.get_available_slots(p_court_id uuid, p_date date)
 RETURNS TABLE(start_time time without time zone, end_time time without time zone, is_available boolean)
 LANGUAGE plpgsql
AS $function$
DECLARE
  court_exists boolean;
BEGIN
  -- First, check if the court exists
  SELECT EXISTS(SELECT 1 FROM courts WHERE id = p_court_id) INTO court_exists;
  IF NOT court_exists THEN
    RAISE EXCEPTION 'Court with ID % does not exist', p_court_id;
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
    -- Get all bookings for the specific date and court
    SELECT 
      b.start_time,
      b.end_time
    FROM bookings b
    WHERE 
      b.court_id = p_court_id
      AND b.booking_date = p_date
      AND b.status IN ('confirmed', 'pending')
  ),
  blocked_slots AS (
    -- Get all blocked slots for the specific date and court
    SELECT 
      bs.start_time,
      bs.end_time
    FROM blocked_slots bs
    WHERE 
      bs.court_id = p_court_id
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

-- Enable realtime for bookings and blocked_slots tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_slots;

-- Set replica identity to FULL for both tables to ensure we get full row data in realtime events
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.blocked_slots REPLICA IDENTITY FULL;
