#!/usr/bin/env node
/**
 * سكريبت تشغيل Electron مباشرة
 * يقوم بتشغيل التطبيق في وضع الإنتاج أو التطوير
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';
const npx = isWin ? 'npx.cmd' : 'npx';

const isDev = process.argv.includes('--dev');
const distPath = path.join(__dirname, '..', 'dist');

console.log('🖥️ تشغيل تطبيق سطح المكتب...\n');

if (isDev) {
  // وضع التطوير: تشغيل الخادم ثم Electron
  startDevServer();
} else {
  // وضع الإنتاج: التأكد من وجود ملفات البناء
  if (!fs.existsSync(distPath) || !fs.existsSync(path.join(distPath, 'index.html'))) {
    console.log('📦 بناء التطبيق أولاً...');
    
    const build = spawn(npm, ['run', 'build'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    build.on('close', (code) => {
      if (code === 0) {
        startElectron();
      } else {
        console.error('❌ فشل في بناء التطبيق');
        process.exit(1);
      }
    });
  } else {
    startElectron();
  }
}

function startDevServer() {
  console.log('🔧 تشغيل خادم التطوير...');
  
  const devServer = spawn(npm, ['run', 'dev'], {
    stdio: 'pipe',
    cwd: path.join(__dirname, '..')
  });
  
  devServer.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    // انتظر حتى يبدأ الخادم
    if (output.includes('localhost:8080') || output.includes('Local:')) {
      setTimeout(() => {
        startElectron(true);
      }, 2000);
    }
  });
  
  devServer.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  devServer.on('close', (code) => {
    console.log('تم إغلاق خادم التطوير');
    process.exit(code);
  });
}

function startElectron(isDev = false) {
  console.log('🚀 تشغيل Electron...');
  
  const electronPath = path.join(__dirname, '..', 'node_modules', '.bin', isWin ? 'electron.cmd' : 'electron');
  const mainPath = path.join(__dirname, '..', 'src', 'electronMain.js');
  
  const env = { ...process.env };
  if (isDev) {
    env.NODE_ENV = 'development';
  }
  
  const electron = spawn(electronPath, [mainPath], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env
  });
  
  electron.on('close', (code) => {
    console.log('تم إغلاق التطبيق');
    process.exit(code);
  });
}
