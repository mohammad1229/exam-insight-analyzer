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

    if (action === "updateSchool") {
      const { schoolId, updateData } = body;
      
      const { data, error } = await supabase
        .from("schools")
        .update(updateData)
        .eq("id", schoolId)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "deleteSchool") {
      const { schoolId } = body;
      
      // Delete related data first
      await supabase.from("school_admins").delete().eq("school_id", schoolId);
      await supabase.from("licenses").delete().eq("school_id", schoolId);
      
      const { error } = await supabase
        .from("schools")
        .delete()
        .eq("id", schoolId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "updateLicense") {
      const { licenseId, updateData } = body;
      
      const { data, error } = await supabase
        .from("licenses")
        .update(updateData)
        .eq("id", licenseId)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "deleteDevice") {
      const { deviceId } = body;
      
      const { error } = await supabase
        .from("device_activations")
        .delete()
        .eq("id", deviceId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== VERIFY SCHOOL ADMIN LOGIN ==========
    if (action === "verifySchoolAdminLogin") {
      const { username, password, activatedLicenseId } = body;
      
      // Find admin with matching username
      const { data: admin, error } = await supabase
        .from("school_admins")
        .select(`
          *,
          schools(id, name, director_name, logo_url),
          licenses(id, license_key, is_active, expiry_date, is_trial, trial_days, trial_start_date)
        `)
        .eq("username", username)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      
      if (!admin) {
        return new Response(
          JSON.stringify({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify password - plain text comparison
      if (admin.password_hash !== password) {
        return new Response(
          JSON.stringify({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if admin has a school assigned
      if (!admin.school_id || !admin.schools) {
        return new Response(
          JSON.stringify({ success: false, error: "المستخدم غير مرتبط بمدرسة - تواصل مع مدير النظام" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify license is valid
      const license = admin.licenses;
      if (!license || !license.is_active) {
        return new Response(
          JSON.stringify({ success: false, error: "ترخيص المدرسة غير مفعل - تواصل مع مدير النظام" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // SECURITY CHECK: Verify admin's license matches the activated license on this device
      if (activatedLicenseId && admin.license_id !== activatedLicenseId) {
        console.log(`Security: Admin ${username} tried to login with license ${admin.license_id} but device has license ${activatedLicenseId}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "لا يمكنك تسجيل الدخول على هذا الجهاز - الترخيص المفعل لا يتطابق مع ترخيص حسابك" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if license is expired
      if (license.is_trial) {
        const trialStart = new Date(license.trial_start_date);
        const trialDays = license.trial_days || 15;
        const trialEnd = new Date(trialStart.getTime() + trialDays * 24 * 60 * 60 * 1000);
        if (new Date() > trialEnd) {
          return new Response(
            JSON.stringify({ success: false, error: "انتهت الفترة التجريبية - يرجى تفعيل الترخيص" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (license.expiry_date && new Date(license.expiry_date) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: "انتهت صلاحية الترخيص - تواصل مع مدير النظام" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", admin.id)
        .eq("user_type", "school_admin")
        .maybeSingle();

      // Update last login timestamp
      await supabase
        .from("school_admins")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", admin.id);

      return new Response(
        JSON.stringify({
          success: true,
          must_change_password: admin.must_change_password,
          admin: {
            id: admin.id,
            full_name: admin.full_name,
            username: admin.username,
            email: admin.email,
            phone: admin.phone,
            school_id: admin.school_id,
            license_id: admin.license_id,
            school_name: admin.schools?.name,
            director_name: admin.schools?.director_name,
            logo_url: admin.schools?.logo_url,
            license_key: license.license_key,
            license_active: license.is_active,
            expiry_date: license.expiry_date,
            role: roleData?.role || "school_admin",
            must_change_password: admin.must_change_password
          }
        }),
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
