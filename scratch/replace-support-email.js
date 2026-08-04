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
      if (['.js', '.html', '.css', '.json', '.md', '.sql'].includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('supports@zavorafashion.com')) {
            console.log("Replacing in file:", fullPath);
            const updated = content.replaceAll('supports@zavorafashion.com', 'supports@zavorafashion.com');
            fs.writeFileSync(fullPath, updated, 'utf8');
          }
        } catch (e) {}
      }
    }
  }
}

console.log("Replacing supports@zavorafashion.com -> supports@zavorafashion.com...");
replaceInDir('c:\\Users\\tejsh\\Music\\all apps\\zavorafashion');
console.log("Done replacing support email across project!");
