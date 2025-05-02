
-- Function to get team join requests
CREATE OR REPLACE FUNCTION public.get_team_join_requests(team_id_param UUID)
RETURNS TABLE (
  id UUID,
  team_id UUID,
  user_id UUID,
  status TEXT,
  message TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tjr.id,
    tjr.team_id,
    tjr.user_id,
    tjr.status,
    tjr.message,
    tjr.created_at,
    tjr.updated_at
  FROM 
    public.team_join_requests tjr
  WHERE 
    tjr.team_id = team_id_param;
END;
$$;

-- Function to handle team join request (accept or reject)
CREATE OR REPLACE FUNCTION public.handle_team_join_request(
  request_id_param UUID,
  status_param TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_team_id UUID;
  v_user_id UUID;
BEGIN
  -- Get request data
  SELECT team_id, user_id INTO v_team_id, v_user_id
  FROM public.team_join_requests
  WHERE id = request_id_param;
  
  -- Update the request status
  UPDATE public.team_join_requests
  SET status = status_param, updated_at = now()
  WHERE id = request_id_param;
  
  -- If accepted, add user to team members
  IF status_param = 'accepted' THEN
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (v_team_id, v_user_id, 'member');
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Function to create team join request
CREATE OR REPLACE FUNCTION public.create_team_join_request(
  team_id_param UUID,
  message_param TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.team_join_requests (team_id, user_id, message, status)
  VALUES (team_id_param, auth.uid(), message_param, 'pending');
  
  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'You have already requested to join this team';
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;
