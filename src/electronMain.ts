
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
      used INTEGER
    )`);
    
    // Add default admin user
    db.run(`INSERT OR IGNORE INTO users (username, password, role, name)
      VALUES ('mohammad', '12345', 'admin', 'مدير النظام')`);
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
