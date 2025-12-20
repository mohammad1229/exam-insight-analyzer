import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
