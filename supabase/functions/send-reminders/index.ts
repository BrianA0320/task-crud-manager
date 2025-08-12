import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ReminderData {
  user_id: string;
  email: string;
  reminder_type: string;
  last_entry?: any;
}

const serve_handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting reminder check...');

    // Get all active reminders that need to be sent
    const { data: reminders, error: remindersError } = await supabase
      .from('email_reminders')
      .select(`
        *,
        profiles!inner(user_id)
      `)
      .eq('is_active', true)
      .or(`last_sent.is.null,last_sent.lt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`);

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError);
      throw remindersError;
    }

    console.log(`Found ${reminders?.length || 0} reminders to process`);

    // Get user emails from auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const userEmailMap = new Map(users.map(user => [user.id, user.email]));

    for (const reminder of reminders || []) {
      const userEmail = userEmailMap.get(reminder.user_id);
      if (!userEmail) continue;

      // Check if user needs a reminder based on their last time entry
      const { data: lastEntry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', reminder.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let shouldSendReminder = false;
      let reminderMessage = '';

      switch (reminder.reminder_type) {
        case 'daily_checkin':
          const today = new Date().toDateString();
          const hasWorkedToday = lastEntry && 
            new Date(lastEntry.start_time).toDateString() === today;
          
          if (!hasWorkedToday && new Date().getHours() >= 9) {
            shouldSendReminder = true;
            reminderMessage = '¡No olvides registrar tu inicio de jornada hoy!';
          }
          break;

        case 'end_day':
          const hasActiveEntry = lastEntry && !lastEntry.end_time;
          if (hasActiveEntry && new Date().getHours() >= 18) {
            shouldSendReminder = true;
            reminderMessage = '¡No olvides registrar el fin de tu jornada!';
          }
          break;

        case 'weekly_summary':
          const isMonday = new Date().getDay() === 1;
          if (isMonday) {
            shouldSendReminder = true;
            reminderMessage = 'Revisa tu resumen semanal de horas trabajadas.';
          }
          break;
      }

      if (shouldSendReminder) {
        console.log(`Sending ${reminder.reminder_type} reminder to ${userEmail}`);
        
        // Here you would integrate with your email service (Resend, SendGrid, etc.)
        // For now, we'll log the reminder
        console.log(`Reminder for ${userEmail}: ${reminderMessage}`);

        // Update last_sent timestamp
        await supabase
          .from('email_reminders')
          .update({ last_sent: new Date().toISOString() })
          .eq('id', reminder.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: reminders?.length || 0,
        message: 'Reminders processed successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-reminders function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
};

serve(serve_handler);