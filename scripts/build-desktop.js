#!/usr/bin/env node
/**
 * سكريبت بناء تطبيق سطح المكتب
 * يقوم بـ:
 * 1. بناء ملفات الويب
 * 2. تجميع تطبيق Electron
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';
const npx = isWin ? 'npx.cmd' : 'npx';

console.log('🔨 بناء تطبيق سطح المكتب...\n');

// الخطوة 1: بناء ملفات الويب
console.log('📦 الخطوة 1: بناء ملفات الويب...');

const build = spawn(npm, ['run', 'build'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

build.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ فشل في بناء ملفات الويب');
    process.exit(1);
  }
  
  console.log('✅ تم بناء ملفات الويب\n');
  
  // الخطوة 2: إنشاء مجلد الموارد
  createResourcesFolder();
});

function createResourcesFolder() {
  const resourcesPath = path.join(__dirname, '..', 'resources');
  
  if (!fs.existsSync(resourcesPath)) {
    fs.mkdirSync(resourcesPath, { recursive: true });
  }
  
  // إنشاء أيقونة افتراضية إذا لم تكن موجودة
  const iconPath = path.join(resourcesPath, 'icon.png');
  if (!fs.existsSync(iconPath)) {
    console.log('⚠️ لم يتم العثور على أيقونة، سيتم استخدام الأيقونة الافتراضية');
  }
  
  // الخطوة 3: تجميع Electron
  buildElectron();
}

function buildElectron() {
  console.log('📦 الخطوة 2: تجميع تطبيق Electron...');
  
  const platform = process.argv[2] || (isWin ? 'win' : process.platform === 'darwin' ? 'mac' : 'linux');
  
  const electronBuilder = spawn(npx, ['electron-builder', '--' + platform], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  electronBuilder.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ فشل في تجميع تطبيق Electron');
      process.exit(1);
    }
    
    console.log('\n✅ تم بناء التطبيق بنجاح!');
    console.log('📁 الملفات الناتجة في مجلد: release/');
  });
}
