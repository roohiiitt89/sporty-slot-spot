
-- Function to safely fetch all venues without RLS recursion
CREATE OR REPLACE FUNCTION public.fetch_all_venues()
RETURNS SETOF venues
LANGUAGE SQL SECURITY DEFINER
AS $$
  SELECT * FROM public.venues WHERE is_active = true;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.fetch_all_venues() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_all_venues() TO anon;
