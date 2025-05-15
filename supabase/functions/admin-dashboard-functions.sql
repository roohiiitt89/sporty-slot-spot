
-- Function to get venues with stats (bookings and courts count)
create or replace function public.get_admin_venues_with_stats()
returns table(
  id uuid,
  name text,
  location text,
  image_url text,
  bookings_count bigint,
  courts_count bigint
)
language plpgsql security definer
as $$
begin
  return query
  select 
    v.id,
    v.name,
    v.location,
    v.image_url,
    count(distinct b.id) as bookings_count,
    count(distinct c.id) as courts_count
  from 
    venues v
  left join 
    venue_admins va on v.id = va.venue_id
  left join 
    courts c on v.id = c.venue_id and c.is_active = true
  left join 
    bookings b on c.id = b.court_id
  where 
    va.admin_id = auth.uid()
    or exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')
  group by 
    v.id, v.name, v.location, v.image_url
  order by 
    v.name;
end;
$$;

-- Function to get admin dashboard stats
create or replace function public.get_admin_dashboard_stats()
returns table(
  total_venues bigint,
  total_bookings bigint,
  recent_bookings bigint,
  total_courts bigint
)
language plpgsql security definer
as $$
begin
  return query
  select 
    (select count(distinct v.id) 
     from venues v 
     left join venue_admins va on v.id = va.venue_id
     where va.admin_id = auth.uid() 
       or exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')) as total_venues,
    
    (select count(b.id) 
     from bookings b
     join courts c on b.court_id = c.id
     join venues v on c.venue_id = v.id
     left join venue_admins va on v.id = va.venue_id
     where va.admin_id = auth.uid()
       or exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')) as total_bookings,
    
    (select count(b.id) 
     from bookings b
     join courts c on b.court_id = c.id
     join venues v on c.venue_id = v.id
     left join venue_admins va on v.id = va.venue_id
     where (va.admin_id = auth.uid()
       or exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin'))
     and b.booking_date >= current_date - interval '7 days') as recent_bookings,
    
    (select count(c.id) 
     from courts c
     join venues v on c.venue_id = v.id
     left join venue_admins va on v.id = va.venue_id
     where (va.admin_id = auth.uid()
       or exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin'))
     and c.is_active = true) as total_courts;
end;
$$;
