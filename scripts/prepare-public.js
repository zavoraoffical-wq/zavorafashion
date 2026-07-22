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

function removeMetaByName(html, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`\\s*<meta\\s+[^>]*name=["']${escapedName}["'][^>]*>`, 'gi'), '');
}

function ensureHeadTag(html, tag) {
  if (!html.includes('</head>')) return html;
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function addBrandHeadTags() {
  const faviconTags = [
    '<link rel="icon" type="image/png" href="/assets/zavora-logo.png">',
    '<link rel="apple-touch-icon" href="/assets/zavora-logo.png">'
  ].join('\n    ');
  const analyticsScript = '<script defer src="/_vercel/insights/script.js"></script>';
  const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
  const googleVerificationTag = '<meta name="google-site-verification" content="4AjlsEXnNoFfemeS-JvQk7talZoGEnLllMa-zfCByb8" />';

  for (const file of walkHtmlFiles(target)) {
    let html = fs.readFileSync(file, 'utf8');
    html = removeMetaByName(html, 'viewport');
    html = removeMetaByName(html, 'google-site-verification');
    html = ensureHeadTag(html, viewportTag);
    html = ensureHeadTag(html, googleVerificationTag);
    if (!html.includes('rel="icon"') && html.includes('</head>')) {
      html = html.replace('</head>', `    ${faviconTags}\n  </head>`);
    }
    if (!html.includes('/_vercel/insights/script.js') && html.includes('</body>')) {
      html = html.replace('</body>', `  ${analyticsScript}\n</body>`);
    }
    fs.writeFileSync(file, html);
  }
}

function writeSeoFiles() {
  const baseUrl = 'https://www.zavorafashion.com';
  const pages = walkHtmlFiles(target)
    .map((file) => {
      const relative = path.relative(target, file).replace(/\\/g, '/');
      if (relative === 'index.html') return '/';
      return `/${relative}`;
    })
    .sort();

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...pages.map((page) => [
      '  <url>',
      `    <loc>${escapeXml(`${baseUrl}${page}`)}</loc>`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.8</priority>',
      '  </url>'
    ].join('\n')),
    '</urlset>',
    ''
  ].join('\n');

  const robots = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    ''
  ].join('\n');

  fs.writeFileSync(path.join(target, 'sitemap.xml'), sitemap);
  fs.writeFileSync(path.join(target, 'robots.txt'), robots);
}

if (!fs.existsSync(source)) {
  throw new Error('dist folder is missing');
}

fs.rmSync(target, { recursive: true, force: true });
copyDir(source, target);
addBrandHeadTags();
writeSeoFiles();
console.log('Copied dist to public for Vercel static output.');
