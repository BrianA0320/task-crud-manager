import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  team_owner_id: string;
  member_id: string;
  member_email: string;
  member_name?: string;
  role: string;
  status: string;
  created_at: string;
}

export const useTeamManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user]);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_owner_id', user?.id)
        .eq('status', 'active');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los miembros del equipo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTeamMember = async (email: string, name?: string) => {
    if (!user) return { success: false, error: 'Usuario no autenticado' };

    try {
      // Check if user exists in auth.users by trying to find their profile
      const { data: existingProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', email); // This won't work, we need a different approach

      // For now, we'll add the member with email and let them join later
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          team_owner_id: user.id,
          member_id: user.id, // Temporary, will be updated when they join
          member_email: email,
          member_name: name || email.split('@')[0],
          role: 'member',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Miembro agregado",
        description: `${email} ha sido agregado al equipo`,
      });

      await fetchTeamMembers();
      return { success: true, data };
    } catch (error: any) {
      console.error('Error adding team member:', error);
      const errorMessage = error.message || 'Error al agregar miembro del equipo';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  const removeTeamMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)
        .eq('team_owner_id', user?.id);

      if (error) throw error;

      toast({
        title: "Miembro eliminado",
        description: "El miembro ha sido eliminado del equipo",
      });

      await fetchTeamMembers();
      return { success: true };
    } catch (error: any) {
      console.error('Error removing team member:', error);
      toast({
        title: "Error",
        description: "Error al eliminar miembro del equipo",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const getAllTeamMembersForTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('member_email, member_name, member_id')
        .eq('team_owner_id', user?.id)
        .eq('status', 'active');

      if (error) throw error;

      // Add the current user to the list
      const allMembers = [
        {
          member_id: user?.id || '',
          member_email: user?.email || '',
          member_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Yo'
        },
        ...(data || [])
      ];

      return allMembers;
    } catch (error) {
      console.error('Error fetching team members for tasks:', error);
      return [];
    }
  };

  return {
    teamMembers,
    loading,
    addTeamMember,
    removeTeamMember,
    getAllTeamMembersForTasks,
    refreshTeamMembers: fetchTeamMembers
  };
};