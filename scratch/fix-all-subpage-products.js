const fs = require('fs');

const pageScriptFiles = [
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\dist\\page-script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\page-script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\source-pages\\page-script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\dist\\page-script.js'
];

for (const filePath of pageScriptFiles) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix 1: Update isSafeProduct
  const oldSafeProduct = /function isSafeProduct\(p\) \{[\s\S]*?return !cat \|\| ALLOWED_CATS\.has\(cat\);\s*\}/;
  const newSafeProduct = `function isSafeProduct(p) {
  if (!p || !p.name) return false;
  const text = \`\${p.name} \${p.category || ''} \${p.productType || ''}\`;
  const images = [p.img, p.image, p.thumbnail, p.hoverImage, ...(Array.isArray(p.images) ? p.images : [])].filter(Boolean).join(' ');
  if (BLOCKED_PRODUCT_NAMES.test(text)) return false;
  if (BLOCKED_HOME_PRODUCT_NAMES.test(\`\${text} \${images}\`)) return false;
  return true;
}`;

  if (oldSafeProduct.test(content)) {
    content = content.replace(oldSafeProduct, newSafeProduct);
  }

  // Fix 2: Enable instant cache fallback in injectLargeCatalog
  content = content.replaceAll('if (false && !window.__zavoraCatalogProducts?.length)', 'if (!window.__zavoraCatalogProducts?.length)');

  // Fix 3: Read from zavora_cached_products in step 2 fallback
  content = content.replace(
    /let importedRaw = \[\];\s*let adminRaw = \[\];[\s\S]*?const cached = deduplicateProducts\(\[\.\.\.importedRaw, \.\.\.adminRaw\]\)/,
    `let cachedRaw = [];
      try { cachedRaw = JSON.parse(localStorage.getItem('zavora_cached_products') || '[]'); } catch(e) {}
      const cached = deduplicateProducts(cachedRaw)`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Updated catalog subpage loading in:", filePath);
}

console.log("Subpage products fix completed!");
