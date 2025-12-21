// Hybrid Storage Service - Manages local-first storage with cloud sync
// Data is stored locally first, then synced to cloud as backup

import { supabase } from "@/integrations/supabase/client";
import * as idb from "./indexedDBService";
import { STORES } from "./indexedDBService";

// Get current school ID
const getSchoolId = (): string => {
  return localStorage.getItem("currentSchoolId") || "";
};

// Check if online
const isOnline = (): boolean => {
  return navigator.onLine;
};

// ========== HYBRID DATA OPERATIONS ==========

// Generic hybrid operation wrapper
const hybridOperation = async <T>(
  localOperation: () => Promise<T>,
  cloudOperation: () => Promise<T>,
  syncAction?: () => Promise<void>
): Promise<T> => {
  const settings = await idb.getStorageSettings();
  
  // Always perform local operation first
  const localResult = await localOperation();
  
  // If hybrid or cloud mode, also sync to cloud
  if ((settings.storageMode === 'hybrid' || settings.storageMode === 'cloud') && isOnline()) {
    try {
      await cloudOperation();
    } catch (error) {
      console.error('Cloud sync failed, data saved locally:', error);
      // Add to sync queue for later
      if (syncAction) {
        await syncAction();
      }
    }
  } else if (settings.storageMode === 'hybrid' && syncAction) {
    // Offline but hybrid mode - queue for later sync
    await syncAction();
  }
  
  return localResult;
};

// ========== CLASSES ==========
export const getClassesHybrid = async () => {
  const schoolId = getSchoolId();
  const settings = await idb.getStorageSettings();
  
  // Try to get from cloud first if cloud mode and online
  if ((settings.storageMode === 'cloud' || settings.storageMode === 'hybrid') && isOnline()) {
    try {
      const { data, error } = await supabase.functions.invoke('school-data', {
        body: { action: 'getClasses', schoolId }
      });
      
      if (!error && data.success) {
        // Cache to local
        await idb.bulkAddItems(STORES.CLASSES, data.data || []);
        return data.data;
      }
    } catch (e) {
      console.log('Cloud fetch failed, using local data');
    }
  }
  
  // Return local data
  return idb.getAllItems(STORES.CLASSES, schoolId);
};

export const addClassHybrid = async (classData: { name: string; sections?: { name: string }[] }) => {
  const schoolId = getSchoolId();
  const newClass = {
    id: `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    school_id: schoolId,
    name: classData.name,
    display_order: 0,
    sections: classData.sections?.map((s, idx) => ({
      id: `section_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
      class_id: '',
      school_id: schoolId,
      name: s.name,
      display_order: idx
    })) || []
  };

  return hybridOperation(
    async () => {
      await idb.addItem(STORES.CLASSES, newClass);
      return newClass;
    },
    async () => {
      const { data } = await supabase.functions.invoke('school-data', {
        body: { action: 'addClass', schoolId, data: classData }
      });
      if (data.success) {
        // Update local with cloud ID
        await idb.addItem(STORES.CLASSES, data.data);
      }
      return data.data;
    },
    async () => {
      await idb.addToSyncQueue('add', STORES.CLASSES, { ...classData, localId: newClass.id });
    }
  );
};

// ========== SUBJECTS ==========
export const getSubjectsHybrid = async () => {
  const schoolId = getSchoolId();
  const settings = await idb.getStorageSettings();
  
  if ((settings.storageMode === 'cloud' || settings.storageMode === 'hybrid') && isOnline()) {
    try {
      const { data, error } = await supabase.functions.invoke('school-data', {
        body: { action: 'getSubjects', schoolId }
      });
      
      if (!error && data.success) {
        await idb.bulkAddItems(STORES.SUBJECTS, data.data || []);
        return data.data;
      }
    } catch (e) {
      console.log('Cloud fetch failed, using local data');
    }
  }
  
  return idb.getAllItems(STORES.SUBJECTS, schoolId);
};

