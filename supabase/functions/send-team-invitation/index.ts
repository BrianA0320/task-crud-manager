import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  name?: string;
  teamOwnerName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== STARTING TEAM INVITATION PROCESS ===");
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("✅ Supabase client initialized");

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ No authorization header found");
      throw new Error("No authorization header");
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("❌ Auth error:", authError);
      throw new Error("Unauthorized");
    }

    console.log("✅ User authenticated:", user.email);

    const { email, name, teamOwnerName }: InvitationRequest = await req.json();
    console.log("📋 Request data:", { email, name, teamOwnerName });

    // Create invitation record
    console.log("💾 Creating invitation record...");
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('team_invitations')
      .insert({
        team_owner_id: user.id,
        invitee_email: email,
        invitee_name: name || email.split('@')[0],
        role: 'member',
        status: 'pending'
      })
      .select()
      .single();

    if (invitationError) {
      console.error("❌ Database error:", invitationError);
      throw invitationError;
    }

    console.log("✅ Invitation created with ID:", invitation.id);
    console.log("🔗 Token:", invitation.invitation_token);

    // Create invitation URL - Use current domain from request
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}`;
    const invitationUrl = `${baseUrl}/invite/${invitation.invitation_token}`;
    
    console.log("🌐 Invitation URL:", invitationUrl);

    // Send invitation email
    console.log("📧 Sending email to:", email);
    const emailResponse = await resend.emails.send({
      from: "Gestor de Tareas <onboarding@resend.dev>",
      to: [email],
      subject: `${teamOwnerName || "Un compañero"} te invita a unirte a su equipo`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">¡Te han invitado a un equipo!</h1>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; color: #333; margin-bottom: 15px;">
              <strong>${teamOwnerName || "Un compañero"}</strong> te ha invitado a unirte a su equipo en el Gestor de Tareas.
            </p>
            
            <p style="color: #666; margin-bottom: 20px;">
              ${name ? `Hola ${name}, ` : ''}únete para colaborar en tareas y proyectos en equipo.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;">
              Aceptar invitación
            </a>
          </div>
          
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              <strong>¿No tienes cuenta?</strong> No te preocupes, al hacer clic en el botón se creará automáticamente una cuenta para ti.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Si no esperabas esta invitación, puedes ignorar este email de manera segura.<br>
            Esta invitación expira en 7 días.
          </p>
        </div>
      `,
    });

    console.log("✅ Email sent successfully!");
    console.log("📨 Resend response:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Invitación enviada correctamente",
      invitationId: invitation.id,
      invitationUrl: invitationUrl 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("💥 ERROR in send-team-invitation function:", error);
    console.error("📄 Error stack:", error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Check function logs for more information"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);