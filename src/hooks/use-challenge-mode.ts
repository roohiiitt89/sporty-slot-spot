import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Profile, Team, TeamMember, TeamJoinRequest } from '@/types/challenge';

export const useChallengeMode = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [topTeams, setTopTeams] = useState<Team[]>([]);
  const [joinRequests, setJoinRequests] = useState<TeamJoinRequest[]>([]);
  const [isRequestingToJoin, setIsRequestingToJoin] = useState(false);
  const [isLeavingTeam, setIsLeavingTeam] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isUpdatingProfileName, setIsUpdatingProfileName] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      if (!user) {
        setError('Not authenticated');
        return;
      }

      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        // Create a default profile if one doesn't exist
        const { data: newProfile, error: newProfileError } = await supabase
          .from('profiles')
          .insert([{ id: user.id, xp: 0, level: 1, wins: 0, losses: 0, draws: 0 }])
          .select('*')
          .single();

        if (newProfileError) {
          throw newProfileError;
        }

        profile = newProfile;
      }

      setProfile(profile);

      // Fetch user's team
      let { data: teamMember, error: teamMemberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .single();

      if (teamMemberError && teamMemberError.code !== 'PGRST116') {
        throw teamMemberError;
      }

      if (teamMember) {
        let { data: team, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamMember.team_id)
          .single();

        if (teamError) {
          throw teamError;
        }

        setUserTeam(team);

        // Fetch team members
        let { data: members, error: membersError } = await supabase
          .from('team_members')
          .select('*, profiles:profiles(full_name, email)')
          .eq('team_id', teamMember.team_id);

        if (membersError) {
          throw membersError;
        }

        // Type casting to ensure the data matches expected structure
        setTeamMembers(members as unknown as TeamMember[]);
      } else {
        setUserTeam(null);
        setTeamMembers([]);
      }

      // Fetch pending join requests for the user
      let { data: requests, error: requestsError } = await supabase
        .from('team_join_requests')
        .select('*, team:teams(name, slug, logo_url)')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (requestsError) {
        throw requestsError;
      }

      // Type casting to ensure the data matches expected structure
      setJoinRequests(requests as unknown as TeamJoinRequest[]);

      // Fetch top teams
      await fetchTopTeams(5);
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add the fetchTopTeams function
  const fetchTopTeams = async (limit: number = 5) => {
    try {
      let { data: topTeamsData, error: topTeamsError } = await supabase
        .from('teams')
        .select('*')
        .order('xp', { ascending: false })
        .limit(limit);

      if (topTeamsError) {
        throw topTeamsError;
      }

      setTopTeams(topTeamsData);
      return topTeamsData;
    } catch (err: any) {
      console.error('Error fetching top teams:', err);
      return [];
    }
  };

  // Add fetchTeamJoinRequests function
  const fetchTeamJoinRequests = async (teamId: string) => {
    try {
      const { data: requests, error } = await supabase
        .from('team_join_requests')
        .select('*, user_profile:profiles(full_name, email)')
        .eq('team_id', teamId)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      // Explicitly cast the data to the correct type
      return (requests || []) as unknown as TeamJoinRequest[];
    } catch (err: any) {
      console.error('Error fetching team join requests:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const createTeam = async (teamName: string, teamLogoUrl: string = '', teamDescription: string = '') => {
    setIsCreatingTeam(true);
    try {
      if (!user) {
        setError('Not authenticated');
        return false;
      }

      // Check if the user is already in a team
      const { data: existingTeamMember } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingTeamMember) {
        setError('You are already in a team. Leave your current team first.');
        return false;
      }

      // Generate a slug from the team name
      const slug = teamName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

      // Check if the slug already exists
      const { data: existingTeamWithSlug } = await supabase
        .from('teams')
        .select('*')
        .eq('slug', slug)
        .single();

      if (existingTeamWithSlug) {
        setError('Team name already exists. Please choose a different name.');
        return false;
      }

      // Insert the new team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert([{ name: teamName, logo_url: teamLogoUrl, description: teamDescription, creator_id: user.id, slug: slug }])
        .select('*')
        .single();

      if (teamError) {
        throw teamError;
      }

      // Insert the team member (creator)
      const { error: teamMemberError } = await supabase
        .from('team_members')
        .insert([{ team_id: team.id, user_id: user.id, role: 'creator' }]);

      if (teamMemberError) {
        throw teamMemberError;
      }

      // Update the state
      await fetchProfile();
      return true;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error('Error creating team:', err);
      return false;
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const requestToJoinTeam = async (teamId: string, message: string) => {
    setIsRequestingToJoin(true);
    try {
      if (!user) {
        setError('Not authenticated');
        return false;
      }

      // Check if the user is already in a team
      const { data: existingTeamMember } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingTeamMember) {
        setError('You are already in a team. Leave your current team first.');
        return false;
      }

      // Check if the user has already requested to join the team
      const { data: existingRequest } = await supabase
        .from('team_join_requests')
        .select('*')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        setError('You have already requested to join this team.');
        return false;
      }

      // Insert the join request
      const { error: joinRequestError } = await supabase
        .from('team_join_requests')
        .insert([{ team_id: teamId, user_id: user.id, message: message }]);

      if (joinRequestError) {
        throw joinRequestError;
      }

      // Update the state
      await fetchProfile();
      return true;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error('Error requesting to join team:', err);
      return false;
    } finally {
      setIsRequestingToJoin(false);
    }
  };

  const leaveTeam = async () => {
    setIsLeavingTeam(true);
    try {
      if (!user || !userTeam) {
        setError('Not authenticated or not in a team');
        return false;
      }

      // Delete the team member
      const { error: teamMemberError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', userTeam.id)
        .eq('user_id', user.id);

      if (teamMemberError) {
        throw teamMemberError;
      }

      // If the user was the creator, delete the team
      if (userTeam.creator_id === user.id) {
        const { error: teamError } = await supabase
          .from('teams')
          .delete()
          .eq('id', userTeam.id);

        if (teamError) {
          throw teamError;
        }
      }

      // Update the state
      await fetchProfile();
      return true;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error('Error leaving team:', err);
      return false;
    } finally {
      setIsLeavingTeam(false);
    }
  };

  const handleJoinRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error: requestError } = await supabase
        .from('team_join_requests')
        .update({ status })
        .eq('id', requestId);

      if (requestError) {
        throw requestError;
      }

      // Update the state
      await fetchProfile();
      return true;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error('Error handling join request:', err);
      return false;
    }
  };

  const updateProfileName = async (profileName: string) => {
    setIsUpdatingProfileName(true);
    try {
      if (!user) {
        setError('Not authenticated');
        return false;
      }
  
      const { data, error } = await supabase
        .from('profiles')
        .update({ profile_name: profileName })
        .eq('id', user.id)
        .select('*')
        .single();
  
      if (error) {
        throw error;
      }
  
      setProfile(data);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update profile name.');
      console.error('Error updating profile name:', err);
      return false;
    } finally {
      setIsUpdatingProfileName(false);
    }
  };

  return {
    loading,
    error,
    profile,
    userTeam,
    teamMembers,
    topTeams,
    joinRequests,
    isRequestingToJoin,
    isLeavingTeam,
    isCreatingTeam,
    isUpdatingProfileName,
    fetchProfile,
    fetchTopTeams,
    fetchTeamJoinRequests,
    createTeam,
    requestToJoinTeam,
    leaveTeam,
    handleJoinRequest,
    updateProfileName
  };
};
