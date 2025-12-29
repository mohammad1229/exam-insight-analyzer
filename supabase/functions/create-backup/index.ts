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
    
    const { action, schoolId, schoolName, backupType, backupData, backupId } = await req.json();
    
    // Handle different actions
    if (action === "create") {
      console.log("Creating backup for school:", schoolName || schoolId);

      // Convert backup data to JSON string
      const jsonData = JSON.stringify(backupData, null, 2);
      const dataSize = new Blob([jsonData]).size;
      
      // Generate unique file path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = `${schoolId}/${timestamp}_backup.json`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("backups")
        .upload(filePath, jsonData, {
          contentType: "application/json",
          upsert: false
        });

      if (uploadError) {
        console.error("Error uploading backup file:", uploadError);
        throw new Error(`فشل في رفع ملف النسخة الاحتياطية: ${uploadError.message}`);
      }

      // Create backup record
      const { data: backup, error: backupError } = await supabase
        .from("backups")
        .insert({
          school_id: schoolId,
          school_name: schoolName || null,
          backup_type: backupType || 'manual',
          status: 'completed',
          completed_at: new Date().toISOString(),
          file_path: filePath,
          file_size: dataSize,
        })
        .select()
        .single();

      if (backupError) {
        console.error("Error creating backup record:", backupError);
        // Try to delete the uploaded file if record creation fails
        await supabase.storage.from("backups").remove([filePath]);
        throw backupError;
      }

      console.log("Backup created successfully:", backup.id);

      return new Response(
        JSON.stringify({ success: true, backup }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } 
    
    else if (action === "restore") {
      console.log("Restoring backup:", backupId);

      // Get backup record
      const { data: backup, error: backupError } = await supabase
        .from("backups")
        .select("*")
        .eq("id", backupId)
        .single();

      if (backupError || !backup) {
        console.error("Backup not found:", backupError);
        throw new Error("النسخة الاحتياطية غير موجودة");
      }

      if (!backup.file_path) {
        throw new Error("مسار ملف النسخة الاحتياطية غير موجود");
      }

      // Download backup file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("backups")
        .download(backup.file_path);

      if (downloadError || !fileData) {
        console.error("Error downloading backup file:", downloadError);
        throw new Error(`فشل في تحميل ملف النسخة الاحتياطية: ${downloadError?.message || 'غير موجود'}`);
      }

      // Parse the backup data
      const backupContent = await fileData.text();
      const parsedData = JSON.parse(backupContent);

      console.log("Backup restored successfully:", backupId);

      return new Response(
        JSON.stringify({ success: true, backupData: parsedData }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    else if (action === "download") {
      console.log("Downloading backup:", backupId);

      // Get backup record
      const { data: backup, error: backupError } = await supabase
        .from("backups")
        .select("*")
        .eq("id", backupId)
        .single();

      if (backupError || !backup) {
        console.error("Backup not found:", backupError);
        throw new Error("النسخة الاحتياطية غير موجودة");
      }

      if (!backup.file_path) {
        throw new Error("مسار ملف النسخة الاحتياطية غير موجود");
      }

      // Create signed URL for download
      const { data: signedUrl, error: signError } = await supabase.storage
        .from("backups")
        .createSignedUrl(backup.file_path, 3600); // 1 hour expiry

      if (signError || !signedUrl) {
        console.error("Error creating signed URL:", signError);
        throw new Error(`فشل في إنشاء رابط التحميل: ${signError?.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, downloadUrl: signedUrl.signedUrl, backup }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    else if (action === "delete") {
      console.log("Deleting backup:", backupId);

      // Get backup record
      const { data: backup, error: backupError } = await supabase
        .from("backups")
        .select("*")
        .eq("id", backupId)
        .single();

      if (backupError || !backup) {
        console.error("Backup not found:", backupError);
        throw new Error("النسخة الاحتياطية غير موجودة");
      }

      // Delete file from storage if exists
      if (backup.file_path) {
        const { error: deleteFileError } = await supabase.storage
          .from("backups")
          .remove([backup.file_path]);

        if (deleteFileError) {
          console.warn("Warning: Could not delete backup file:", deleteFileError);
        }
      }

      // Delete backup record
      const { error: deleteRecordError } = await supabase
        .from("backups")
        .delete()
        .eq("id", backupId);

      if (deleteRecordError) {
        console.error("Error deleting backup record:", deleteRecordError);
        throw deleteRecordError;
      }

      console.log("Backup deleted successfully:", backupId);

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
    
    else if (action === "list") {
      console.log("Listing backups for school:", schoolId);

      let query = supabase
        .from("backups")
        .select("*")
        .order("created_at", { ascending: false });

      if (schoolId && schoolId !== 'all') {
        query = query.eq("school_id", schoolId);
      }

      const { data: backups, error: listError } = await query;

      if (listError) {
        console.error("Error listing backups:", listError);
        throw listError;
      }

      return new Response(
        JSON.stringify({ success: true, backups }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    throw new Error("Invalid action");

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