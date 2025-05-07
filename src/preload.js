
const { contextBridge, ipcRenderer } = require('electron');

// Expose APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // File system operations
  chooseDirectory: () => ipcRenderer.invoke('choose-directory'),
  
  // Database operations
  db: {
    getAll: (table) => ipcRenderer.invoke('db-get-all', table),
    getById: (table, id) => ipcRenderer.invoke('db-get-by-id', table, id),
    insert: (table, data) => ipcRenderer.invoke('db-insert', table, data),
    update: (table, id, data) => ipcRenderer.invoke('db-update', table, id, data),
    delete: (table, id) => ipcRenderer.invoke('db-delete', table, id),
  },
  
  // Backup and restore
  backupDatabase: () => ipcRenderer.invoke('backup-database'),
  restoreDatabase: (backupPath) => ipcRenderer.invoke('restore-database', backupPath),
  
  // App information
  appInfo: {
    getVersion: () => ipcRenderer.invoke('get-version'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
  }
});