export const addSubjectHybrid = async (name: string) => {
  const schoolId = getSchoolId();
  const newSubject = {
    id: `subject_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    school_id: schoolId,
    name,
    display_order: 0
  };

  return hybridOperation(
    async () => {
      await idb.addItem(STORES.SUBJECTS, newSubject);
      return newSubject;
    },
    async () => {
      const { data } = await supabase.functions.invoke('school-data', {
        body: { action: 'addSubject', schoolId, data: { name } }
      });
      if (data.success) {
        await idb.addItem(STORES.SUBJECTS, data.data);
      }
      return data.data;
    },
    async () => {
      await idb.addToSyncQueue('add', STORES.SUBJECTS, { name, localId: newSubject.id });
    }
  );
};

// ========== STUDENTS ==========
export const getStudentsHybrid = async () => {
  const schoolId = getSchoolId();
  const settings = await idb.getStorageSettings();
  
  if ((settings.storageMode === 'cloud' || settings.storageMode === 'hybrid') && isOnline()) {
    try {
      const { data, error } = await supabase.functions.invoke('school-data', {
        body: { action: 'getStudents', schoolId }
      });
      
      if (!error && data.success) {
        await idb.bulkAddItems(STORES.STUDENTS, data.data || []);
        return data.data;
      }
    } catch (e) {
      console.log('Cloud fetch failed, using local data');
    }
  }
  
  return idb.getAllItems(STORES.STUDENTS, schoolId);
};

export const addStudentHybrid = async (studentData: { 
  name: string; 
  class_id: string; 
  section_id: string;
  student_number?: string;
}) => {
  const schoolId = getSchoolId();
  const newStudent = {
    id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    school_id: schoolId,
    ...studentData
  };

  return hybridOperation(
    async () => {
      await idb.addItem(STORES.STUDENTS, newStudent);
      return newStudent;
    },
    async () => {
      const { data } = await supabase.functions.invoke('school-data', {
        body: { action: 'addStudent', schoolId, data: studentData }
      });
      if (data.success) {
        await idb.addItem(STORES.STUDENTS, data.data);
      }
      return data.data;
    },
    async () => {
      await idb.addToSyncQueue('add', STORES.STUDENTS, { ...studentData, localId: newStudent.id });
    }
  );
};

// ========== TEACHERS ==========
export const getTeachersHybrid = async () => {
  const schoolId = getSchoolId();
  const settings = await idb.getStorageSettings();
  
  if ((settings.storageMode === 'cloud' || settings.storageMode === 'hybrid') && isOnline()) {
    try {
      const { data, error } = await supabase.functions.invoke('school-data', {
        body: { action: 'getTeachers', schoolId }
      });
      
      if (!error && data.success) {
        await idb.bulkAddItems(STORES.TEACHERS, data.data || []);
        return data.data;
      }
    } catch (e) {
      console.log('Cloud fetch failed, using local data');
    }
  }
  
  return idb.getAllItems(STORES.TEACHERS, schoolId);
};

// ========== TESTS ==========
export const getTestsHybrid = async () => {
  const schoolId = getSchoolId();
  const settings = await idb.getStorageSettings();
  
  if ((settings.storageMode === 'cloud' || settings.storageMode === 'hybrid') && isOnline()) {
    try {
      const { data, error } = await supabase.functions.invoke('school-data', {
        body: { action: 'getTests', schoolId }
      });
      
      if (!error && data.success) {
        await idb.bulkAddItems(STORES.TESTS, data.data || []);
        return data.data;
      }
    } catch (e) {
      console.log('Cloud fetch failed, using local data');
    }
  }
  
  return idb.getAllItems(STORES.TESTS, schoolId);
};

export const addTestHybrid = async (testData: {
  teacher_id: string;
  subject_id: string;
  class_id: string;
  section_id: string;
  name: string;
  test_type?: string;
  test_date?: string;
  questions?: any[];
  notes?: string;
  is_draft?: boolean;
}) => {
  const schoolId = getSchoolId();
  const newTest = {
    id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    school_id: schoolId,
    ...testData,
    test_type: testData.test_type || 'quiz',
    test_date: testData.test_date || new Date().toISOString().split('T')[0],
    questions: testData.questions || [],
    is_draft: testData.is_draft ?? true,
    created_at: new Date().toISOString()
  };

  return hybridOperation(
    async () => {
      await idb.addItem(STORES.TESTS, newTest);
      return newTest;
    },
    async () => {
      const { data } = await supabase.functions.invoke('school-data', {
        body: { action: 'addTest', schoolId, data: testData }
      });
      if (data.success) {
        await idb.addItem(STORES.TESTS, data.data);
      }
      return data.data;
    },
    async () => {
      await idb.addToSyncQueue('add', STORES.TESTS, { ...testData, localId: newTest.id });
    }
  );
};

// ========== PERFORMANCE LEVELS ==========
export const getPerformanceLevelsHybrid = async () => {
  const schoolId = getSchoolId();
  const settings = await idb.getStorageSettings();
  
  if ((settings.storageMode === 'cloud' || settings.storageMode === 'hybrid') && isOnline()) {
    try {
      const { data, error } = await supabase.functions.invoke('school-data', {
        body: { action: 'getPerformanceLevels', schoolId }
      });
      
      if (!error && data.success) {
        await idb.bulkAddItems(STORES.PERFORMANCE_LEVELS, data.data || []);
        return data.data;
      }
    } catch (e) {
      console.log('Cloud fetch failed, using local data');
    }
  }
  
  return idb.getAllItems(STORES.PERFORMANCE_LEVELS, schoolId);
};

// ========== SYNC OPERATIONS ==========
export const syncPendingChanges = async (): Promise<{ success: number; failed: number }> => {
  const pendingItems = await idb.getPendingSyncItems();
  let success = 0;
  let failed = 0;

  for (const item of pendingItems) {
    try {
      await idb.updateSyncItemStatus(item.id, 'syncing');
      
      const schoolId = getSchoolId();
      let action = '';
      
      switch (item.storeName) {
        case STORES.CLASSES:
          action = item.action === 'add' ? 'addClass' : item.action === 'update' ? 'updateClass' : 'deleteClass';
          break;
        case STORES.SUBJECTS:
          action = item.action === 'add' ? 'addSubject' : item.action === 'update' ? 'updateSubject' : 'deleteSubject';
          break;
        case STORES.STUDENTS:
          action = item.action === 'add' ? 'addStudent' : item.action === 'update' ? 'updateStudent' : 'deleteStudent';
          break;
        case STORES.TESTS:
          action = item.action === 'add' ? 'addTest' : item.action === 'update' ? 'updateTest' : 'deleteTest';
          break;
        default:
          continue;
      }

      const { data, error } = await supabase.functions.invoke('school-data', {
        body: { action, schoolId, data: item.data }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Sync failed');
      }

      await idb.updateSyncItemStatus(item.id, 'synced');
      success++;
    } catch (error) {
      console.error('Sync failed for item:', item.id, error);
      await idb.updateSyncItemStatus(item.id, 'failed', item.retryCount + 1);
      failed++;
    }
  }

  // Clean up synced items
  await idb.removeSyncedItems();
  
  // Update last sync time
  await idb.saveStorageSettings({ lastSyncTime: Date.now() });

  return { success, failed };
};

// Download all data from cloud to local
export const downloadCloudData = async (): Promise<void> => {
  const schoolId = getSchoolId();
  
  const endpoints = [
    { action: 'getClasses', store: STORES.CLASSES },
    { action: 'getSubjects', store: STORES.SUBJECTS },
    { action: 'getStudents', store: STORES.STUDENTS },
    { action: 'getTeachers', store: STORES.TEACHERS },
    { action: 'getTests', store: STORES.TESTS },
    { action: 'getPerformanceLevels', store: STORES.PERFORMANCE_LEVELS },
  ];

  for (const { action, store } of endpoints) {
    try {
      const { data, error } = await supabase.functions.invoke('school-data', {
        body: { action, schoolId }
      });
      
      if (!error && data.success && data.data) {
        await idb.bulkAddItems(store, data.data);
      }
    } catch (e) {
      console.error(`Failed to download ${action}:`, e);
    }
  }

  await idb.saveStorageSettings({ lastSyncTime: Date.now() });
};

// Upload all local data to cloud
export const uploadLocalData = async (): Promise<void> => {
  const schoolId = getSchoolId();
  const allData = await idb.exportAllData(schoolId);
  
  // This would need a bulk upload endpoint on the server
  console.log('Local data ready for upload:', allData);
  
  await idb.saveStorageSettings({ lastSyncTime: Date.now() });
};

// Get storage status
export const getStorageStatus = async () => {
  const settings = await idb.getStorageSettings();
  const pendingCount = await idb.getPendingSyncCount();
  
  return {
    mode: settings.storageMode,
    autoSync: settings.autoSync,
    lastSyncTime: settings.lastSyncTime,
    pendingSyncCount: pendingCount,
    isOnline: isOnline()
  };
};

// Initialize hybrid storage
export const initHybridStorage = async (): Promise<void> => {
  await idb.initDB();
  
  // Set up online/offline listeners
  window.addEventListener('online', async () => {
    console.log('Back online, syncing pending changes...');
    const settings = await idb.getStorageSettings();
    if (settings.autoSync) {
      await syncPendingChanges();
    }
  });

  // Start auto-sync if enabled
  const settings = await idb.getStorageSettings();
  if (settings.autoSync && settings.syncInterval > 0) {
    setInterval(async () => {
      if (isOnline()) {
        await syncPendingChanges();
      }
    }, settings.syncInterval * 60 * 1000);
  }
};
