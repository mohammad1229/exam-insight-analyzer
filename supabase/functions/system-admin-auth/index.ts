import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hash password using SHA-256
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Verify password
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, username, password, newPassword, adminId } = await req.json();
    console.log(`System admin auth action: ${action}`);

    switch (action) {
      case "login": {
        if (!username || !password) {
          return new Response(
            JSON.stringify({ success: false, error: "اسم المستخدم وكلمة المرور مطلوبان" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        // Find system admin by username
        const { data: admin, error: fetchError } = await supabase
          .from("system_admins")
          .select("*")
          .eq("username", username)
          .eq("is_active", true)
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching system admin:", fetchError);
          throw fetchError;
        }

        if (!admin) {
          return new Response(
            JSON.stringify({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify password using SHA-256
        const isValid = await verifyPassword(password, admin.password_hash);
        
        if (!isValid) {
          return new Response(
            JSON.stringify({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update last login
        await supabase
          .from("system_admins")
          .update({ last_login_at: new Date().toISOString() })
          .eq("id", admin.id);

        // Generate a session token
        const sessionToken = crypto.randomUUID();
        const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

        return new Response(
          JSON.stringify({
            success: true,
            admin: {
              id: admin.id,
              username: admin.username,
              fullName: admin.full_name,
              email: admin.email,
            },
            sessionToken,
            sessionExpiry,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "changePassword": {
        if (!adminId || !password || !newPassword) {
          return new Response(
            JSON.stringify({ success: false, error: "جميع الحقول مطلوبة" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        // Find admin
        const { data: admin, error: fetchError } = await supabase
          .from("system_admins")
          .select("*")
          .eq("id", adminId)
          .maybeSingle();

        if (fetchError || !admin) {
          return new Response(
            JSON.stringify({ success: false, error: "المستخدم غير موجود" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
          );
        }

        // Verify current password
        const isCurrentValid = await verifyPassword(password, admin.password_hash);
        if (!isCurrentValid) {
          return new Response(
            JSON.stringify({ success: false, error: "كلمة المرور الحالية غير صحيحة" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Hash new password
        const newHash = await hashPassword(newPassword);

        // Update password
        const { error: updateError } = await supabase
          .from("system_admins")
          .update({ password_hash: newHash })
          .eq("id", adminId);

        if (updateError) {
          throw updateError;
        }

        return new Response(
          JSON.stringify({ success: true, message: "تم تغيير كلمة المرور بنجاح" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verifySession": {
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("System admin auth error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
