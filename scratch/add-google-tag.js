const fs = require('fs');
const path = require('path');

const GOOGLE_TAG = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-8YGED71VN8"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-8YGED71VN8');
</script>`;

// 1. Update vercel.json CSP
const vercelJsonPath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\vercel.json';
if (fs.existsSync(vercelJsonPath)) {
  let content = fs.readFileSync(vercelJsonPath, 'utf8');

  // Update script-src
  content = content.replace(
    /script-src 'self' 'unsafe-inline'/g,
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com"
  );

  // Update connect-src
  content = content.replace(
    /connect-src 'self'/g,
    "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://stats.g.doubleclick.net https://www.googletagmanager.com"
  );

  fs.writeFileSync(vercelJsonPath, content, 'utf8');
  console.log("Updated vercel.json Content-Security-Policy for Google Tag");
}

// 2. Update prepare-public.js so it injects Google tag into every page during build
const preparePublicPath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\scripts\\prepare-public.js';
if (fs.existsSync(preparePublicPath)) {
  let content = fs.readFileSync(preparePublicPath, 'utf8');

  if (!content.includes('G-8YGED71VN8')) {
    const googleTagCode = `  const googleTagScript = \`<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-8YGED71VN8"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-8YGED71VN8');
</script>\`;`;

    content = content.replace('function addBrandHeadTags() {', `function addBrandHeadTags() {\n${googleTagCode}`);
    
    content = content.replace(
      'if (!html.includes(\'rel="icon"\') && html.includes(\'</head>\')) {',
      `if (!html.includes('gtag/js?id=G-8YGED71VN8') && html.includes('</head>')) {\n      html = html.replace('</head>', \`    \${googleTagScript}\\n  </head>\`);\n    }\n    if (!html.includes('rel="icon"') && html.includes('</head>')) {`
    );

    fs.writeFileSync(preparePublicPath, content, 'utf8');
    console.log("Updated prepare-public.js to auto-inject Google Tag into every page");
  }
}

// 3. Inject Google Tag into all HTML files in dist, source-pages, and public
const dirsToUpdate = [
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\dist',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\public',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\dist',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\source-pages'
];

function updateHtmlInDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      updateHtmlInDir(full);
    } else if (f.endsWith('.html')) {
      let html = fs.readFileSync(full, 'utf8');
      if (!html.includes('G-8YGED71VN8') && html.includes('</head>')) {
        html = html.replace('</head>', `  ${GOOGLE_TAG}\n</head>`);
        fs.writeFileSync(full, html, 'utf8');
        console.log("Added Google Tag to:", full);
      }
    }
  }
}

for (const dir of dirsToUpdate) {
  updateHtmlInDir(dir);
}

console.log("Google Tag G-8YGED71VN8 integration complete!");
