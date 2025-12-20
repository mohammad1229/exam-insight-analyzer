// Lovable Cloud backend function: get-license-details
// Returns school + license metadata for a given license key (service-role read).

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

    const body = await req.json().catch(() => ({}));
    const licenseKey = String(body.licenseKey || "").trim();

    console.log("get-license-details called", { hasKey: Boolean(licenseKey) });

    if (!licenseKey) {
      return new Response(
        JSON.stringify({ success: false, error: "مفتاح الترخيص مطلوب" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: license, error } = await supabase
      .from("licenses")
      .select(
        "id, license_key, is_active, is_trial, expiry_date, school_id, max_devices, schools(id, name, director_name, logo_url)"
      )
      .eq("license_key", licenseKey)
      .maybeSingle();

    if (error) throw error;
    if (!license) {
      return new Response(
        JSON.stringify({ success: false, error: "رمز الترخيص غير صالح" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: license }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("get-license-details error", e);
    return new Response(
      JSON.stringify({ success: false, error: "خطأ داخلي" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
