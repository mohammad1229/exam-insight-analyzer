
# تحويل تطبيق نظام تحليل نتائج الاختبارات المدرسية إلى تطبيق سطح المكتب

## نظرة عامة
هذا الملف يشرح خطوات تحويل تطبيق الويب إلى تطبيق سطح المكتب باستخدام تقنية Electron، مع القدرة على تخزين البيانات محلياً وإنشاء اختصار على سطح المكتب.

## المتطلبات الأساسية
1. تثبيت Node.js وNPM
2. تطبيق React الحالي (موجود بالفعل)
3. فهم أساسي لـ JavaScript/TypeScript

## خطوات التحويل

### 1. إضافة Electron إلى المشروع
```bash
npm install --save-dev electron electron-builder concurrently wait-on
```

### 2. إنشاء ملفات Electron الرئيسية

#### إنشاء main.js في مجلد electron
```javascript
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const sqlite3 = require('sqlite3').verbose();

// تعريف المتغيرات العامة
let mainWindow;
let appPath;
let db;

function createWindow() {
  // إنشاء نافذة التطبيق
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png')
  });

  // تحميل تطبيق الويب
  const startUrl = isDev
    ? 'http://localhost:8080'
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // فتح أدوات المطور في وضع التطوير
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// تهيئة التطبيق
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
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// إعداد مجلد البيانات وقاعدة البيانات
function setupAppData() {
  // اختيار مجلد التخزين الافتراضي
  const defaultPath = path.join(app.getPath('documents'), 'نظام تحليل الاختبارات');
  
  // إنشاء المجلد إذا لم يكن موجودًا
  if (!fs.existsSync(defaultPath)) {
    fs.mkdirSync(defaultPath, { recursive: true });
  }
  
  appPath = defaultPath;
  
  // إعداد قاعدة البيانات
  setupDatabase();
}

// إعداد قاعدة البيانات SQLite
function setupDatabase() {
  const dbPath = path.join(appPath, 'database.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('خطأ في فتح قاعدة البيانات', err);
    } else {
      console.log('تم الاتصال بقاعدة البيانات بنجاح');
      createTables();
    }
  });
}

// إنشاء جداول قاعدة البيانات
function createTables() {
  // إنشاء الجداول الأساسية
  db.serialize(() => {
    // جدول المستخدمين
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      name TEXT
    )`);
    
    // جدول الصفوف
    db.run(`CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT
    )`);
    
    // جدول الشعب
    db.run(`CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      classId TEXT,
      name TEXT,
      FOREIGN KEY (classId) REFERENCES classes(id)
    )`);
    
    // جدول الطلاب
    db.run(`CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT,
      classId TEXT,
      sectionId TEXT,
      FOREIGN KEY (classId) REFERENCES classes(id),
      FOREIGN KEY (sectionId) REFERENCES sections(id)
    )`);
    
    // جدول المواد
    db.run(`CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT
    )`);
    
    // جدول المعلمين
    db.run(`CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      name TEXT,
      subjectId TEXT,
      FOREIGN KEY (subjectId) REFERENCES subjects(id)
    )`);
    
    // جدول الاختبارات
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
    
    // جدول الأسئلة
    db.run(`CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      testId TEXT,
      type TEXT,
      maxScore INTEGER,
      FOREIGN KEY (testId) REFERENCES tests(id)
    )`);
    
    // جدول النتائج
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
    
    // جدول درجات الأسئلة
    db.run(`CREATE TABLE IF NOT EXISTS questionScores (
      resultId TEXT,
      questionId TEXT,
      score INTEGER,
      PRIMARY KEY (resultId, questionId),
      FOREIGN KEY (resultId) REFERENCES results(id),
      FOREIGN KEY (questionId) REFERENCES questions(id)
    )`);
    
    // جدول التراخيص
    db.run(`CREATE TABLE IF NOT EXISTS licenses (
      key TEXT PRIMARY KEY,
      schoolName TEXT,
      directorName TEXT,
      createdAt TEXT,
      validUntil TEXT,
      used INTEGER
    )`);
    
    // إدخال بيانات المستخدم الافتراضي
    db.run(`INSERT OR IGNORE INTO users (username, password, role, name)
      VALUES ('mohammad', '12345', 'admin', 'مدير النظام')`);
  });
}

// استقبال رسائل من تطبيق React
ipcMain.handle('choose-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'اختر مجلد لتخزين بيانات التطبيق'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const newPath = result.filePaths[0];
    // نقل الملفات الحالية إلى المجلد الجديد إذا لزم الأمر
    appPath = newPath;
    return newPath;
  }
  
  return null;
});

// وظائف قاعدة البيانات
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
```

#### إنشاء preload.js في مجلد electron
```javascript
const { contextBridge, ipcRenderer } = require('electron');

