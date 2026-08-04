const fs = require('fs');

const scriptFiles = [
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\dist\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\source-pages\\script.js',
];

// The old embedded fallback JSON is huge — we replace the entire printfulProducts initializer
// with a simple localStorage-only version (empty array if cache not present)
const OLD_INIT_REGEX = /printfulProducts:\s*\(function\(\)\s*\{[\s\S]*?\}\)\(\)/;
const NEW_INIT = `printfulProducts: (function() { try { return JSON.parse(localStorage.getItem('zavora_cached_products') || '[]'); } catch(e) { return []; } })()`;

// Fix broken image fallback - hide img instead of showing pants placeholder
const OLD_FALLBACK = `  image.src = 'assets/studio-wide-trouser.png';`;
const NEW_FALLBACK = `  image.style.display = 'none'; image.closest('.product-img-wrap, .product-figure, .card-media, .daily-feature-media') && (image.closest('.product-img-wrap, .product-figure, .card-media, .daily-feature-media').style.background = '#111');`;

let fixed = 0;
for (const sf of scriptFiles) {
  if (!fs.existsSync(sf)) { console.log("Not found:", sf); continue; }
  let content = fs.readFileSync(sf, 'utf8');

  if (OLD_INIT_REGEX.test(content)) {
    content = content.replace(OLD_INIT_REGEX, NEW_INIT);
    console.log("✅ Removed embedded fallback products from:", sf);
    fixed++;
  } else {
    console.log("⚠️  Pattern not found in:", sf);
  }

  if (content.includes(OLD_FALLBACK.trim())) {
    content = content.replace(OLD_FALLBACK, NEW_FALLBACK);
    console.log("✅ Fixed broken image fallback in:", sf);
  }

  fs.writeFileSync(sf, content, 'utf8');
}

console.log(`\nFixed ${fixed} files. Demo products removed!`);
