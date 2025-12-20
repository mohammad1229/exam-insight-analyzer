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
    
    const { schoolName, directorName, validityMonths, maxDevices, email, phone, address } = await req.json();
    
    console.log("Creating license for school:", schoolName);

    if (!schoolName) {
      return new Response(
        JSON.stringify({ success: false, error: "اسم المدرسة مطلوب" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create school
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .insert({
        name: schoolName,
        director_name: directorName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
      })
      .select()
      .single();

    if (schoolError) {
      console.error("Error creating school:", schoolError);
      throw schoolError;
    }

    console.log("School created:", school.id);

    // Generate license key using database function
    const { data: licenseKeyData, error: keyError } = await supabase.rpc('generate_license_key');
    
    if (keyError) {
      console.error("Error generating license key:", keyError);
      throw keyError;
    }

    const licenseKey = licenseKeyData;
    console.log("License key generated:", licenseKey);

    // Calculate expiry date
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + (validityMonths || 12));

    // Create license
    const { data: license, error: licenseError } = await supabase
      .from("licenses")
      .insert({
        license_key: licenseKey,
        school_id: school.id,
        max_devices: maxDevices || 1,
        validity_months: validityMonths || 12,
        start_date: startDate.toISOString(),
        expiry_date: expiryDate.toISOString(),
        is_active: true,
        is_trial: false,
      })
      .select()
      .single();

    if (licenseError) {
      console.error("Error creating license:", licenseError);
      throw licenseError;
    }

    console.log("License created:", license.id);

    return new Response(
      JSON.stringify({
        success: true,
        licenseKey: licenseKey,
        school: school,
        license: license,
      }),
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