// تعريف واجهة API آمنة بين Electron وReact
contextBridge.exposeInMainWorld('electron', {
  // وظائف نظام الملفات
  chooseDirectory: () => ipcRenderer.invoke('choose-directory'),
  
  // وظائف قاعدة البيانات
  db: {
    getAll: (table) => ipcRenderer.invoke('db-get-all', table),
    getById: (table, id) => ipcRenderer.invoke('db-get-by-id', table, id),
    insert: (table, data) => ipcRenderer.invoke('db-insert', table, data),
    update: (table, id, data) => ipcRenderer.invoke('db-update', table, id, data),
    delete: (table, id) => ipcRenderer.invoke('db-delete', table, id),
  },
  
  // إعدادات التطبيق
  appInfo: {
    getVersion: () => ipcRenderer.invoke('get-version'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
  }
});
```

### 3. تعديل ملف package.json
أضف السطور التالية إلى ملف package.json:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "start": "vite",
    "electron:dev": "concurrently \"npm start\" \"wait-on http://localhost:8080 && electron .\"",
    "electron:build": "npm run build && electron-builder",
    "build": "vite build"
  },
  "build": {
    "appId": "com.schoolexams.app",
    "productName": "نظام تحليل نتائج الاختبارات المدرسية",
    "files": ["dist/**/*", "electron/**/*"],
    "directories": {
      "buildResources": "resources",
      "output": "release"
    },
    "win": {
      "target": ["nsis"],
      "icon": "resources/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "نظام تحليل نتائج الاختبارات المدرسية"
    }
  }
}
```

### 4. إنشاء ملفات الأيقونات
قم بإنشاء مجلد resources وضع فيه أيقونات التطبيق:
- icon.ico (لنظام Windows)
- icon.png (للواجهات العامة)
- icon.icns (لنظام macOS)

### 5. تكييف التطبيق للعمل مع قاعدة البيانات المحلية

#### إنشاء ملف src/services/electronService.ts
```typescript
// تكييف لاستخدام واجهة Electron API (إذا كانت متاحة)

interface ElectronAPI {
  chooseDirectory: () => Promise<string | null>;
  db: {
    getAll: (table: string) => Promise<any[]>;
    getById: (table: string, id: string) => Promise<any>;
    insert: (table: string, data: any) => Promise<number>;
    update: (table: string, id: string, data: any) => Promise<number>;
    delete: (table: string, id: string) => Promise<number>;
  };
  appInfo: {
    getVersion: () => Promise<string>;
    getAppPath: () => Promise<string>;
  };
}

// تعريف واجهة window المُوسعة
declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

// تحقق مما إذا كان التطبيق يعمل في بيئة Electron
export const isElectron = (): boolean => {
  return window.electron !== undefined;
};

// خدمة للوصول إلى وظائف Electron
const electronService = {
  // اختيار مجلد
  chooseDirectory: async (): Promise<string | null> => {
    if (isElectron()) {
      return await window.electron!.chooseDirectory();
    }
    return null;
  },
  
  // وظائف قاعدة البيانات
  db: {
    getAll: async (table: string): Promise<any[]> => {
      if (isElectron()) {
        return await window.electron!.db.getAll(table);
      }
      // استخدام localStorage كبديل في بيئة الويب
      return JSON.parse(localStorage.getItem(table) || '[]');
    },
    
    getById: async (table: string, id: string): Promise<any> => {
      if (isElectron()) {
        return await window.electron!.db.getById(table, id);
      }
      // استخدام localStorage كبديل في بيئة الويب
      const items = JSON.parse(localStorage.getItem(table) || '[]');
      return items.find((item: any) => item.id === id);
    },
    
    insert: async (table: string, data: any): Promise<number> => {
      if (isElectron()) {
        return await window.electron!.db.insert(table, data);
      }
      // استخدام localStorage كبديل في بيئة الويب
      const items = JSON.parse(localStorage.getItem(table) || '[]');
      items.push(data);
      localStorage.setItem(table, JSON.stringify(items));
      return 1;
    },
    
    update: async (table: string, id: string, data: any): Promise<number> => {
      if (isElectron()) {
        return await window.electron!.db.update(table, id, data);
      }
      // استخدام localStorage كبديل في بيئة الويب
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
      // استخدام localStorage كبديل في بيئة الويب
      const items = JSON.parse(localStorage.getItem(table) || '[]');
      const filteredItems = items.filter((item: any) => item.id !== id);
      localStorage.setItem(table, JSON.stringify(filteredItems));
      return items.length - filteredItems.length;
    }
  },
  
  // معلومات التطبيق
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
```

### 6. تعديل التطبيق لاستخدام قاعدة البيانات
يمكن تعديل خدمات البيانات الحالية في التطبيق لاستخدام electronService بدلاً من localStorage مباشرة.

### 7. بناء وتوزيع التطبيق

لبناء التطبيق:
```bash
npm run electron:build
```

سيتم إنشاء حزمة قابلة للتثبيت في مجلد release.

## الميزات الإضافية

### 1. نسخ احتياطي واستعادة البيانات
يمكن إضافة وظائف لنسخ قاعدة البيانات واستعادتها:

```javascript
// في main.js
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
        // إعادة فتح قاعدة البيانات
        db = new sqlite3.Database(dbPath);
        resolve(true);
      });
      current.on('error', (err) => reject(err));
    });
  });
});
```

### 2. تحديثات تلقائية
يمكن إضافة ميزة التحديث التلقائي باستخدام electron-updater.

## الخلاصة
باتباع هذه الخطوات، يمكن تحويل تطبيق الويب إلى تطبيق سطح مكتب كامل مع القدرة على تخزين البيانات محلياً في قاعدة بيانات SQLite، والقدرة على إنشاء اختصار على سطح المكتب، وتثبيت التطبيق مباشرة على جهاز المستخدم.
