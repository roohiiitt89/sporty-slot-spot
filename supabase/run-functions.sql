
-- Create team_join_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.team_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Set up RLS policies for team_join_requests
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for team_join_requests
CREATE POLICY "Team creators can view all join requests" ON public.team_join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.team_members tm ON t.id = tm.team_id
      WHERE t.id = team_id AND tm.user_id = auth.uid() AND tm.role = 'creator'
    )
  );

CREATE POLICY "Users can request to join teams" ON public.team_join_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Run the functions we defined
\i supabase/functions/team-functions.sql
\i supabase/functions/help-functions.sql
\i supabase/functions/get_available_slots.sql
\i supabase/functions/admin-dashboard-functions.sql

-- Enable realtime for our tables
BEGIN;
  SELECT
    pg_catalog.pg_extension_config_dump('_realtime', '');
  ALTER PUBLICATION supabase_realtime ADD TABLE team_chats, team_join_requests, help_requests, bookings, blocked_slots;
COMMIT;

-- Add needed indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_chats_team_id ON public.team_chats(team_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_team_id ON public.team_join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_status ON public.team_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON public.help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON public.help_requests(status);
CREATE INDEX IF NOT EXISTS idx_bookings_court_date_time ON public.bookings(court_id, booking_date, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_court_date_time ON public.blocked_slots(court_id, date, start_time, end_time);

-- Set replica identity to FULL for both tables to ensure we get full row data in realtime events
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.blocked_slots REPLICA IDENTITY FULL;
