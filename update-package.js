
const fs = require('fs');
const path = require('path');

// Read the current package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add Electron configuration
packageJson.main = 'src/electronMain.js';
packageJson.scripts = {
  ...packageJson.scripts,
  "start": "vite",
  "build": "vite build",
  "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:8080 && electron .\"",
  "electron:build": "vite build && electron-builder",
  "postinstall": "electron-builder install-app-deps"
};

// Save the updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Updated package.json with Electron configuration');

// Instruction for next steps
console.log('\nTo complete Electron setup, install required dependencies:');
console.log('npm install --save-dev electron@latest electron-builder concurrently wait-on sqlite3');
console.log('\nCreate resources folder with app icons:');
console.log('mkdir -p resources');
console.log('\nThen run the Electron app in development:');
console.log('npm run electron:dev');
console.log('\nOr build the desktop app:');
console.log('npm run electron:build');
