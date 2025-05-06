
-- Function to get user help requests
CREATE OR REPLACE FUNCTION public.get_user_help_requests(p_user_id UUID)
RETURNS SETOF public.help_requests
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT hr.*
  FROM public.help_requests hr
  WHERE hr.user_id = p_user_id
  ORDER BY hr.last_message_at DESC;
$$;

-- Function to create a help request
CREATE OR REPLACE FUNCTION public.create_help_request(p_user_id UUID, p_subject TEXT)
RETURNS public.help_requests
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_request public.help_requests;
BEGIN
  INSERT INTO public.help_requests (
    user_id, 
    subject,
    status,
    created_at,
    updated_at,
    last_message_at
  ) VALUES (
    p_user_id,
    p_subject,
    'pending',
    now(),
    now(),
    now()
  ) RETURNING * INTO new_request;
  
  RETURN new_request;
END;
$$;

-- Function to update help request status
CREATE OR REPLACE FUNCTION public.update_help_request_status(p_help_request_id UUID, p_status TEXT)
RETURNS public.help_requests
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_request public.help_requests;
BEGIN
  UPDATE public.help_requests
  SET 
    status = p_status,
    last_message_at = now(),
    updated_at = now()
  WHERE id = p_help_request_id
  RETURNING * INTO updated_request;
  
  RETURN updated_request;
END;
$$;

-- Function to get all help requests (for super_admin)
CREATE OR REPLACE FUNCTION public.get_help_requests(p_status TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  subject TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  user_name TEXT,
  user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hr.id,
    hr.user_id,
    hr.subject,
    hr.status,
    hr.created_at,
    hr.updated_at,
    hr.last_message_at,
    p.full_name AS user_name,
    p.email AS user_email
  FROM 
    public.help_requests hr
    LEFT JOIN public.profiles p ON hr.user_id = p.id
  WHERE
    (p_status IS NULL OR hr.status = p_status)
  ORDER BY
    CASE WHEN hr.status = 'pending' THEN 0 ELSE 1 END,
    hr.last_message_at DESC;
END;
$$;
