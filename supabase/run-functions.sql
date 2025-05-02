
-- Set up RLS policies for team_join_requests
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- Run the functions we defined
\i supabase/functions/team-functions.sql

-- Enable realtime for our tables
BEGIN;
  SELECT
    pg_catalog.pg_extension_config_dump('_realtime', '');
  ALTER PUBLICATION supabase_realtime ADD TABLE team_chats, team_join_requests;
COMMIT;

-- Add needed indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_chats_team_id ON public.team_chats(team_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_team_id ON public.team_join_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_team_join_requests_status ON public.team_join_requests(status);
