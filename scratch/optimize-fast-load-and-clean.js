const fs = require('fs');
const path = require('path');

function replaceInDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.next') {
        replaceInDir(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.js', '.html'].includes(ext)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let modified = false;

        // Remove  button
        if (content.includes('')) {
          content = content.replaceAll('', '');
          content = content.replaceAll('', '');
          content = content.replaceAll('', '');
          modified = true;
        }

        // Remove ""
        if (content.includes('')) {
          content = content.replaceAll('', '');
          modified = true;
        }

        // Remove ""
        if (content.includes('')) {
          content = content.replaceAll('', '');
          modified = true;
        }

        // Remove ""
        if (content.includes('')) {
          content = content.replaceAll('', '');
          modified = true;
        }

        if (modified) {
          console.log("Updated file:", fullPath);
          fs.writeFileSync(fullPath, content, 'utf8');
        }
      }
    }
  }
}

console.log("Cleaning up loading texts and infinite load button...");
replaceInDir('c:\\Users\\tejsh\\Music\\all apps\\zavorafashion');
console.log("Cleanup completed!");
