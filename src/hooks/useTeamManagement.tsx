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

      // Check if there's already a pending invitation (and allow retry after 5 minutes)
      const { data: existingInvitation } = await supabase
        .from('team_invitations')
        .select('id, created_at')
        .eq('team_owner_id', user.id)
        .eq('invitee_email', email)
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        const createdAt = new Date(existingInvitation.created_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        
        if (diffMinutes < 5) {
          toast({
            title: "Invitación reciente",
            description: `Ya hay una invitación pendiente para este email. Puedes reenviar en ${Math.ceil(5 - diffMinutes)} minutos.`,
            variant: "destructive",
          });
          return { success: false, error: 'Invitación reciente' };
        } else {
          // Delete old pending invitation to allow new one
          await supabase
            .from('team_invitations')
            .delete()
            .eq('id', existingInvitation.id);
        }
      }

      // Send invitation via edge function
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email,
          name,
          teamOwnerName: user.user_metadata?.full_name || user.email?.split('@')[0]
        }
      });

      if (error) throw error;

      toast({
        title: "Invitación enviada",
        description: `Se ha enviado una invitación a ${email}`,
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      const errorMessage = error.message || 'Error al enviar invitación';
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