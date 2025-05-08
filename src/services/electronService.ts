// Electron API interface definition
interface ElectronAPI {
  chooseDirectory: () => Promise<string | null>;
  db: {
    getAll: (table: string) => Promise<any[]>;
    getById: (table: string, id: string) => Promise<any>;
    query: (query: string, params: any[]) => Promise<any[]>;
    insert: (table: string, data: any) => Promise<number>;
    update: (table: string, id: string, data: any) => Promise<number>;
    delete: (table: string, id: string) => Promise<number>;
  };
  generateLicense: (schoolName: string, directorName: string) => 
    Promise<{key: string, schoolName: string, directorName: string, createdAt: string, validUntil: string, used: number}>;
  activateLicense: (licenseKey: string) => 
    Promise<{success: boolean, message: string, license?: any}>;
  getLicenseKeys: () => Promise<any[]>;
  getSystemSettings: () => Promise<Record<string, string>>;
  updateSystemSettings: (settings: Record<string, string>) => Promise<boolean>;
  backupDatabase: () => Promise<string>;
  restoreDatabase: (backupPath: string) => Promise<boolean>;
  appInfo: {
    getVersion: () => Promise<string>;
    getAppPath: () => Promise<string>;
  };
}

// Extend Window interface to include electron property
declare global {
  interface Window {
    electron?: ElectronAPI;
    indexedDB: IDBFactory;
  }
}

// IndexedDB database name and version
const DB_NAME = 'schoolExamsDB';
const DB_VERSION = 1;

// Check if running in Electron environment
export const isElectron = (): boolean => {
  return window.electron !== undefined;
};

// Initialize IndexedDB for web environment
const initIndexedDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.error('Your browser does not support IndexedDB');
      reject('IndexedDB not supported');
      return;
    }
    
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event);
      reject('Error opening database');
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create stores for each table
      const tables = [
        'users', 'classes', 'sections', 'students', 
        'subjects', 'teachers', 'tests', 'questions', 
        'results', 'questionScores', 'licenses', 'settings'
      ];
      
      tables.forEach(table => {
        if (!db.objectStoreNames.contains(table)) {
          db.createObjectStore(table, { keyPath: 'id' });
        }
      });
    };
  });
};

