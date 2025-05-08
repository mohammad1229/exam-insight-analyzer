import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';

let mainWindow: BrowserWindow | null = null;
let appPath: string;
let db: sqlite3.Database;
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '..', 'resources', 'icon.png')
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  setupAppData();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Database and app data setup
function setupAppData() {
  const defaultPath = path.join(app.getPath('documents'), 'نظام تحليل الاختبارات');
  
  if (!fs.existsSync(defaultPath)) {
    fs.mkdirSync(defaultPath, { recursive: true });
  }
  
  appPath = defaultPath;
  setupDatabase();
}

function setupDatabase() {
  const dbPath = path.join(appPath, 'database.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database', err);
    } else {
      console.log('Database connected successfully');
      createTables();
    }
  });
}

function createTables() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      name TEXT
    )`);
    
    // Classes table
    db.run(`CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT
    )`);
    
    // Sections table
    db.run(`CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      classId TEXT,
      name TEXT,
      FOREIGN KEY (classId) REFERENCES classes(id)
    )`);
    
    // Students table
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT,
      classId TEXT,
      sectionId TEXT,
      FOREIGN KEY (classId) REFERENCES classes(id),
      FOREIGN KEY (sectionId) REFERENCES sections(id)
    )`);
    
    // Subjects table
    db.run(`CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT
    )`);
    
    // Teachers table
    db.run(`CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      name TEXT,
      username TEXT,
      password TEXT,
      subjects TEXT,
      assignedSubjects TEXT,
      assignedClasses TEXT
    )`);
    
    // Tests table
    db.run(`CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      classId TEXT,
      sectionId TEXT,
      subjectId TEXT,
      teacherId TEXT,
      date TEXT,
      notes TEXT,
      FOREIGN KEY (classId) REFERENCES classes(id),
      FOREIGN KEY (sectionId) REFERENCES sections(id),
      FOREIGN KEY (subjectId) REFERENCES subjects(id),
      FOREIGN KEY (teacherId) REFERENCES teachers(id)
    )`);
    
    // Questions table
    db.run(`CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      testId TEXT,
      type TEXT,
      maxScore INTEGER,
      FOREIGN KEY (testId) REFERENCES tests(id)
    )`);
    
    // Results table
    db.run(`CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      testId TEXT,
      studentId TEXT,
      isAbsent INTEGER,
      totalScore INTEGER,
      percentage INTEGER,
      FOREIGN KEY (testId) REFERENCES tests(id),
      FOREIGN KEY (studentId) REFERENCES students(id)
    )`);
    
    // Question scores table
    db.run(`CREATE TABLE IF NOT EXISTS questionScores (
      resultId TEXT,
      questionId TEXT,
      score INTEGER,
      PRIMARY KEY (resultId, questionId),
      FOREIGN KEY (resultId) REFERENCES results(id),
      FOREIGN KEY (questionId) REFERENCES questions(id)
    )`);
    
    // Licenses table
    db.run(`CREATE TABLE IF NOT EXISTS licenses (
      key TEXT PRIMARY KEY,
      schoolName TEXT,
      directorName TEXT,
      createdAt TEXT,
      validUntil TEXT,
      used INTEGER
    )`);
    
    // Settings table
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);
    
    // Add default admin user
    db.run(`INSERT OR IGNORE INTO users (username, password, role, name)
      VALUES ('mohammad', '12345', 'admin', 'مدير النظام')`);
    
    // Add default settings
    const defaultSettings = [
      { key: 'installDate', value: new Date().toISOString() },
      { key: 'systemActivated', value: 'false' },
      { key: 'schoolName', value: 'مدرسة النجاح الثانوية' },
      { key: 'academicYear', value: '2023-2024' }
    ];
    
    const settingsStmt = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
    defaultSettings.forEach(setting => {
      settingsStmt.run(setting.key, setting.value);
    });
    settingsStmt.finalize();
  });
}

// Handle directory selection
ipcMain.handle('choose-directory', async () => {
  if (!mainWindow) return null;
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'اختر مجلد لتخزين بيانات التطبيق'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const newPath = result.filePaths[0];
    appPath = newPath;
    return newPath;
  }
  
  return null;
});

// Database operations
ipcMain.handle('db-get-all', async (event, table) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${table}`, (err, rows) => {
      if (err) reject(err);
      else {
        // Parse JSON fields if they exist
        const parsedRows = rows.map((row: any) => {
          const newRow: any = { ...row };
          ['subjects', 'assignedSubjects', 'assignedClasses'].forEach(field => {
            if (newRow[field] && typeof newRow[field] === 'string') {
              try {
                newRow[field] = JSON.parse(newRow[field]);
              } catch (e) {
                // Keep as string if parsing fails
              }
            }
          });
          return newRow;
        });
        resolve(parsedRows);
      }
    });
  });
});

ipcMain.handle('db-get-by-id', async (event, table, id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${table} WHERE id = ?`, [id], (err, row: any) => {
      if (err) reject(err);
      else {
        // Parse JSON fields if they exist
        if (row) {
          ['subjects', 'assignedSubjects', 'assignedClasses'].forEach(field => {
            if (row[field] && typeof row[field] === 'string') {
              try {
                row[field] = JSON.parse(row[field]);
              } catch (e) {
                // Keep as string if parsing fails
              }
            }
          });
        }
        resolve(row);
      }
    });
  });
});

