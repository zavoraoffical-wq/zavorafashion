const fs = require('fs');

const scriptFiles = [
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\dist\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\source-pages\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\dist\\script.js'
];

for (const filePath of scriptFiles) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // Update initial state.printfulProducts to load from localStorage cache
  content = content.replace(
    /printfulProducts:\s*\[\]/,
    `printfulProducts: (function() { try { return JSON.parse(localStorage.getItem('zavora_cached_products') || '[]'); } catch(e) { return []; } })()`
  );

  // Update loadPrintfulProducts to fetch in 1 single fast call and update cache
  const oldLoadFn = /async function loadPrintfulProducts\(\) \{[\s\S]*?renderProducts\(\);\s*\}/;
  const newLoadFn = `async function loadPrintfulProducts() {
  if (state.printfulLoaded) return;
  state.printfulLoaded = true;

  try {
    const cached = JSON.parse(localStorage.getItem('zavora_cached_products') || '[]');
    if (cached && cached.length) {
      state.printfulProducts = cached;
      renderHomeProductSections();
      renderProducts();
    }
  } catch (e) {}

  try {
    const res = await fetch('/api/products?status=all&limit=100', {
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length) {
        state.printfulProducts = data.products;
        try { localStorage.setItem('zavora_cached_products', JSON.stringify(data.products)); } catch(e) {}
        renderHomeProductSections();
        renderProducts();
      }
    }
  } catch (error) {}
}`;

  if (oldLoadFn.test(content)) {
    content = content.replace(oldLoadFn, newLoadFn);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Applied instant cache to:", filePath);
  }
}

console.log("Instant cache setup completed!");
