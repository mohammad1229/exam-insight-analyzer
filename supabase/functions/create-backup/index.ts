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
    
    const { schoolId, schoolName, backupType, backupData } = await req.json();
    
    console.log("Creating backup for school:", schoolName || schoolId);

    // Create backup record
    const { data: backup, error: backupError } = await supabase
      .from("backups")
      .insert({
        school_id: schoolId,
        school_name: schoolName || null,
        backup_type: backupType || 'manual',
        status: 'completed',
        completed_at: new Date().toISOString(),
        file_size: backupData ? JSON.stringify(backupData).length : 0,
      })
      .select()
      .single();

    if (backupError) {
      console.error("Error creating backup:", backupError);
      throw backupError;
    }

    console.log("Backup created:", backup.id);

    return new Response(
      JSON.stringify({ success: true, backup }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