ipcMain.handle('db-insert', async (event, table, data) => {
  // Convert arrays to JSON strings
  const processedData = { ...data };
  Object.keys(processedData).forEach(key => {
    if (Array.isArray(processedData[key])) {
      processedData[key] = JSON.stringify(processedData[key]);
    }
  });
  
  const keys = Object.keys(processedData);
  const values = Object.values(processedData);
  const placeholders = keys.map(() => '?').join(',');
  
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`,
      values,
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
});

ipcMain.handle('db-update', async (event, table, id, data) => {
  // Convert arrays to JSON strings
  const processedData = { ...data };
  Object.keys(processedData).forEach(key => {
    if (Array.isArray(processedData[key])) {
      processedData[key] = JSON.stringify(processedData[key]);
    }
  });
  
  const keys = Object.keys(processedData);
  const values = Object.values(processedData);
  const setClause = keys.map(key => `${key} = ?`).join(',');
  
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE ${table} SET ${setClause} WHERE id = ?`,
      [...values, id],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
});

ipcMain.handle('db-delete', async (event, table, id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${table} WHERE id = ?`, [id], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
});

ipcMain.handle('db-query', async (event, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

// License management
ipcMain.handle('generate-license', async (event, schoolName, directorName) => {
  // Generate license key
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
  
  // Store in database
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO licenses (key, schoolName, directorName, createdAt, validUntil, used)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [license.key, license.schoolName, license.directorName, license.createdAt, license.validUntil, license.used],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(license);
        }
      }
    );
  });
});

ipcMain.handle('get-license-keys', async () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM licenses`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('activate-license', async (event, licenseKey) => {
  return new Promise((resolve, reject) => {
    // Find the license
    db.get(
      `SELECT * FROM licenses WHERE key = ? AND used = 0`,
      [licenseKey],
      (err, license) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!license) {
          resolve({
            success: false,
            message: "مفتاح الترخيص غير صالح أو مستخدم بالفعل"
          });
          return;
        }
        
        // Mark as used
        db.run(
          `UPDATE licenses SET used = 1 WHERE key = ?`,
          [licenseKey],
          (updateErr) => {
            if (updateErr) {
              reject(updateErr);
              return;
            }
            
            // Update system settings
            const settings = [
              { key: 'systemActivated', value: 'true' },
              { key: 'schoolName', value: license.schoolName },
              { key: 'directorName', value: license.directorName },
              { key: 'activationDate', value: new Date().toISOString() },
              { key: 'expiryDate', value: license.validUntil }
            ];
            
            const updateSettings = db.prepare(
              `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`
            );
            
            settings.forEach(setting => {
              updateSettings.run([setting.key, setting.value]);
            });
            
            updateSettings.finalize();
            
            resolve({
              success: true,
              message: `تم تنشيط النظام لـ ${license.schoolName} بنجاح`,
              license
            });
          }
        );
      }
    );
  });
});

// System settings
ipcMain.handle('get-system-settings', async () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT key, value FROM settings`, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      const settings: Record<string, string> = {};
      rows.forEach((row: any) => {
        settings[row.key] = row.value;
      });
      
      resolve(settings);
    });
  });
});

ipcMain.handle('update-system-settings', async (event, settings) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`
    );
    
    Object.entries(settings).forEach(([key, value]) => {
      stmt.run(key, value);
    });
    
    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
});

// Backup and restore
ipcMain.handle('backup-database', async () => {
  const backupPath = path.join(appPath, `backup-${Date.now()}.db`);
  return new Promise((resolve, reject) => {
    const backup = fs.createWriteStream(backupPath);
    const source = fs.createReadStream(path.join(appPath, 'database.db'));
    
    source.pipe(backup);
    source.on('end', () => resolve(backupPath));
    source.on('error', (err) => reject(err));
  });
});

ipcMain.handle('restore-database', async (event, backupPath) => {
  if (!fs.existsSync(backupPath)) {
    return Promise.reject(new Error('Backup file not found'));
  }
  
  const dbPath = path.join(appPath, 'database.db');
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      
      const backup = fs.createReadStream(backupPath);
      const current = fs.createWriteStream(dbPath);
      
      backup.pipe(current);
      current.on('finish', () => {
        // Reopen the database
        db = new sqlite3.Database(dbPath);
        resolve(true);
      });
      current.on('error', (err) => reject(err));
    });
  });
});

// App version and path info
ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => appPath);
