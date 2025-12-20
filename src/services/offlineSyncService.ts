// Offline Sync Service - Manages offline data storage and synchronization
import { supabase } from "@/integrations/supabase/client";

interface PendingOperation {
  id: string;
  action: string;
  schoolId: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

const PENDING_OPS_KEY = "pendingOperations";
const SYNC_STATUS_KEY = "lastSyncStatus";

// Check if online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Get pending operations from localStorage
export const getPendingOperations = (): PendingOperation[] => {
  try {
    const stored = localStorage.getItem(PENDING_OPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Error reading pending operations:", e);
    return [];
  }
};

// Save pending operations to localStorage
const savePendingOperations = (ops: PendingOperation[]): void => {
  try {
    localStorage.setItem(PENDING_OPS_KEY, JSON.stringify(ops));
  } catch (e) {
    console.error("Error saving pending operations:", e);
  }
};

// Add a new pending operation
export const addPendingOperation = (action: string, schoolId: string, data: any): void => {
  const ops = getPendingOperations();
  const newOp: PendingOperation = {
    id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    action,
    schoolId,
    data,
    timestamp: Date.now(),
    retryCount: 0
  };
  ops.push(newOp);
  savePendingOperations(ops);
  console.log(`Added pending operation: ${action}`);
};

// Remove a completed operation
const removeOperation = (opId: string): void => {
  const ops = getPendingOperations();
  const filtered = ops.filter(op => op.id !== opId);
  savePendingOperations(filtered);
};

// Update retry count for a failed operation
const incrementRetryCount = (opId: string): void => {
  const ops = getPendingOperations();
  const op = ops.find(o => o.id === opId);
  if (op) {
    op.retryCount++;
    savePendingOperations(ops);
  }
};

// Execute a single operation
const executeOperation = async (op: PendingOperation): Promise<boolean> => {
  try {
    const { data: result, error } = await supabase.functions.invoke("school-data", {
      body: { action: op.action, schoolId: op.schoolId, data: op.data }
    });

    if (error) {
      console.error(`Error executing operation ${op.action}:`, error);
      return false;
    }

    if (result?.success) {
      console.log(`Successfully synced operation: ${op.action}`);
      return true;
    }

    return false;
  } catch (e) {
    console.error(`Failed to execute operation ${op.action}:`, e);
    return false;
  }
};

// Sync all pending operations
export const syncPendingOperations = async (): Promise<{ synced: number; failed: number }> => {
  if (!isOnline()) {
    console.log("Cannot sync: offline");
    return { synced: 0, failed: 0 };
  }

  const ops = getPendingOperations();
  if (ops.length === 0) {
    console.log("No pending operations to sync");
    return { synced: 0, failed: 0 };
  }

  console.log(`Syncing ${ops.length} pending operations...`);
  let synced = 0;
  let failed = 0;

  for (const op of ops) {
    // Skip operations that have failed too many times
    if (op.retryCount >= 5) {
      console.log(`Skipping operation ${op.id} - too many retries`);
      failed++;
      continue;
    }

    const success = await executeOperation(op);
    if (success) {
      removeOperation(op.id);
      synced++;
    } else {
      incrementRetryCount(op.id);
      failed++;
    }
  }

  // Update sync status
  localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
    lastSync: Date.now(),
    synced,
    failed,
    pendingCount: getPendingOperations().length
  }));

  return { synced, failed };
};

// Get sync status
export const getSyncStatus = (): { lastSync: number; synced: number; failed: number; pendingCount: number } | null => {
  try {
    const stored = localStorage.getItem(SYNC_STATUS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

// Clear all pending operations (use with caution)
export const clearPendingOperations = (): void => {
  localStorage.removeItem(PENDING_OPS_KEY);
};

// Setup automatic sync when coming online
export const setupAutoSync = (onSyncComplete?: (result: { synced: number; failed: number }) => void): () => void => {
  const handleOnline = async () => {
    console.log("Connection restored - starting sync...");
    const result = await syncPendingOperations();
    if (onSyncComplete) {
      onSyncComplete(result);
    }
  };

  window.addEventListener("online", handleOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
  };
};

// Wrapper for database operations that handles offline mode
export const executeWithOfflineSupport = async (
  action: string,
  schoolId: string,
  data: any,
  localFallback?: () => void
): Promise<{ success: boolean; data?: any; offline?: boolean }> => {
  if (isOnline()) {
    try {
      const { data: result, error } = await supabase.functions.invoke("school-data", {
        body: { action, schoolId, data }
      });

      if (error) throw error;

      if (result?.success) {
        return { success: true, data: result.data };
      }
      
      throw new Error(result?.error || "Unknown error");
    } catch (e) {
      console.error("Online operation failed:", e);
      // Fall through to offline handling
    }
  }

  // Offline or failed online - store for later sync
  addPendingOperation(action, schoolId, data);
  
  if (localFallback) {
    localFallback();
  }

  return { success: true, offline: true };
};

// Export for service worker registration
export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered:', registration.scope);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};
