
// Electron API interface definition
interface ElectronAPI {
  chooseDirectory: () => Promise<string | null>;
  db: {
    getAll: (table: string) => Promise<any[]>;
    getById: (table: string, id: string) => Promise<any>;
    insert: (table: string, data: any) => Promise<number>;
    update: (table: string, id: string, data: any) => Promise<number>;
    delete: (table: string, id: string) => Promise<number>;
  };
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
  
  // Backup and restore
  backupDatabase: async (): Promise<string> => {
    if (isElectron()) {
      return await window.electron!.backupDatabase();
    }
    // Simple export of localStorage in web environment
    const data = {};
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
