
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PlayerProfile, Team, TeamMember } from '@/types/challenge';

export const useChallengeMode = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [topTeams, setTopTeams] = useState<Team[]>([]);

  const fetchPlayerProfile = async () => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching player profile:', error);
        return null;
      }

      setPlayerProfile(data);
      return data;
    } catch (error) {
      console.error('Error in fetchPlayerProfile:', error);
      return null;
    }
  };

  const fetchUserTeam = async () => {
    if (!user) return null;

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
        return null;
      }

      setUserTeam(teamData);
      return teamData;
    } catch (error) {
      console.error('Error in fetchUserTeam:', error);
      setUserTeam(null);
      return null;
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .eq('team_id', teamId);

      if (error) {
        console.error('Error fetching team members:', error);
        return [];
      }

      // Cast the data to the correct type
      const typedMembers = data as unknown as TeamMember[];
      setTeamMembers(typedMembers);
      return typedMembers;
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
      return [];
    }
  };

  const fetchTopTeams = async (limit = 5) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('xp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top teams:', error);
        return [];
      }

      setTopTeams(data);
      return data;
    } catch (error) {
      console.error('Error in fetchTopTeams:', error);
      return [];
    }
  };

  const createTeam = async (name: string, description?: string) => {
    if (!user) return null;

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
          creator_id: user.id
        })
        .select()
        .single();

      if (teamError) {
        console.error('Error creating team:', teamError);
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
        return null;
      }

      // Update local state
      setUserTeam(teamData);
      await fetchTeamMembers(teamData.id);
      
      return teamData;
    } catch (error) {
      console.error('Error in createTeam:', error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        await fetchPlayerProfile();
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
    playerProfile,
    userTeam,
    teamMembers,
    topTeams,
    fetchPlayerProfile,
    fetchUserTeam,
    fetchTeamMembers,
    fetchTopTeams,
    createTeam
  };
};
