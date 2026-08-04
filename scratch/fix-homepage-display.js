const fs = require('fs');

// 1. Fix api/products.js
const apiPath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\api\\products.js';
if (fs.existsSync(apiPath)) {
  let content = fs.readFileSync(apiPath, 'utf8');

  // Fix isRealStorefrontProduct
  const oldRealStorefront = /function isRealStorefrontProduct\(product = \{\}\) \{[\s\S]*?return !fakeText\.test\(text\) && !fakeAsset\.test\(images\);\s*\}/;
  const newRealStorefront = `function isRealStorefrontProduct(product = {}) {
  if (!product || !product.name) return false;
  const text = \`\${product.name || ''} \${product.title || ''} \${product.description || ''}\`.toLowerCase();
  const fakeText = /\\b(demo|sample product|placeholder|lorem ipsum)\\b/i;
  return !fakeText.test(text);
}`;
  if (oldRealStorefront.test(content)) {
    content = content.replace(oldRealStorefront, newRealStorefront);
  }

  // Remove the lines 408-414 filtering women to tshirt only
  const oldWomenTshirtFilter = /if \(requestedGender === 'women' && \(!requestedCategory \|\| requestedCategory === 'all' \|\| requestedCategory === 'oversized-tees' \|\| requestedCategory === 'tees'\)\) \{[\s\S]*?\}\s*\}/;
  content = content.replace(oldWomenTshirtFilter, '');

  fs.writeFileSync(apiPath, content, 'utf8');
  console.log("Fixed api/products.js");
}

// 2. Fix script.js homeShelfDefinitions
const scriptFiles = [
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\dist\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\source-pages\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\dist\\script.js'
];

const newHomeShelfDefinitions = `const homeShelfDefinitions = [
  { title: 'New Arrivals', href: 'new-arrivals.html', match: (product, index) => index < 12 },
  { title: 'Trending Now', href: 'trending.html', match: (product, index) => index >= 4 && index < 16 },
  { title: 'Best Sellers', href: 'best-sellers.html', match: (product, index) => index >= 8 && index < 20 },
  { title: 'Premium Hoodies', href: 'shop.html?category=hoodies', match: (product) => ['hoodies', 'cropped-hoodies', 'zip-hoodies'].includes(product.category) || /hoodie/i.test(product.name || '') },
  { title: 'Premium Sweatshirts', href: 'shop.html?category=sweatshirts', match: (product) => product.category === 'sweatshirts' || /sweatshirt|crewneck/i.test(product.name || '') },
  { title: 'Luxury T-Shirts', href: 'shop.html?category=tees', match: (product) => ['tees', 'oversized-tees', 'heavyweight-tees', 'baby-tees'].includes(product.category) || /tee|t-shirt/i.test(product.name || '') },
  { title: 'Staff Picks', href: 'shop.html?sort=popular', match: (product, index) => index % 2 === 0 },
  { title: 'Recommended For You', href: 'recommended-products.html', match: (product, index) => index < 24 },
  { title: 'Recently Added', href: 'new-arrivals.html', match: (product, index) => index < 24 },
  { title: 'Under $100', href: 'shop.html?under=100', match: (product) => Number(product.price || 0) <= 100 }
];`;

for (const sf of scriptFiles) {
  if (!fs.existsSync(sf)) continue;
  let content = fs.readFileSync(sf, 'utf8');

  const oldShelfRegex = /const homeShelfDefinitions = \[[\s\S]*?\];/;
  if (oldShelfRegex.test(content)) {
    content = content.replace(oldShelfRegex, newHomeShelfDefinitions);
  }

  // Ensure renderHomeProductSections always fills container if products exist
  content = content.replace(
    /container\.innerHTML = shelves\.length \? shelves\.join\(''\) : '';/,
    `container.innerHTML = shelves.length ? shelves.join('') : (catalog.length ? '<div class="home-product-slider">' + catalog.slice(0, 12).map(productCard).join('') + '</div>' : '');`
  );

  fs.writeFileSync(sf, content, 'utf8');
  console.log("Fixed home shelves in:", sf);
}

console.log("Homepage products display fix complete!");
