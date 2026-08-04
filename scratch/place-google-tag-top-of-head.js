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

// 1. Update prepare-public.js to place Google tag IMMEDIATELY after <head>
const preparePublicPath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\scripts\\prepare-public.js';
if (fs.existsSync(preparePublicPath)) {
  let content = fs.readFileSync(preparePublicPath, 'utf8');

  // Clean old injection logic
  content = content.replace(/if \(!html\.includes\('gtag\/js\?id=G-8YGED71VN8'\)[\s\S]*?\}\n/, '');

  // Add clean top of head injection in prepare-public.js
  const topHeadLogic = `    // Remove any existing Google Tag to avoid duplication
    html = html.replace(/\\s*<!-- Google tag \\(gtag\\.js\\) -->[\\s\\S]*?gtag\\('config', 'G-8YGED71VN8'\\);\\s*<\\/script>/gi, '');
    
    // Inject Google Tag IMMEDIATELY after <head>
    if (/<head\\b[^>]*>/i.test(html)) {
      html = html.replace(/(<head\\b[^>]*>)/i, \`$1\\n\${googleTagScript}\`);
    }`;

  if (!content.includes('Inject Google Tag IMMEDIATELY after <head>')) {
    content = content.replace('html = optimizeImageTags(html);', `html = optimizeImageTags(html);\n${topHeadLogic}`);
    fs.writeFileSync(preparePublicPath, content, 'utf8');
    console.log("Updated prepare-public.js for top-of-head Google Tag placement");
  }
}

// 2. Process all HTML files in dist, source-pages, and public
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
      
      // Remove any old occurrences
      html = html.replace(/\s*<!-- Google tag \(gtag\.js\) -->[\s\S]*?gtag\('config', 'G-8YGED71VN8'\);\s*<\/script>/gi, '');
      
      // Insert right after <head> or <head ...>
      if (/<head\b[^>]*>/i.test(html)) {
        html = html.replace(/(<head\b[^>]*>)/i, `$1\n${GOOGLE_TAG}`);
        fs.writeFileSync(full, html, 'utf8');
        console.log("Placed Google Tag at top of <head> in:", full);
      }
    }
  }
}

for (const dir of dirsToUpdate) {
  updateHtmlInDir(dir);
}

console.log("Placed Google Tag G-8YGED71VN8 at TOP OF <head> across all pages!");
