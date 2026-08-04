const fs = require('fs');

// 1. Fix api/products.js ReferenceError: total is not defined
const apiPath = 'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\api\\products.js';
if (fs.existsSync(apiPath)) {
  let content = fs.readFileSync(apiPath, 'utf8');

  // Fix total reference
  content = content.replace(
    /totalPages: Math\.ceil\(total \/ limit\),/g,
    'totalPages: Math.max(1, Math.ceil((savedData?.total || products.length) / limit)),'
  );

  content = content.replace(
    /total,\s*totalPages:/g,
    'total: (savedData?.total || products.length),\n      totalPages:'
  );

  fs.writeFileSync(apiPath, content, 'utf8');
  console.log("Fixed api/products.js total ReferenceError");
}

// 2. Fix script.js Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')
const scriptFiles = [
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\dist\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\source-pages\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\dist\\script.js'
];

for (const sf of scriptFiles) {
  if (!fs.existsSync(sf)) continue;
  let content = fs.readFileSync(sf, 'utf8');

  content = content.replaceAll("$('#clearFilters').addEventListener", "$('#clearFilters')?.addEventListener");
  content = content.replaceAll("$('#loadMore').addEventListener", "$('#loadMore')?.addEventListener");
  content = content.replaceAll("$('[data-cart]').addEventListener", "$('[data-cart]')?.addEventListener");
  content = content.replaceAll("$('[data-close-cart]').addEventListener", "$('[data-close-cart]')?.addEventListener");
  content = content.replaceAll("$('[data-close-view]').addEventListener", "$('[data-close-view]')?.addEventListener");
  content = content.replaceAll("$('[data-recommend]').addEventListener", "$('[data-recommend]')?.addEventListener");
  content = content.replaceAll("$('#megaMenu').addEventListener", "$('#megaMenu')?.addEventListener");

  fs.writeFileSync(sf, content, 'utf8');
  console.log("Fixed null event listeners in:", sf);
}

console.log("Uncaught errors fix completed!");
