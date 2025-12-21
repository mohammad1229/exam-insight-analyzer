// IndexedDB Service - Local data storage with reliable persistence
// Stores all school data locally for offline access

const DB_NAME = 'SchoolManagementDB';
const DB_VERSION = 1;

// Store names for all data types
const STORES = {
  CLASSES: 'classes',
  SECTIONS: 'sections',
  SUBJECTS: 'subjects',
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  TESTS: 'tests',
  TEST_RESULTS: 'test_results',
  PERFORMANCE_LEVELS: 'performance_levels',
  SYNC_QUEUE: 'sync_queue',
  SETTINGS: 'settings',
  SCHOOLS: 'schools',
} as const;

let db: IDBDatabase | null = null;

// Initialize IndexedDB
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('IndexedDB initialized successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create stores for all data types
      Object.values(STORES).forEach((storeName) => {
        if (!database.objectStoreNames.contains(storeName)) {
          const store = database.createObjectStore(storeName, { keyPath: 'id' });
          
          // Add school_id index for filtering
          if (storeName !== STORES.SYNC_QUEUE && storeName !== STORES.SETTINGS) {
            store.createIndex('school_id', 'school_id', { unique: false });
          }
          
          // Add sync status index for sync queue
          if (storeName === STORES.SYNC_QUEUE) {
            store.createIndex('status', 'status', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        }
      });

      console.log('IndexedDB stores created');
    };
  });
};

// Generic CRUD operations
export const addItem = async <T extends { id: string }>(
  storeName: string,
  item: T
): Promise<T> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
};

export const getItem = async <T>(
  storeName: string,
  id: string
): Promise<T | undefined> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllItems = async <T>(
  storeName: string,
  schoolId?: string
): Promise<T[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    if (schoolId && store.indexNames.contains('school_id')) {
      const index = store.index('school_id');
      const request = index.getAll(schoolId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } else {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }
  });
};

export const updateItem = async <T extends { id: string }>(
  storeName: string,
  item: T
): Promise<T> => {
  return addItem(storeName, item);
};

export const deleteItem = async (
  storeName: string,
  id: string
): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearStore = async (storeName: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const bulkAddItems = async <T extends { id: string }>(
  storeName: string,
  items: T[]
): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    items.forEach((item) => {
      store.put(item);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// Sync Queue operations
export interface SyncQueueItem {
  id: string;
  action: 'add' | 'update' | 'delete';
  storeName: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
}

export const addToSyncQueue = async (
  action: SyncQueueItem['action'],
  storeName: string,
  data: any
): Promise<void> => {
  const item: SyncQueueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    action,
    storeName,
    data,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  };
  await addItem(STORES.SYNC_QUEUE, item);
};

export const getPendingSyncItems = async (): Promise<SyncQueueItem[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.SYNC_QUEUE, 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');
    const request = index.getAll('pending');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const updateSyncItemStatus = async (
  id: string,
  status: SyncQueueItem['status'],
  retryCount?: number
): Promise<void> => {
  const item = await getItem<SyncQueueItem>(STORES.SYNC_QUEUE, id);
  if (item) {
    item.status = status;
    if (retryCount !== undefined) {
      item.retryCount = retryCount;
    }
    await updateItem(STORES.SYNC_QUEUE, item);
  }
};

export const removeSyncedItems = async (): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');
    const request = index.openCursor('synced');

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
};

// Settings operations
export interface StorageSettings {
  id: string;
  storageMode: 'local' | 'cloud' | 'hybrid';
  autoSync: boolean;
  syncInterval: number; // in minutes
  lastSyncTime: number | null;
}

export const getStorageSettings = async (): Promise<StorageSettings> => {
  const settings = await getItem<StorageSettings>(STORES.SETTINGS, 'storage_settings');
  return settings || {
    id: 'storage_settings',
    storageMode: 'hybrid',
    autoSync: true,
    syncInterval: 5,
    lastSyncTime: null,
  };
};

export const saveStorageSettings = async (settings: Partial<StorageSettings>): Promise<void> => {
  const current = await getStorageSettings();
  await addItem(STORES.SETTINGS, { ...current, ...settings, id: 'storage_settings' });
};

// Export store names for use in other services
export { STORES };

// Count pending sync items
export const getPendingSyncCount = async (): Promise<number> => {
  const items = await getPendingSyncItems();
  return items.length;
};

// Get all data for backup/export
export const exportAllData = async (schoolId: string): Promise<Record<string, any[]>> => {
  const data: Record<string, any[]> = {};
  
  for (const storeName of Object.values(STORES)) {
    if (storeName !== STORES.SYNC_QUEUE && storeName !== STORES.SETTINGS) {
      data[storeName] = await getAllItems(storeName, schoolId);
    }
  }
  
  return data;
};

// Import all data from backup
export const importAllData = async (data: Record<string, any[]>): Promise<void> => {
  for (const [storeName, items] of Object.entries(data)) {
    if (items && Array.isArray(items) && items.length > 0) {
      await bulkAddItems(storeName, items);
    }
  }
};
