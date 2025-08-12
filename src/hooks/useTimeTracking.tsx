import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TimeEntry {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  total_hours?: number;
  notes?: string;
  created_at: string;
}

export const useTimeTracking = () => {
  const { user } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTimeEntries();
      checkActiveEntry();
    }
  }, [user]);

  const fetchTimeEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTimeEntries(data || []);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user?.id)
        .is('end_time', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setActiveEntry(data || null);
    } catch (error) {
      console.error('Error checking active entry:', error);
    }
  };

  const startWork = async (notes?: string) => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: user?.id,
          start_time: new Date().toISOString(),
          notes
        })
        .select()
        .single();

      if (error) throw error;
      
      setActiveEntry(data);
      await fetchTimeEntries();
      return { success: true };
    } catch (error) {
      console.error('Error starting work:', error);
      return { success: false, error };
    }
  };

  const endWork = async (notes?: string) => {
    if (!activeEntry) return { success: false, error: 'No active work session' };

    try {
      const endTime = new Date();
      const startTime = new Date(activeEntry.start_time);
      const totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          total_hours: Math.round(totalHours * 100) / 100,
          notes: notes || activeEntry.notes
        })
        .eq('id', activeEntry.id);

      if (error) throw error;
      
      setActiveEntry(null);
      await fetchTimeEntries();
      return { success: true };
    } catch (error) {
      console.error('Error ending work:', error);
      return { success: false, error };
    }
  };

  const getCurrentWorkDuration = () => {
    if (!activeEntry) return 0;
    
    const now = new Date();
    const startTime = new Date(activeEntry.start_time);
    return (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  };

  const getTodayHours = () => {
    const today = new Date().toDateString();
    return timeEntries
      .filter(entry => new Date(entry.start_time).toDateString() === today)
      .reduce((total, entry) => total + (entry.total_hours || 0), 0);
  };

  const getWeekHours = () => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);
    
    return timeEntries
      .filter(entry => new Date(entry.start_time) >= weekStart)
      .reduce((total, entry) => total + (entry.total_hours || 0), 0);
  };

  return {
    timeEntries,
    activeEntry,
    loading,
    isWorking: !!activeEntry,
    startWork,
    endWork,
    getCurrentWorkDuration,
    getTodayHours,
    getWeekHours,
    refreshEntries: fetchTimeEntries
  };
};