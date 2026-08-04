const fs = require('fs');
const path = require('path');

const BING_TAG = '<meta name="msvalidate.01" content="CC6B9BB912CA5CABD10A850C960AE1EC" />';

// 1. Update prepare-public.js
const preparePublicPath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\scripts\\prepare-public.js';
if (fs.existsSync(preparePublicPath)) {
  let content = fs.readFileSync(preparePublicPath, 'utf8');

  if (!content.includes('msvalidate.01')) {
    content = content.replace(
      "const googleVerificationTag = '<meta name=\"google-site-verification\" content=\"4AjlsEXnNoFfemeS-JvQk7talZoGEnLllMa-zfCByb8\" />';",
      `const googleVerificationTag = '<meta name="google-site-verification" content="4AjlsEXnNoFfemeS-JvQk7talZoGEnLllMa-zfCByb8" />';\n  const bingVerificationTag = '${BING_TAG}';`
    );

    content = content.replace(
      "html = removeMetaByName(html, 'google-site-verification');",
      `html = removeMetaByName(html, 'google-site-verification');\n    html = removeMetaByName(html, 'msvalidate.01');`
    );

    content = content.replace(
      "html = ensureHeadTag(html, googleVerificationTag);",
      `html = ensureHeadTag(html, googleVerificationTag);\n    html = ensureHeadTag(html, bingVerificationTag);`
    );

    fs.writeFileSync(preparePublicPath, content, 'utf8');
    console.log("Updated prepare-public.js with Bing Webmaster verification tag");
  }
}

// 2. Inject Bing Tag into all HTML files in dist, source-pages, and public
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
      if (!html.includes('msvalidate.01') && html.includes('</head>')) {
        html = html.replace('</head>', `    ${BING_TAG}\n  </head>`);
        fs.writeFileSync(full, html, 'utf8');
        console.log("Added Bing Verification to:", full);
      }
    }
  }
}

for (const dir of dirsToUpdate) {
  updateHtmlInDir(dir);
}

console.log("Bing Webmaster verification tag integration complete!");
