import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-system-admin-token, x-school-admin-token",
};

// Verify system admin session token
async function verifySystemAdminToken(
  req: Request,
  supabase: any
): Promise<{ valid: boolean; adminId?: string; error?: string }> {
  const token = req.headers.get('X-System-Admin-Token');
  
  if (!token) {
    return { valid: false, error: 'Missing system admin token' };
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
    await supabase.from('system_admin_sessions').delete().eq('token', token);
    return { valid: false, error: 'Session expired' };
  }

  await supabase
    .from('system_admin_sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('token', token);

  return { valid: true, adminId: session.admin_id };
}

// Check if request has valid school admin authentication (stored in body)
async function verifySchoolAdminAuth(
  body: any,
  supabase: any
): Promise<{ valid: boolean; schoolId?: string; error?: string }> {
  const { adminId, schoolId } = body;
  
  if (!adminId || !schoolId) {
    return { valid: false, error: 'Missing admin credentials' };
  }

  // Verify admin exists and is active
  const { data: admin, error } = await supabase
    .from('school_admins')
    .select('id, school_id, is_active')
    .eq('id', adminId)
    .eq('is_active', true)
    .single();

  if (error || !admin) {
    return { valid: false, error: 'Invalid admin credentials' };
  }

  // Verify admin belongs to the school they're trying to modify
  if (admin.school_id !== schoolId) {
    return { valid: false, error: 'Unauthorized for this school' };
  }

  return { valid: true, schoolId: admin.school_id };
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
    const { action, wisdom, wisdomId, schoolId } = body;
    
    console.log("Managing wisdom:", action);

    // Read-only actions (get, list) are public for displaying wisdoms on pages
    const readOnlyActions = ["get", "list"];
    
    // Write actions require authentication
    const writeActions = ["create", "update", "delete", "bulkCreate", "getAll"];
    
    if (writeActions.includes(action)) {
      // First try system admin token
      const systemAuth = await verifySystemAdminToken(req, supabase);
      
      if (!systemAuth.valid) {
        // Fall back to school admin auth from body
        const schoolAuth = await verifySchoolAdminAuth(body, supabase);
        
        if (!schoolAuth.valid) {
          console.log("Authentication failed:", systemAuth.error || schoolAuth.error);
          return new Response(
            JSON.stringify({ success: false, error: "غير مصرح بالوصول" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // For school admin, they can only manage their school's wisdoms
        if (action === "getAll" && schoolId !== schoolAuth.schoolId) {
          return new Response(
            JSON.stringify({ success: false, error: "غير مصرح بالوصول لبيانات هذه المدرسة" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Get wisdoms (public)
    if (action === "get" || action === "list") {
      let query = supabase
        .from("wisdoms")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (schoolId) {
        query = query.or(`school_id.eq.${schoolId},is_global.eq.true`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, wisdoms: data || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get all wisdoms (admin - protected)
    if (action === "getAll") {
      let query = supabase
        .from("wisdoms")
        .select("*")
        .order("created_at", { ascending: false });

      if (schoolId) {
        query = query.eq("school_id", schoolId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, wisdoms: data || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Create wisdom (protected)
    if (action === "create") {
      // Validate input
      if (!wisdom?.content || wisdom.content.trim().length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: "محتوى الحكمة مطلوب" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (wisdom.content.length > 500) {
        return new Response(
          JSON.stringify({ success: false, error: "الحكمة يجب أن لا تتجاوز 500 حرف" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("wisdoms")
        .insert({
          content: wisdom.content.trim(),
          author: wisdom.author?.trim() || null,
          category: wisdom.category || "general",
          school_id: wisdom.school_id || null,
          is_global: wisdom.is_global || false,
          is_active: wisdom.is_active !== false,
          display_order: wisdom.display_order || 0,
          created_by: wisdom.created_by || null,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, wisdom: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Bulk create wisdoms (protected)
    if (action === "bulkCreate") {
      const { wisdoms: wisdomsList } = body;
      
      if (!Array.isArray(wisdomsList) || wisdomsList.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: "قائمة الحكم مطلوبة" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const validWisdoms = wisdomsList
        .filter(w => w.content && w.content.trim().length > 0 && w.content.length <= 500)
        .map(w => ({
          content: w.content.trim(),
          author: w.author?.trim() || null,
          category: w.category || "general",
          school_id: w.school_id || null,
          is_global: w.is_global || false,
          is_active: true,
          display_order: w.display_order || 0,
          created_by: w.created_by || null,
        }));

      if (validWisdoms.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: "لا توجد حكم صالحة للإضافة" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("wisdoms")
        .insert(validWisdoms)
        .select();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, wisdoms: data, count: data?.length || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Update wisdom (protected)
    if (action === "update") {
      if (!wisdomId) {
        return new Response(
          JSON.stringify({ success: false, error: "معرف الحكمة مطلوب" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const updateData: any = {};
      if (wisdom.content !== undefined) updateData.content = wisdom.content.trim();
      if (wisdom.author !== undefined) updateData.author = wisdom.author?.trim() || null;
      if (wisdom.category !== undefined) updateData.category = wisdom.category;
      if (wisdom.is_active !== undefined) updateData.is_active = wisdom.is_active;
      if (wisdom.is_global !== undefined) updateData.is_global = wisdom.is_global;
      if (wisdom.display_order !== undefined) updateData.display_order = wisdom.display_order;

      const { data, error } = await supabase
        .from("wisdoms")
        .update(updateData)
        .eq("id", wisdomId)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, wisdom: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Delete wisdom (protected)
    if (action === "delete") {
      if (!wisdomId) {
        return new Response(
          JSON.stringify({ success: false, error: "معرف الحكمة مطلوب" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { error } = await supabase
        .from("wisdoms")
        .delete()
        .eq("id", wisdomId);

      if (error) throw error;

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
