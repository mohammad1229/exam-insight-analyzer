import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-system-admin-token",
};

// Helper function to check if password is bcrypt hashed
function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$');
}

// Helper function to verify password (supports legacy plain text during migration)
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (isBcryptHash(storedHash)) {
    return await bcrypt.compare(password, storedHash);
  }
  // Legacy plain text comparison (will be removed after migration)
  console.warn('Legacy plain text password detected - migration needed');
  return password === storedHash;
}

// Helper function to hash password
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

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
    
    const body = await req.json();
    const { action } = body;
    
    console.log("Admin data action:", action);

    // Actions that require system admin authentication
    const protectedActions = [
      "getLicenses", "getSchools", "getSchoolAdmins", 
      "createSchoolAdmin", "updateSchoolAdmin", "deleteSchoolAdmin",
      "updateSchool", "deleteSchool", "updateLicense", "deleteDevice"
    ];

    if (protectedActions.includes(action)) {
      const auth = await verifySystemAdminToken(req, supabase);
      if (!auth.valid) {
        return new Response(
          JSON.stringify({ success: false, error: auth.error }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

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
      const { adminData } = body;
      
      // Hash password with bcrypt
      const passwordHash = await hashPassword(adminData.password || 'defaultpass123');
      
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
      
      // If password is being updated, hash it
      if (updateData.password) {
        updateData.password_hash = await hashPassword(updateData.password);
        delete updateData.password;
      }
      
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
    // This action is NOT protected - it's used for login
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

      // Verify password using bcrypt (with legacy fallback)
      const isValid = await verifyPassword(password, admin.password_hash);
      if (!isValid) {
        return new Response(
          JSON.stringify({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Auto-migrate plain text password to bcrypt
      if (!isBcryptHash(admin.password_hash)) {
        const hashedPassword = await hashPassword(password);
        await supabase
          .from("school_admins")
          .update({ password_hash: hashedPassword })
          .eq("id", admin.id);
        console.log(`Auto-migrated password for school admin: ${admin.username}`);
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
