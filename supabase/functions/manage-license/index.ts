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
    
    const { action, licenseId, renewMonths } = await req.json();
    
    console.log("Managing license:", action, licenseId);

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

    if (action === "delete" || action === "deactivate") {
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
