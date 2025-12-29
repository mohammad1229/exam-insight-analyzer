import { supabase } from "@/integrations/supabase/client";
import { getStoredLicense } from "@/services/licenseService";

// Get current user context (school admin or system admin)
export const getCurrentUserContext = () => {
  // Check for school admin license first
  const license = getStoredLicense();
  if (license && license.schoolId) {
    return {
      type: 'school_admin' as const,
      schoolId: license.schoolId,
      schoolName: license.schoolName || 'Unknown',
      userId: license.schoolId
    };
  }

  // Check for system admin
  const systemAdmin = localStorage.getItem("systemAdminData");
  if (systemAdmin) {
    try {
      const adminData = JSON.parse(systemAdmin);
      return {
        type: 'system_admin' as const,
        schoolId: 'system',
        schoolName: 'مسؤول النظام',
        userId: adminData.id || 'system'
      };
    } catch {
      // Invalid JSON, ignore
    }
  }

  // Check for school admin login data
  const schoolAdminData = localStorage.getItem("currentAdminData");
  if (schoolAdminData) {
    try {
      const adminData = JSON.parse(schoolAdminData);
      return {
        type: 'school_admin' as const,
        schoolId: adminData.school_id || adminData.schoolId,
        schoolName: adminData.school_name || adminData.schoolName || 'Unknown',
        userId: adminData.id
      };
    } catch {
      // Invalid JSON, ignore
    }
  }

  return null;
};

// Create a cloud backup
export const createCloudBackup = async (
  schoolId: string,
  schoolName: string,
  backupType: 'manual' | 'automatic' = 'manual'
) => {
  // Get all data from localStorage based on user type
  const backupData: Record<string, any> = {};
  
  // Common keys to backup
  const keysToBackup = [
    'app_students', 'app_teachers', 'app_classes', 
    'app_subjects', 'app_tests', 'app_school',
    'licenseInfo', 'schoolName', 'directorName',
    'currentAdminData'
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

  // Add metadata
  backupData._metadata = {
    backupType,
    schoolId,
    schoolName,
    createdAt: new Date().toISOString(),
    version: '2.0'
  };

  // Call edge function to create backup
  const { data, error } = await supabase.functions.invoke('create-backup', {
    body: {
      action: 'create',
      schoolId,
      schoolName,
      backupType,
      backupData
    }
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'فشل في إنشاء النسخة الاحتياطية');
  
  return data.backup;
};

// Get all backups for a school
export const getBackups = async (schoolId?: string) => {
  const { data, error } = await supabase.functions.invoke('create-backup', {
    body: {
      action: 'list',
      schoolId: schoolId || 'all'
    }
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'فشل في جلب النسخ الاحتياطية');
  
  return data.backups;
};

// Restore from cloud backup
export const restoreFromCloudBackup = async (backupId: string): Promise<Record<string, any>> => {
  const { data, error } = await supabase.functions.invoke('create-backup', {
    body: {
      action: 'restore',
      backupId
    }
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'فشل في استعادة النسخة الاحتياطية');

  const backupData = data.backupData;

  // Restore each key to localStorage (except metadata)
  Object.keys(backupData).forEach(key => {
    if (key !== '_metadata') {
      if (typeof backupData[key] === 'object') {
        localStorage.setItem(key, JSON.stringify(backupData[key]));
      } else {
        localStorage.setItem(key, backupData[key]);
      }
    }
  });

  return backupData;
};

// Download backup file
export const downloadCloudBackup = async (backupId: string) => {
  const { data, error } = await supabase.functions.invoke('create-backup', {
    body: {
      action: 'download',
      backupId
    }
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'فشل في تحميل النسخة الاحتياطية');

  // Open download URL in new tab
  window.open(data.downloadUrl, '_blank');
  
  return data;
};

// Delete a backup
export const deleteBackup = async (backupId: string) => {
  const { data, error } = await supabase.functions.invoke('create-backup', {
    body: {
      action: 'delete',
      backupId
    }
  });

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'فشل في حذف النسخة الاحتياطية');
  
  return true;
};

// Create automatic backup
export const createAutomaticBackup = async () => {
  const userContext = getCurrentUserContext();
  
  if (!userContext) {
    console.log("No active user context found for backup");
    return null;
  }

  console.log(`Creating automatic backup for: ${userContext.type} - ${userContext.schoolName}`);

  try {
    const backup = await createCloudBackup(
      userContext.schoolId,
      userContext.schoolName,
      'automatic'
    );

    console.log(`Automatic backup completed: ${backup.id}`);
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
  const userContext = getCurrentUserContext();
  
  if (userContext) {
    scheduleAutomaticBackup();
    console.log(`Backup scheduler initialized for ${userContext.type}: ${userContext.schoolName}`);
  } else {
    console.log("No user context found - backup scheduler not started");
    // Retry after 5 seconds in case user logs in later
    setTimeout(() => {
      const retryContext = getCurrentUserContext();
      if (retryContext) {
        scheduleAutomaticBackup();
        console.log(`Backup scheduler initialized (delayed) for ${retryContext.type}: ${retryContext.schoolName}`);
      }
    }, 5000);
  }
};

// Manual backup download (local)
export const downloadBackup = () => {
  const backupData: Record<string, any> = {};
  const keysToBackup = [
    'app_students', 'app_teachers', 'app_classes', 
    'app_subjects', 'app_tests', 'app_school',
    'licenseInfo', 'currentAdminData'
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

  // Add metadata
  backupData._metadata = {
    backupType: 'local',
    createdAt: new Date().toISOString(),
    version: '2.0'
  };

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

// Legacy function for compatibility
export const createBackupRecord = async (
  schoolId: string,
  schoolName: string,
  backupType: 'manual' | 'automatic' = 'manual'
) => {
  return createCloudBackup(schoolId, schoolName, backupType);
};

// Legacy function for compatibility
export const completeBackup = async (
  backupId: string,
  filePath: string,
  fileSize: number
) => {
  // No-op - backups are completed immediately now
  console.log("completeBackup called (legacy) - no action needed");
};

// Get available cloud backups for restore
export const getCloudBackupsForRestore = async (schoolId: string) => {
  return getBackups(schoolId);
};