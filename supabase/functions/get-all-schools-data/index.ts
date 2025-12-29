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

    console.log("Fetching all schools data by admin:", auth.adminId);

    // Fetch all schools
    const { data: schools, error: schoolsError } = await supabase
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false });

    if (schoolsError) throw schoolsError;

    // Fetch all licenses with school info
    const { data: licenses, error: licensesError } = await supabase
      .from("licenses")
      .select(`
        *,
        schools (name, director_name)
      `)
      .order("created_at", { ascending: false });

    if (licensesError) throw licensesError;

    // Fetch all school admins (without password_hash)
    const { data: admins, error: adminsError } = await supabase
      .from("school_admins")
      .select(`
        id,
        username,
        full_name,
        email,
        phone,
        school_id,
        license_id,
        is_active,
        must_change_password,
        last_login_at,
        created_at,
        schools (name)
      `)
      .order("created_at", { ascending: false });

    if (adminsError) throw adminsError;

    // Fetch device activations
    const { data: devices, error: devicesError } = await supabase
      .from("device_activations")
      .select(`
        *,
        licenses (license_key, schools (name))
      `)
      .order("activated_at", { ascending: false });

    if (devicesError) throw devicesError;

    // Fetch backups
    const { data: backups, error: backupsError } = await supabase
      .from("backups")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (backupsError) throw backupsError;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          schools: schools || [],
          licenses: licenses || [],
          admins: admins || [],
          devices: devices || [],
          backups: backups || [],
          stats: {
            totalSchools: schools?.length || 0,
            totalLicenses: licenses?.length || 0,
            activeLicenses: licenses?.filter(l => l.is_active).length || 0,
            totalAdmins: admins?.length || 0,
            activeAdmins: admins?.filter(a => a.is_active).length || 0,
            totalDevices: devices?.length || 0,
          }
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