// Service to access Electron features or web fallback
const electronService = {
  // Directory selection
  chooseDirectory: async (): Promise<string | null> => {
    if (isElectron()) {
      return await window.electron!.chooseDirectory();
    }
    return null;
  },
  
  // Database operations with web IndexedDB fallback
  db: {
    getAll: async (table: string): Promise<any[]> => {
      if (isElectron()) {
        return await window.electron!.db.getAll(table);
      }
      
      // IndexedDB fallback
      try {
        const db = await initIndexedDB();
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(table, 'readonly');
          const store = transaction.objectStore(table);
          const request = store.getAll();
          
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error(`Error in getAll(${table}):`, error);
        // Last resort fallback to localStorage
        return JSON.parse(localStorage.getItem(table) || '[]');
      }
    },
    
    getById: async (table: string, id: string): Promise<any> => {
      if (isElectron()) {
        return await window.electron!.db.getById(table, id);
      }
      
      // IndexedDB fallback
      try {
        const db = await initIndexedDB();
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(table, 'readonly');
          const store = transaction.objectStore(table);
          const request = store.get(id);
          
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error(`Error in getById(${table}, ${id}):`, error);
        // Last resort fallback to localStorage
        const items = JSON.parse(localStorage.getItem(table) || '[]');
        return items.find((item: any) => item.id === id);
      }
    },
    
    query: async (query: string, params: any[] = []): Promise<any[]> => {
      if (isElectron()) {
        return await window.electron!.db.query(query, params);
      }
      // Limited query support for web version
      console.warn('Custom queries have limited support in web environment');
      return [];
    },
    
    insert: async (table: string, data: any): Promise<number> => {
      if (isElectron()) {
        return await window.electron!.db.insert(table, data);
      }
      
      // IndexedDB fallback
      try {
        const db = await initIndexedDB();
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(table, 'readwrite');
          const store = transaction.objectStore(table);
          
          // Ensure the data has an ID
          if (!data.id) {
            data.id = `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          }
          
          const request = store.add(data);
          
          request.onsuccess = () => resolve(1); // Return 1 to indicate success
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error(`Error in insert(${table}):`, error);
        // Last resort fallback to localStorage
        const items = JSON.parse(localStorage.getItem(table) || '[]');
        if (!data.id) {
          data.id = `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        items.push(data);
        localStorage.setItem(table, JSON.stringify(items));
        return 1;
      }
    },
    
    update: async (table: string, id: string, data: any): Promise<number> => {
      if (isElectron()) {
        return await window.electron!.db.update(table, id, data);
      }
      
      // IndexedDB fallback
      try {
        const db = await initIndexedDB();
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(table, 'readwrite');
          const store = transaction.objectStore(table);
          
          // First get the existing item
          const getRequest = store.get(id);
          
          getRequest.onsuccess = () => {
            const existingItem = getRequest.result;
            if (!existingItem) {
              resolve(0); // No item to update
              return;
            }
            
            // Merge the existing item with updated data
            const updatedItem = { ...existingItem, ...data, id };
            const putRequest = store.put(updatedItem);
            
            putRequest.onsuccess = () => resolve(1); // One item updated
            putRequest.onerror = () => reject(putRequest.error);
          };
          
          getRequest.onerror = () => reject(getRequest.error);
        });
      } catch (error) {
        console.error(`Error in update(${table}, ${id}):`, error);
        // Last resort fallback to localStorage
        const items = JSON.parse(localStorage.getItem(table) || '[]');
        const index = items.findIndex((item: any) => item.id === id);
        if (index !== -1) {
          items[index] = { ...items[index], ...data };
          localStorage.setItem(table, JSON.stringify(items));
          return 1;
        }
        return 0;
      }
    },
    
    delete: async (table: string, id: string): Promise<number> => {
      if (isElectron()) {
        return await window.electron!.db.delete(table, id);
      }
      
      // IndexedDB fallback
      try {
        const db = await initIndexedDB();
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(table, 'readwrite');
          const store = transaction.objectStore(table);
          const request = store.delete(id);
          
          request.onsuccess = () => resolve(1); // One item deleted
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error(`Error in delete(${table}, ${id}):`, error);
        // Last resort fallback to localStorage
        const items = JSON.parse(localStorage.getItem(table) || '[]');
        const filteredItems = items.filter((item: any) => item.id !== id);
        localStorage.setItem(table, JSON.stringify(filteredItems));
        return items.length - filteredItems.length;
      }
    }
  },
  
  // License management
  generateLicense: async (schoolName: string, directorName: string): Promise<any> => {
    if (isElectron()) {
      return await window.electron!.generateLicense(schoolName, directorName);
    }
    
    // Web fallback using IndexedDB
    try {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let key = "";
      
      // Format: XXXX-XXXX-XXXX-XXXX
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (i < 3) key += "-";
      }
      
      // Create license object
      const license = {
        id: key,
        key,
        schoolName,
        directorName,
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        used: 0
      };
      
      // Store in IndexedDB
      const db = await initIndexedDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('licenses', 'readwrite');
        const store = transaction.objectStore('licenses');
        const request = store.add(license);
        
        request.onsuccess = () => resolve(license);
        request.onerror = () => {
          console.error('Error storing license:', request.error);
          
          // Fallback to localStorage
          const licenses = JSON.parse(localStorage.getItem("licenseKeys") || "[]");
          licenses.push(license);
          localStorage.setItem("licenseKeys", JSON.stringify(licenses));
          
          resolve(license);
        };
      });
    } catch (error) {
      console.error('Error generating license:', error);
      
      // Last resort fallback to localStorage
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let key = "";
      
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (i < 3) key += "-";
      }
      
      const license = {
        id: key,
        key,
        schoolName,
        directorName,
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        used: 0
      };
      
      const licenses = JSON.parse(localStorage.getItem("licenseKeys") || "[]");
      licenses.push(license);
      localStorage.setItem("licenseKeys", JSON.stringify(licenses));
      
      return license;
    }
  },
  
  getLicenseKeys: async (): Promise<any[]> => {
    if (isElectron()) {
      return await window.electron!.getLicenseKeys();
    }
    
    // Web fallback using IndexedDB
    try {
      const db = await initIndexedDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('licenses', 'readonly');
        const store = transaction.objectStore('licenses');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.error('Error getting licenses:', request.error);
          // Fallback to localStorage
          resolve(JSON.parse(localStorage.getItem("licenseKeys") || "[]"));
        };
      });
    } catch (error) {
      console.error('Error getting licenses:', error);
      // Last resort fallback to localStorage
      return JSON.parse(localStorage.getItem("licenseKeys") || "[]");
    }
  },
  
  activateLicense: async (licenseKey: string): Promise<{success: boolean, message: string, license?: any}> => {
    if (isElectron()) {
      return await window.electron!.activateLicense(licenseKey);
    }
    
    // Web fallback using IndexedDB
    try {
      const db = await initIndexedDB();
      
      // Get the license
      const license: any = await new Promise((resolve, reject) => {
        const transaction = db.transaction('licenses', 'readonly');
        const store = transaction.objectStore('licenses');
        const index = store.index('key');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const licenses = request.result;
          const foundLicense = licenses.find((l: any) => l.key === licenseKey && !l.used);
          resolve(foundLicense || null);
        };
        
        request.onerror = () => {
          console.error('Error getting license:', request.error);
          reject(request.error);
        };
      });
      
      if (!license) {
        // Try localStorage as fallback
        const localLicenses = JSON.parse(localStorage.getItem("licenseKeys") || "[]");
        const localLicense = localLicenses.find((l: any) => l.key === licenseKey && !l.used);
        
        if (localLicense) {
          // Mark as used
          localLicense.used = 1;
          localStorage.setItem("licenseKeys", JSON.stringify(localLicenses));
          
          // Save activation info
          localStorage.setItem("systemActivated", "true");
          localStorage.setItem("schoolName", localLicense.schoolName);
          localStorage.setItem("directorName", localLicense.directorName);
          localStorage.setItem("activationDate", new Date().toISOString());
          localStorage.setItem("expiryDate", localLicense.validUntil);
          
          return {
            success: true,
            message: `تم تنشيط النظام لـ ${localLicense.schoolName} بنجاح`,
            license: localLicense
          };
        }
        
        return {
          success: false,
          message: "مفتاح الترخيص غير صالح أو مستخدم بالفعل"
        };
      }
      
      // Mark license as used
      const updateTransaction = db.transaction('licenses', 'readwrite');
      const updateStore = updateTransaction.objectStore('licenses');
      license.used = 1;
      
      await new Promise((resolve, reject) => {
        const updateRequest = updateStore.put(license);
        updateRequest.onsuccess = () => resolve(true);
        updateRequest.onerror = () => reject(updateRequest.error);
      });
      
      // Update settings
      const settingsTransaction = db.transaction('settings', 'readwrite');
      const settingsStore = settingsTransaction.objectStore('settings');
      
      const settings = [
        { id: 'systemActivated', key: 'systemActivated', value: 'true' },
        { id: 'schoolName', key: 'schoolName', value: license.schoolName },
        { id: 'directorName', key: 'directorName', value: license.directorName },
        { id: 'activationDate', key: 'activationDate', value: new Date().toISOString() },
        { id: 'expiryDate', key: 'expiryDate', value: license.validUntil }
      ];
      
      for (const setting of settings) {
        await new Promise<void>((resolve, reject) => {
          const settingRequest = settingsStore.put(setting);
          settingRequest.onsuccess = () => resolve();
          settingRequest.onerror = () => {
            // Also update localStorage as fallback
            localStorage.setItem(setting.key, setting.value);
            resolve();
          };
        });
      }
      
      // Also update localStorage as backup
      localStorage.setItem("systemActivated", "true");
      localStorage.setItem("schoolName", license.schoolName);
      localStorage.setItem("directorName", license.directorName);
      localStorage.setItem("activationDate", new Date().toISOString());
      localStorage.setItem("expiryDate", license.validUntil);
      
      return {
        success: true,
        message: `تم تنشيط النظام لـ ${license.schoolName} بنجاح`,
        license
      };
    } catch (error) {
      console.error('Error activating license:', error);
      
      // Last resort fallback using localStorage
      const licenses = JSON.parse(localStorage.getItem("licenseKeys") || "[]");
      const license = licenses.find((l: any) => l.key === licenseKey && !l.used);
      
      if (!license) {
        return {
          success: false,
          message: "مفتاح الترخيص غير صالح أو مستخدم بالفعل"
        };
      }
      
      // Mark license as used
      license.used = 1;
      localStorage.setItem("licenseKeys", JSON.stringify(licenses));
      
      // Save activation info
      localStorage.setItem("systemActivated", "true");
      localStorage.setItem("schoolName", license.schoolName);
      localStorage.setItem("directorName", license.directorName);
      localStorage.setItem("activationDate", new Date().toISOString());
      localStorage.setItem("expiryDate", license.validUntil);
      
      return {
        success: true,
        message: `تم تنشيط النظام لـ ${license.schoolName} بنجاح`,
        license
      };
    }
  },
  
  // System settings
  getSystemSettings: async (): Promise<Record<string, string>> => {
    if (isElectron()) {
      return await window.electron!.getSystemSettings();
    }
    
    // Fallback to localStorage in web environment
    const settings: Record<string, string> = {};
    const keys = [
      "systemActivated", 
      "schoolName", 
      "directorName", 
      "activationDate", 
      "expiryDate"
    ];
    
    keys.forEach(key => {
      settings[key] = localStorage.getItem(key) || "";
    });
    
    return settings;
  },

  updateSystemSettings: async (settings: Record<string, string>): Promise<boolean> => {
    if (isElectron()) {
      return await window.electron!.updateSystemSettings(settings);
    }
    
    // Fallback to localStorage
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    return true;
  },
  
  // Backup and restore
  backupDatabase: async (): Promise<string> => {
    if (isElectron()) {
      return await window.electron!.backupDatabase();
    }
    // Simple export of localStorage in web environment
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return a.download;
  },
  
  restoreDatabase: async (backupPath: string): Promise<boolean> => {
    if (isElectron()) {
      return await window.electron!.restoreDatabase(backupPath);
    }
    // This would need file input handling in web environment
    return false;
  },
  
  // App information
  appInfo: {
    getVersion: async (): Promise<string> => {
      if (isElectron()) {
        return await window.electron!.appInfo.getVersion();
      }
      return '1.0.0';
    },
    
    getAppPath: async (): Promise<string> => {
      if (isElectron()) {
        return await window.electron!.appInfo.getAppPath();
      }
      return '';
    }
  }
};

export default electronService;
