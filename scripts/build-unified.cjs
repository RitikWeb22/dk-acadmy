const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('===> [1/3] Building React Frontend with Vite...');
execSync('npm --prefix frontend run build', { stdio: 'inherit' });

console.log('===> [2/3] Syncing Frontend Assets into Backend Public Directory...');
const distPath = path.resolve(__dirname, '..', 'frontend', 'dist');
const publicPath = path.resolve(__dirname, '..', 'backend', 'public');

if (fs.existsSync(distPath)) {
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
  }
  fs.cpSync(distPath, publicPath, { recursive: true });
  console.log(`Successfully copied ${distPath} -> ${publicPath}`);
} else {
  console.warn(`Warning: Frontend dist directory not found at ${distPath}`);
}

console.log('===> [3/3] Compiling TypeScript Backend...');
execSync('npm --prefix backend run build', { stdio: 'inherit' });

console.log('\n[SUCCESS] DK Academy Unified Build Complete! Run with: npm start');
