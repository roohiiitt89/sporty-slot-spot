
-- Function to check for overlapping bookings
CREATE OR REPLACE FUNCTION public.check_booking_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    conflicts INTEGER;
    related_courts UUID[];
BEGIN
    -- Get related courts (courts in the same group)
    SELECT ARRAY_AGG(id) INTO related_courts
    FROM public.courts
    WHERE (court_group_id = (
        SELECT court_group_id FROM public.courts WHERE id = NEW.court_id
    ) AND court_group_id IS NOT NULL)
    OR id = NEW.court_id;

    -- Check for conflicts with existing bookings
    SELECT COUNT(*) INTO conflicts
    FROM public.bookings
    WHERE booking_date = NEW.booking_date
    AND court_id = ANY(related_courts)
    AND status IN ('confirmed', 'pending')
    AND ((start_time < NEW.end_time AND end_time > NEW.start_time))
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF conflicts > 0 THEN
        RAISE EXCEPTION 'Booking conflicts with an existing reservation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for preventing overlapping bookings
DROP TRIGGER IF EXISTS prevent_booking_conflicts ON public.bookings;

CREATE TRIGGER prevent_booking_conflicts
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_booking_conflicts();

-- Add index to improve booking conflict checks
CREATE INDEX IF NOT EXISTS idx_bookings_court_date_time ON public.bookings (court_id, booking_date, start_time, end_time);

-- Function to handle concurrent booking attempts with proper locking
CREATE OR REPLACE FUNCTION public.create_booking_with_lock(
    p_court_id UUID,
    p_user_id UUID,
    p_booking_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_total_price NUMERIC,
    p_guest_name TEXT DEFAULT NULL,
    p_guest_phone TEXT DEFAULT NULL
) 
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    new_booking_id UUID;
    v_court_group_id UUID;
    related_courts UUID[];
BEGIN
    -- Get the court group ID
    SELECT court_group_id INTO v_court_group_id 
    FROM public.courts 
    WHERE id = p_court_id;
    
    -- Get all related courts (in the same group)
    IF v_court_group_id IS NOT NULL THEN
        SELECT ARRAY_AGG(id) INTO related_courts
        FROM public.courts
        WHERE court_group_id = v_court_group_id;
    ELSE
        related_courts := ARRAY[p_court_id];
    END IF;
    
    -- Lock rows in the bookings table that might conflict
    -- This prevents concurrent transactions from creating conflicting bookings
    PERFORM 1
    FROM public.bookings
    WHERE booking_date = p_booking_date
    AND court_id = ANY(related_courts)
    AND status IN ('confirmed', 'pending')
    AND ((start_time < p_end_time AND end_time > p_start_time))
    FOR UPDATE;
    
    -- If we got here, either there are no conflicts or we have locked all potential conflicts
    INSERT INTO public.bookings (
        court_id, 
        user_id, 
        booking_date, 
        start_time, 
        end_time, 
        total_price, 
        guest_name, 
        guest_phone,
        status
    ) VALUES (
        p_court_id,
        p_user_id,
        p_booking_date,
        p_start_time,
        p_end_time,
        p_total_price,
        p_guest_name,
        p_guest_phone,
        'confirmed'
    ) RETURNING id INTO new_booking_id;
    
    RETURN new_booking_id;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'This slot has already been booked';
    WHEN OTHERS THEN
        RAISE;
END;
$$;
