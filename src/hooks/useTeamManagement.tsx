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
        .in('status', ['active', 'pending']); // Mostrar tanto activos como pendientes

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
      // Check if member already exists
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_owner_id', user.id)
        .eq('member_email', email)
        .single();

      if (existingMember) {
        toast({
          title: "Error",
          description: "Este miembro ya está en el equipo",
          variant: "destructive",
        });
        return { success: false, error: 'El miembro ya existe' };
      }

      // Generate a unique temporary member_id
      const tempMemberId = crypto.randomUUID();

      const { data, error } = await supabase
        .from('team_members')
        .insert({
          team_owner_id: user.id,
          member_id: tempMemberId, // Unique temporary ID
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
        description: `${email} ha sido agregado al equipo (pendiente de confirmación)`,
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

  const activateTeamMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'active' })
        .eq('id', memberId)
        .eq('team_owner_id', user?.id);

      if (error) throw error;

      toast({
        title: "Miembro activado",
        description: "El miembro ha sido activado exitosamente",
      });

      await fetchTeamMembers();
      return { success: true };
    } catch (error: any) {
      console.error('Error activating team member:', error);
      toast({
        title: "Error",
        description: "Error al activar miembro del equipo",
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
        .eq('status', 'active'); // Solo activos para asignación de tareas

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
    activateTeamMember,
    getAllTeamMembersForTasks,
    refreshTeamMembers: fetchTeamMembers
  };
};