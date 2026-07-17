const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'dist');
const target = path.join(root, 'public');

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (['api', 'lib', 'node_modules', '.git'].includes(entry.name)) continue;
    if (['package.json', 'package-lock.json', 'npm-shrinkwrap.json'].includes(entry.name)) continue;
    if (/\.(bat|cmd|ps1|env|map)$/i.test(entry.name)) continue;
    const sourcePath = path.join(from, entry.name);
    const targetPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function walkHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, files);
    } else if (entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

function addBrandHeadTags() {
  const faviconTags = [
    '<link rel="icon" type="image/png" href="/assets/zavora-logo.png">',
    '<link rel="apple-touch-icon" href="/assets/zavora-logo.png">'
  ].join('\n    ');
  const analyticsScript = '<script defer src="/_vercel/insights/script.js"></script>';

  for (const file of walkHtmlFiles(target)) {
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes('rel="icon"') && html.includes('</head>')) {
      html = html.replace('</head>', `    ${faviconTags}\n  </head>`);
    }
    if (!html.includes('/_vercel/insights/script.js') && html.includes('</body>')) {
      html = html.replace('</body>', `  ${analyticsScript}\n</body>`);
    }
    fs.writeFileSync(file, html);
  }
}

if (!fs.existsSync(source)) {
  throw new Error('dist folder is missing');
}

fs.rmSync(target, { recursive: true, force: true });
copyDir(source, target);
addBrandHeadTags();
console.log('Copied dist to public for Vercel static output.');
