import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-system-admin-token",
};

// Verify system admin session token
async function verifySystemAdminToken(
  req: Request,
  supabase: any
): Promise<{ valid: boolean; adminId?: string; error?: string }> {
  const token = req.headers.get('X-System-Admin-Token');
  
  if (!token) {
    return { valid: false, error: 'Missing authentication token' };
  }

  const { data: session, error } = await supabase
    .from('system_admin_sessions')
    .select('admin_id, expires_at')
    .eq('token', token)
    .single();

  if (error || !session) {
    return { valid: false, error: 'Invalid session' };
  }

  if (new Date(session.expires_at) < new Date()) {
    // Clean up expired session
    await supabase.from('system_admin_sessions').delete().eq('token', token);
    return { valid: false, error: 'Session expired' };
  }

  // Update last activity
  await supabase
    .from('system_admin_sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('token', token);

  return { valid: true, adminId: session.admin_id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify system admin authentication
    const auth = await verifySystemAdminToken(req, supabase);
    if (!auth.valid) {
      console.log("Authentication failed:", auth.error);
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { action, licenseId, renewMonths } = await req.json();
    
    console.log("Managing license:", action, licenseId, "by admin:", auth.adminId);

    if (action === "renew") {
      // Get current license
      const { data: license, error: fetchError } = await supabase
        .from("licenses")
        .select("*")
        .eq("id", licenseId)
        .single();

      if (fetchError || !license) {
        throw new Error("الترخيص غير موجود");
      }

      // Calculate new expiry date
      const currentExpiry = license.expiry_date ? new Date(license.expiry_date) : new Date();
      const newExpiry = new Date(currentExpiry);
      newExpiry.setMonth(newExpiry.getMonth() + (renewMonths || 12));

      // Update license
      const { error: updateError } = await supabase
        .from("licenses")
        .update({
          expiry_date: newExpiry.toISOString(),
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", licenseId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, newExpiry: newExpiry.toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "delete") {
      // Delete device activations first
      await supabase
        .from("device_activations")
        .delete()
        .eq("license_id", licenseId);

      // Delete the license completely
      const { error: deleteError } = await supabase
        .from("licenses")
        .delete()
        .eq("id", licenseId);

      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "deactivate") {
      const { error: updateError } = await supabase
        .from("licenses")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", licenseId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "إجراء غير معروف" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
