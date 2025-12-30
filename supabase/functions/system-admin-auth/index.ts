import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hashSync, compareSync } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to check if password is bcrypt hashed
function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$');
}

// Helper function to verify password (supports legacy plain text during migration)
function verifyPassword(password: string, storedHash: string): boolean {
  if (isBcryptHash(storedHash)) {
    try {
      return compareSync(password, storedHash);
    } catch (e) {
      console.error("Error comparing bcrypt hash:", e);
      return false;
    }
  }
  // Legacy plain text comparison (will be removed after migration)
  console.warn('Legacy plain text password detected - migration needed');
  return password === storedHash;
}

// Helper function to hash password
function hashPassword(password: string): string {
  return hashSync(password);
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

        // Verify password using bcrypt (with legacy fallback)
        const isValid = verifyPassword(password, admin.password_hash);
        
        if (!isValid) {
          return new Response(
            JSON.stringify({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Clean up expired sessions
        await supabase
          .from("system_admin_sessions")
          .delete()
          .lt("expires_at", new Date().toISOString());

        // Generate a secure session token
        const sessionToken = crypto.randomUUID();
        const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Store session in database
        const { error: sessionError } = await supabase
          .from("system_admin_sessions")
          .insert({
            admin_id: admin.id,
            token: sessionToken,
            expires_at: sessionExpiry.toISOString()
          });

        if (sessionError) {
          console.error("Error creating session:", sessionError);
          throw sessionError;
        }

        // Update last login
        await supabase
          .from("system_admins")
          .update({ last_login_at: new Date().toISOString() })
          .eq("id", admin.id);

        // If password was plain text, hash it now (auto-migration) - do this in background
        if (!isBcryptHash(admin.password_hash)) {
          try {
            const hashedPassword = hashPassword(password);
            await supabase
              .from("system_admins")
              .update({ password_hash: hashedPassword })
              .eq("id", admin.id);
            console.log(`Auto-migrated password for admin: ${admin.username}`);
          } catch (hashError) {
            console.error("Error hashing password for migration:", hashError);
            // Don't fail login if migration fails
          }
        }

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
            sessionExpiry: sessionExpiry.toISOString(),
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

        // Verify current password using bcrypt (with legacy fallback)
        const isValid = verifyPassword(password, admin.password_hash);
        if (!isValid) {
          return new Response(
            JSON.stringify({ success: false, error: "كلمة المرور الحالية غير صحيحة" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Hash new password with bcrypt
        const hashedPassword = hashPassword(newPassword);

        // Update password
        const { error: updateError } = await supabase
          .from("system_admins")
          .update({ password_hash: hashedPassword })
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
        const token = req.headers.get("X-System-Admin-Token");
        
        if (!token) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing authentication token" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
          );
        }

        const { data: session, error: sessionError } = await supabase
          .from("system_admin_sessions")
          .select("admin_id, expires_at")
          .eq("token", token)
          .single();

        if (sessionError || !session) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid session" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
          );
        }

        if (new Date(session.expires_at) < new Date()) {
          // Clean up expired session
          await supabase.from("system_admin_sessions").delete().eq("token", token);
          return new Response(
            JSON.stringify({ success: false, error: "Session expired" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
          );
        }

        // Update last activity
        await supabase
          .from("system_admin_sessions")
          .update({ last_activity: new Date().toISOString() })
          .eq("token", token);

        return new Response(
          JSON.stringify({ success: true, adminId: session.admin_id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "logout": {
        const token = req.headers.get("X-System-Admin-Token");
        
        if (token) {
          await supabase.from("system_admin_sessions").delete().eq("token", token);
        }

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
