import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Proper bcrypt hashing for passwords
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Verify password against hash
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Support legacy base64 passwords during migration
  if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$')) {
    // Legacy base64 comparison
    return btoa(password) === hash;
  }
  return await bcrypt.compare(password, hash);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password, admin_id, action, currentPassword } = await req.json();

    if (!password) {
      return new Response(
        JSON.stringify({ error: "Password is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hash password using bcrypt
    const hashedPassword = await hashPassword(password);

    // If admin_id is provided, update the admin's password
    if (admin_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // If currentPassword provided, verify it first
      if (currentPassword) {
        const { data: admin, error: fetchError } = await supabase
          .from("school_admins")
          .select("password_hash")
          .eq("id", admin_id)
          .maybeSingle();

        if (fetchError || !admin) {
          return new Response(
            JSON.stringify({ error: "Admin not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isValid = await verifyPassword(currentPassword, admin.password_hash);
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Current password is incorrect" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const { error: updateError } = await supabase
        .from("school_admins")
        .update({ password_hash: hashedPassword })
        .eq("id", admin_id);

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update password" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Password updated successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ hash: hashedPassword }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
