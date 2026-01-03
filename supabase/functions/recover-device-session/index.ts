// Lovable Cloud backend function: recover-device-session
// Recover last active license/school for a given deviceId (service-role read).

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
    const deviceId = String(body.deviceId || "").trim();

    console.log("recover-device-session called", { hasDeviceId: Boolean(deviceId) });

    if (!deviceId) {
      return new Response(
        JSON.stringify({ success: false, error: "معرّف الجهاز مطلوب" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: activation, error } = await supabase
      .from("device_activations")
      .select(
        "id, device_id, last_seen_at, license_id, licenses(id, license_key, is_active, is_trial, expiry_date, school_id, schools(id, name, director_name, logo_url))"
      )
      .eq("device_id", deviceId)
      .eq("is_active", true)
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!activation?.licenses) {
      return new Response(
        JSON.stringify({ success: false, error: "لم يتم العثور على جلسة سابقة لهذا الجهاز" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const license: any = activation.licenses;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          licenseKey: license.license_key,
          licenseId: license.id,
          schoolId: license.school_id,
          school: license.schools,
          expiryDate: license.expiry_date,
          isTrial: license.is_trial,
          licenseActive: license.is_active,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("recover-device-session error", e);
    return new Response(
      JSON.stringify({ success: false, error: "خطأ داخلي" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
