const fs = require('fs');
const path = require('path');

// Paths
const repoRoot = path.join(__dirname, '..');
const adminUploads = path.join(repoRoot, 'frontend', 'admin', 'public', 'uploads');
const centralUploads = path.join(repoRoot, 'uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Created:', dir);
  }
}

function copyFiles(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.warn('Source directory does not exist:', srcDir);
    return;
  }
  const files = fs.readdirSync(srcDir);
  if (!files.length) {
    console.log('No files to copy from', srcDir);
    return;
  }
  files.forEach(file => {
    const src = path.join(srcDir, file);
    const dest = path.join(destDir, file);
    if (fs.existsSync(dest)) {
      console.log('Skipping existing file:', file);
      return;
    }
    fs.copyFileSync(src, dest);
    console.log('Copied:', file);
  });
}

function main() {
  ensureDir(centralUploads);
  copyFiles(adminUploads, centralUploads);
  console.log('\nDone.\nCentral uploads folder:', centralUploads);
  console.log('You may remove the old admin uploads folder if you like.');
}

main();
