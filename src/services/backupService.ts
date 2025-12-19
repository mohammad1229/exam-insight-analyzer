import { supabase } from "@/integrations/supabase/client";
import { getStoredLicense } from "@/services/licenseService";

// Create a backup record in the database
export const createBackupRecord = async (
  schoolId: string,
  schoolName: string,
  backupType: 'manual' | 'automatic' = 'manual'
) => {
  const { data, error } = await supabase
    .from("backups")
    .insert({
      school_id: schoolId,
      school_name: schoolName,
      backup_type: backupType,
      status: 'pending',
      created_by: 'system'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Complete a backup
export const completeBackup = async (
  backupId: string,
  filePath: string,
  fileSize: number
) => {
  const { error } = await supabase
    .from("backups")
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      file_path: filePath,
      file_size: fileSize
    })
    .eq("id", backupId);

  if (error) throw error;
};

// Get all backups for a school
export const getBackups = async (schoolId?: string) => {
  let query = supabase
    .from("backups")
    .select("*")
    .order("created_at", { ascending: false });

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Create automatic backup
export const createAutomaticBackup = async () => {
  const license = getStoredLicense();
  if (!license || !license.schoolId) {
    console.log("No active license found for backup");
    return null;
  }

  try {
    // Create backup record
    const backup = await createBackupRecord(
      license.schoolId,
      license.schoolName || 'Unknown',
      'automatic'
    );

    // Get all data from localStorage
    const backupData: Record<string, any> = {};
    const keysToBackup = [
      'app_students', 'app_teachers', 'app_classes', 
      'app_subjects', 'app_tests', 'app_school'
    ];

    keysToBackup.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        backupData[key] = JSON.parse(value);
      }
    });

    // Convert to JSON string
    const jsonData = JSON.stringify(backupData, null, 2);
    const dataSize = new Blob([jsonData]).size;

    // Mark backup as completed
    await completeBackup(backup.id, `backup_${backup.id}.json`, dataSize);

    // Store backup data reference
    localStorage.setItem(`backup_${backup.id}`, jsonData);

    return backup;
  } catch (error) {
    console.error("Error creating automatic backup:", error);
    throw error;
  }
};

// Schedule automatic backup at 11 PM
export const scheduleAutomaticBackup = () => {
  const now = new Date();
  const target = new Date();
  target.setHours(23, 0, 0, 0); // 11 PM

  // If it's already past 11 PM, schedule for tomorrow
  if (now > target) {
    target.setDate(target.getDate() + 1);
  }

  const timeUntilBackup = target.getTime() - now.getTime();

  console.log(`Next automatic backup scheduled in ${Math.round(timeUntilBackup / 1000 / 60)} minutes`);

  setTimeout(async () => {
    try {
      await createAutomaticBackup();
      console.log("Automatic backup completed successfully");
      // Schedule the next backup
      scheduleAutomaticBackup();
    } catch (error) {
      console.error("Automatic backup failed:", error);
      // Try again in 1 hour
      setTimeout(scheduleAutomaticBackup, 60 * 60 * 1000);
    }
  }, timeUntilBackup);
};

// Initialize backup scheduler
export const initializeBackupScheduler = () => {
  const license = getStoredLicense();
  if (license && license.schoolId) {
    scheduleAutomaticBackup();
    console.log("Backup scheduler initialized");
  }
};

// Manual backup download
export const downloadBackup = () => {
  const backupData: Record<string, any> = {};
  const keysToBackup = [
    'app_students', 'app_teachers', 'app_classes', 
    'app_subjects', 'app_tests', 'app_school',
    'licenseInfo'
  ];

  keysToBackup.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        backupData[key] = JSON.parse(value);
      } catch {
        backupData[key] = value;
      }
    }
  });

  const license = getStoredLicense();
  const schoolName = license?.schoolName || 'backup';
  const date = new Date().toISOString().split('T')[0];
  const filename = `${schoolName}_backup_${date}.json`;

  const jsonData = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { success: true, filename };
};
