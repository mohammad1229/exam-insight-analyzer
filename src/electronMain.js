
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');

let mainWindow = null;
let appPath;
let db;
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
  // Default path in documents folder
  const defaultPath = path.join(app.getPath('documents'), 'نظام تحليل الاختبارات');
  
  // Use stored path if available
  const storedPath = app.getPath('userData');
  const configPath = path.join(storedPath, 'config.json');
  
  let finalPath = defaultPath;
  
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.dataPath && fs.existsSync(config.dataPath)) {
        finalPath = config.dataPath;
      }
    } catch (err) {
      console.error('Error reading config file:', err);
    }
  }
  
  if (!fs.existsSync(finalPath)) {
    fs.mkdirSync(finalPath, { recursive: true });
  }
  
  appPath = finalPath;
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
      username TEXT UNIQUE,
      password TEXT,
      subjectId TEXT,
      FOREIGN KEY (subjectId) REFERENCES subjects(id)
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
      used INTEGER DEFAULT 0
    )`);
    
    // System settings table
    db.run(`CREATE TABLE IF NOT EXISTS systemSettings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`);
    
    // Add default admin user if not exists
    db.get("SELECT * FROM users WHERE username = 'mohammad'", (err, row) => {
      if (err) {
        console.error(err);
        return;
      }
      
      if (!row) {
        db.run(`INSERT INTO users (username, password, role, name)
          VALUES ('mohammad', '12345', 'admin', 'مدير النظام')`);
      }
    });
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
    
    // Save the selected path to config
    const configPath = path.join(app.getPath('userData'), 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({ dataPath: newPath }));
    
    // Close current DB connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
      
      // Copy database to new location if it exists
      const currentDbPath = path.join(appPath, 'database.db');
      const newDbPath = path.join(newPath, 'database.db');
      
      if (fs.existsSync(currentDbPath) && appPath !== newPath) {
        fs.copyFileSync(currentDbPath, newDbPath);
      }
      
      // Update path and reopen database
      appPath = newPath;
      setupDatabase();
    });
    
    return newPath;
  }
  
  return null;
});

// Database operations
ipcMain.handle('db-get-all', async (event, table) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${table}`, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
});

ipcMain.handle('db-get-by-id', async (event, table, id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM ${table} WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
});

ipcMain.handle('db-query', async (event, query, params) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
});

ipcMain.handle('db-insert', async (event, table, data) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(',');
  
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`,
      values,
      function(err) {
        if (err) reject(err);
        resolve(this.lastID);
      }
    );
  });
});

ipcMain.handle('db-update', async (event, table, id, data) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map(key => `${key} = ?`).join(',');
  
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE ${table} SET ${setClause} WHERE id = ?`,
      [...values, id],
      function(err) {
        if (err) reject(err);
        resolve(this.changes);
      }
    );
  });
});

ipcMain.handle('db-delete', async (event, table, id) => {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM ${table} WHERE id = ?`, [id], function(err) {
      if (err) reject(err);
      resolve(this.changes);
    });
  });
});

// Generate license key
ipcMain.handle('generate-license', async (event, schoolName, directorName) => {
  // Generate random license key
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  
  // Format: XXXX-XXXX-XXXX-XXXX
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) key += "-";
  }
  
  // Current date and expiry (1 year)
  const createdAt = new Date().toISOString();
  const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  
  // Save to database
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO licenses (key, schoolName, directorName, createdAt, validUntil, used) 
      VALUES (?, ?, ?, ?, ?, 0)`,
      [key, schoolName, directorName, createdAt, validUntil],
      function(err) {
        if (err) reject(err);
        resolve({
          key,
          schoolName,
          directorName,
          createdAt,
          validUntil,
          used: 0
        });
      }
    );
  });
});

// Check and activate license
ipcMain.handle('activate-license', async (event, licenseKey) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM licenses WHERE key = ? AND used = 0`, [licenseKey], (err, license) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!license) {
        resolve({ success: false, message: "مفتاح الترخيص غير صالح أو مستخدم بالفعل" });
        return;
      }
      
      // Mark license as used
      db.run(`UPDATE licenses SET used = 1 WHERE key = ?`, [licenseKey], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        // Save activation info in system settings
        const settings = [
          { key: "systemActivated", value: "true" },
          { key: "schoolName", value: license.schoolName },
          { key: "directorName", value: license.directorName },
          { key: "activationDate", value: new Date().toISOString() },
          { key: "expiryDate", value: license.validUntil }
        ];
        
        let settingsProcessed = 0;
        
        settings.forEach(setting => {
          db.run(`INSERT OR REPLACE INTO systemSettings (key, value) VALUES (?, ?)`, 
            [setting.key, setting.value], 
            function(err) {
              if (err) {
                console.error(err);
              }
              
              settingsProcessed++;
              if (settingsProcessed === settings.length) {
                resolve({ 
                  success: true, 
                  message: `تم تنشيط النظام لـ ${license.schoolName} بنجاح`,
                  license
                });
              }
            }
          );
        });
      });
    });
  });
});

// Get system settings
ipcMain.handle('get-system-settings', async () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM systemSettings`, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      const settings = {};
      rows.forEach(row => {
        settings[row.key] = row.value;
      });
      
      resolve(settings);
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
