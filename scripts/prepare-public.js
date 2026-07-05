const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'dist');
const target = path.join(root, 'public');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const sourcePath = path.join(from, entry.name);
    const targetPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

if (!fs.existsSync(source)) {
  throw new Error('dist folder is missing');
}

fs.rmSync(target, { recursive: true, force: true });
copyDir(source, target);
console.log('Copied dist to public for Vercel static output.');
