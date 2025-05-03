
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { profile, Team, TeamMember, TeamJoinRequest } from '@/types/challenge';

export const useChallengeMode = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setprofile] = useState<profile | null>(null);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [topTeams, setTopTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [joinRequests, setJoinRequests] = useState<TeamJoinRequest[]>([]);

  const fetchprofile = async () => {
    if (!user) return null;
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching player profile:', error);
        setError('Failed to fetch player profile');
        return null;
      }

      setprofile(data);
      return data;
    } catch (error) {
      console.error('Error in fetchprofile:', error);
      setError('An unexpected error occurred');
      return null;
    }
  };

  const fetchUserTeam = async () => {
    if (!user) return null;
    setError(null);

    try {
      // First check if user is a member of any team
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .single();

      if (memberError) {
        if (memberError.code !== 'PGRST116') { // Not found error
          console.error('Error fetching team membership:', memberError);
        }
        setUserTeam(null);
        return null;
      }

      // Now fetch the team details
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', memberData.team_id)
        .single();

      if (teamError) {
        console.error('Error fetching team details:', teamError);
        setUserTeam(null);
        setError('Failed to fetch team details');
        return null;
      }

      setUserTeam(teamData);
      return teamData;
    } catch (error) {
      console.error('Error in fetchUserTeam:', error);
      setUserTeam(null);
      setError('An unexpected error occurred');
      return null;
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    setError(null);
    try {
      // Simplified query to avoid join issues
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId);

      if (error) {
        console.error('Error fetching team members:', error);
        setError('Failed to fetch team members');
        return [];
      }

      // Fetch user profiles separately
      const members: TeamMember[] = await Promise.all(
        data.map(async (member) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', member.user_id)
            .single();
          
          return {
            ...member,
            profiles: profileData ? {
              full_name: profileData.full_name || null,
              email: profileData.email || null
            } : null
          } as TeamMember; // Cast to ensure TypeScript recognizes this as TeamMember
        })
      );
      
      setTeamMembers(members);
      return members;
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
      setError('An unexpected error occurred');
      return [];
    }
  };

  const fetchTopTeams = async (limit = 5) => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('xp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top teams:', error);
        setError('Failed to fetch top teams');
        return [];
      }

      setTopTeams(data);
      return data;
    } catch (error) {
      console.error('Error in fetchTopTeams:', error);
      setError('An unexpected error occurred');
      return [];
    }
  };

  const fetchTeamJoinRequests = async (teamId: string) => {
    if (!user) return [];
    setError(null);

    try {
      // Use a regular query instead of RPC
      const { data, error } = await supabase
        .from('team_join_requests')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching join requests:', error);
        setError('Failed to fetch join requests');
        return [];
      }

      // Process the data for user profiles
      const teamJoinRequests: TeamJoinRequest[] = await Promise.all(
        data.map(async (request) => {
          // Fetch profile information separately
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', request.user_id)
            .single();
          
          return {
            id: request.id,
            team_id: request.team_id,
            user_id: request.user_id,
            status: request.status as 'pending' | 'accepted' | 'rejected',
            message: request.message,
            created_at: request.created_at,
            updated_at: request.updated_at,
            user_profile: profileData ? {
              full_name: profileData.full_name || null,
              email: profileData.email || null
            } : null
          };
        })
      );

      setJoinRequests(teamJoinRequests);
      return teamJoinRequests;
    } catch (error) {
      console.error('Error in fetchTeamJoinRequests:', error);
      setError('An unexpected error occurred');
      return [];
    }
  };

  const handleJoinRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!user) return false;
    setError(null);

    try {
      // Instead of using RPC, do separate operations
      const { data: requestData, error: requestError } = await supabase
        .from('team_join_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (requestError) {
        console.error('Error fetching join request:', requestError);
        setError('Failed to find join request');
        return false;
      }
      
      // Update request status
      const { error: updateError } = await supabase
        .from('team_join_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', requestId);
        
      if (updateError) {
        console.error('Error updating join request:', updateError);
        setError('Failed to update join request');
        return false;
      }
      
      // If accepted, add user to team
      if (status === 'accepted') {
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: requestData.team_id,
            user_id: requestData.user_id,
            role: 'member'
          });
          
        if (memberError) {
          console.error('Error adding team member:', memberError);
          setError('Failed to add user to team');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error in handleJoinRequest:', error);
      setError('An unexpected error occurred');
      return false;
    }
  };

  const requestToJoinTeam = async (teamId: string, message?: string) => {
    if (!user) return false;
    setError(null);

    try {
      // Direct insert instead of RPC
      const { error } = await supabase
        .from('team_join_requests')
        .insert({
          team_id: teamId,
          user_id: user.id,
          message: message || null,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          console.error('Error requesting to join team:', error);
          setError('You have already requested to join this team');
        } else {
          console.error('Error requesting to join team:', error);
          setError('Failed to send join request');
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in requestToJoinTeam:', error);
      setError('An unexpected error occurred');
      return false;
    }
  };

  const createTeam = async (name: string, description?: string) => {
    if (!user) return null;
    setError(null);

    try {
      // Generate a slug from the name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      // Create the team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name,
          description,
          slug,
          creator_id: user.id,
          xp: 0,
          wins: 0,
          losses: 0,
          draws: 0
        })
        .select()
        .single();

      if (teamError) {
        console.error('Error creating team:', teamError);
        setError('Failed to create team');
        return null;
      }

      // Add creator as a team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: user.id,
          role: 'creator'
        });

      if (memberError) {
        console.error('Error adding team member:', memberError);
        setError('Failed to add you as a team member');
        return null;
      }

      // Update local state
      setUserTeam(teamData);
      await fetchTeamMembers(teamData.id);
      
      return teamData;
    } catch (error) {
      console.error('Error in createTeam:', error);
      setError('An unexpected error occurred');
      return null;
    }
  };

  const updateProfileName = async (profileName: string) => {
    if (!user) return false;
    setError(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ profile_name: profileName })
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating profile name:', error);
        setError('Failed to update profile name');
        return false;
      }
      
      // Refresh the player profile
      await fetchprofile();
      return true;
    } catch (error) {
      console.error('Error in updateProfileName:', error);
      setError('An unexpected error occurred');
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        await fetchprofile();
        const team = await fetchUserTeam();
        if (team) {
          await fetchTeamMembers(team.id);
        }
        await fetchTopTeams();
        setLoading(false);
      };

      loadData();
    }
  }, [user]);

  return {
    loading,
    error,
    profile,
    userTeam,
    teamMembers,
    topTeams,
    joinRequests,
    fetchprofile,
    fetchUserTeam,
    fetchTeamMembers,
    fetchTopTeams,
    fetchTeamJoinRequests,
    createTeam,
    updateProfileName,
    requestToJoinTeam,
    handleJoinRequest
  };
};
