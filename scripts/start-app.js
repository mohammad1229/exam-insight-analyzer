#!/usr/bin/env node
/**
 * سكريبت التشغيل التلقائي للتطبيق
 * يقوم بـ:
 * 1. بناء التطبيق
 * 2. تشغيل الخادم المحلي
 * 3. تشغيل Electron
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';

console.log('🚀 بدء تشغيل نظام تحليل نتائج الاختبارات...\n');

// التحقق من وجود node_modules
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 تثبيت المكتبات المطلوبة...');
  const install = spawn(npm, ['install'], { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  install.on('close', (code) => {
    if (code === 0) {
      startBuild();
    } else {
      console.error('❌ فشل في تثبيت المكتبات');
      process.exit(1);
    }
  });
} else {
  startBuild();
}

function startBuild() {
  console.log('🔨 بناء التطبيق...');
  
  const build = spawn(npm, ['run', 'build'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  build.on('close', (code) => {
    if (code === 0) {
      console.log('✅ تم بناء التطبيق بنجاح\n');
      startApp();
    } else {
      console.error('❌ فشل في بناء التطبيق');
      process.exit(1);
    }
  });
}

function startApp() {
  const args = process.argv.slice(2);
  
  if (args.includes('--electron') || args.includes('-e')) {
    startElectron();
  } else if (args.includes('--preview') || args.includes('-p')) {
    startPreview();
  } else if (args.includes('--dev') || args.includes('-d')) {
    startDev();
  } else {
    // افتراضي: تشغيل الويب
    startPreview();
  }
}

function startElectron() {
  console.log('🖥️ تشغيل تطبيق سطح المكتب...');
  
  const electron = spawn(npm, ['run', 'electron:start'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  electron.on('close', (code) => {
    console.log('تم إغلاق التطبيق');
    process.exit(code);
  });
}

function startPreview() {
  console.log('🌐 تشغيل خادم المعاينة...');
  
  const preview = spawn(npm, ['run', 'preview'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  preview.on('close', (code) => {
    console.log('تم إغلاق الخادم');
    process.exit(code);
  });
}

function startDev() {
  console.log('🔧 تشغيل وضع التطوير...');
  
  const dev = spawn(npm, ['run', 'dev'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  dev.on('close', (code) => {
    console.log('تم إغلاق خادم التطوير');
    process.exit(code);
  });
}
