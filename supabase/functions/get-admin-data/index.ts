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
    
    const body = await req.json();
    const { action } = body;
    
    console.log("Admin data action:", action);

    if (action === "getLicenses") {
      const { data, error } = await supabase
        .from("licenses")
        .select("*, schools(*), device_activations(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "getSchools") {
      const { data, error } = await supabase
        .from("schools")
        .select("*, licenses(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "getSchoolAdmins") {
      const { data, error } = await supabase
        .from("school_admins")
        .select("*, schools(name, director_name), licenses(license_key, is_active)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "createSchoolAdmin") {
      const { adminData, passwordHash } = body;
      
      const { data, error } = await supabase
        .from("school_admins")
        .insert({
          school_id: adminData.school_id,
          license_id: adminData.license_id || null,
          username: adminData.username,
          password_hash: passwordHash,
          full_name: adminData.full_name,
          email: adminData.email || null,
          phone: adminData.phone || null,
        })
        .select("*, schools(name, director_name), licenses(license_key, is_active)")
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "updateSchoolAdmin") {
      const { adminId, updateData } = body;
      
      const { data, error } = await supabase
        .from("school_admins")
        .update(updateData)
        .eq("id", adminId)
        .select("*, schools(name, director_name), licenses(license_key, is_active)")
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "deleteSchoolAdmin") {
      const { adminId } = body;
      
      const { error } = await supabase
        .from("school_admins")
        .delete()
        .eq("id", adminId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Unknown action" }),
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
