import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'user';

interface UserWithRole {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

export const useUserRoles = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [allUsers, setAllUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchAllUsers();
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setUserRole(data?.role || 'user');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    if (userRole !== 'admin') return;

    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;

      const usersWithRoles = users.map(user => {
        const profile = profiles?.find(p => p.user_id === user.id);
        const roleData = roles?.find(r => r.user_id === user.id);
        
        return {
          id: user.id,
          email: user.email || '',
          display_name: profile?.display_name,
          avatar_url: profile?.avatar_url,
          role: roleData?.role || 'user' as UserRole,
          created_at: user.created_at
        };
      });

      setAllUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole });

      if (error) throw error;
      
      await fetchAllUsers();
      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { success: false, error };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      
      await fetchAllUsers();
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error };
    }
  };

  const updateUserProfile = async (userId: string, profileData: { display_name?: string; avatar_url?: string }) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ user_id: userId, ...profileData });

      if (error) throw error;
      
      await fetchAllUsers();
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error };
    }
  };

  return {
    userRole,
    allUsers,
    loading,
    isAdmin: userRole === 'admin',
    updateUserRole,
    deleteUser,
    updateUserProfile,
    refreshUsers: fetchAllUsers
  };
};