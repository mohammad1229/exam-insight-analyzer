
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
  getSystemSettings: () => Promise<Record<string, string>>;
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
  }
}

// Check if running in Electron environment
export const isElectron = (): boolean => {
  return window.electron !== undefined;
};

// Service to access Electron features
const electronService = {
  // Directory selection
  chooseDirectory: async (): Promise<string | null> => {
    if (isElectron()) {
      return await window.electron!.chooseDirectory();
    }
    return null;
  },
  
  // Database operations
  db: {
    getAll: async (table: string): Promise<any[]> => {
      if (isElectron()) {
        return await window.electron!.db.getAll(table);
      }
      // Fallback to localStorage in web environment
      return JSON.parse(localStorage.getItem(table) || '[]');
    },
    
    getById: async (table: string, id: string): Promise<any> => {
      if (isElectron()) {
        return await window.electron!.db.getById(table, id);
      }
      // Fallback to localStorage in web environment
      const items = JSON.parse(localStorage.getItem(table) || '[]');
      return items.find((item: any) => item.id === id);
    },
    
    query: async (query: string, params: any[] = []): Promise<any[]> => {
      if (isElectron()) {
        return await window.electron!.db.query(query, params);
      }
      // No equivalent fallback in web environment
      console.warn('Custom queries not supported in web environment');
      return [];
    },
    
    insert: async (table: string, data: any): Promise<number> => {
      if (isElectron()) {
        return await window.electron!.db.insert(table, data);
      }
      // Fallback to localStorage in web environment
      const items = JSON.parse(localStorage.getItem(table) || '[]');
      items.push(data);
      localStorage.setItem(table, JSON.stringify(items));
      return 1;
    },
    
    update: async (table: string, id: string, data: any): Promise<number> => {
      if (isElectron()) {
        return await window.electron!.db.update(table, id, data);
      }
      // Fallback to localStorage in web environment
      const items = JSON.parse(localStorage.getItem(table) || '[]');
      const index = items.findIndex((item: any) => item.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...data };
        localStorage.setItem(table, JSON.stringify(items));
        return 1;
      }
      return 0;
    },
    
    delete: async (table: string, id: string): Promise<number> => {
      if (isElectron()) {
        return await window.electron!.db.delete(table, id);
      }
      // Fallback to localStorage in web environment
      const items = JSON.parse(localStorage.getItem(table) || '[]');
      const filteredItems = items.filter((item: any) => item.id !== id);
      localStorage.setItem(table, JSON.stringify(filteredItems));
      return items.length - filteredItems.length;
    }
  },
  
  // License management
  generateLicense: async (schoolName: string, directorName: string): Promise<any> => {
    if (isElectron()) {
      return await window.electron!.generateLicense(schoolName, directorName);
    }
    
    // Fallback to localStorage in web environment
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
      key,
      schoolName,
      directorName,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      used: 0
    };
    
    // Store in localStorage
    const licenses = JSON.parse(localStorage.getItem("licenseKeys") || "[]");
    licenses.push(license);
    localStorage.setItem("licenseKeys", JSON.stringify(licenses));
    
    return license;
  },
  
  activateLicense: async (licenseKey: string): Promise<{success: boolean, message: string, license?: any}> => {
    if (isElectron()) {
      return await window.electron!.activateLicense(licenseKey);
    }
    
    // Fallback to localStorage in web environment
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
