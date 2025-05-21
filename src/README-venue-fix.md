
# Venue Loading Fix

To fix the "Failed to load venues" error, we need to execute the SQL function in `src/sql/venue-functions.sql` in your Supabase database. This function will allow us to safely fetch venue data without running into recursive RLS policy issues.

Steps:
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the SQL from `src/sql/venue-functions.sql`
4. Run the SQL query

This creates a security definer function that bypasses RLS policies safely when fetching venue data.

After running this SQL, your venues should load properly on the frontend.
