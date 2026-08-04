const fs = require('fs');

const filesToFix = [
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\page-script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\source-pages\\page-script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\source-pages\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\dist\\page-script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\dist\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\dist\\page-script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\dist\\script.js'
];

for (const filePath of filesToFix) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix 1: Number(pageRemove.dataset.pageRemove) or Number(remove.dataset.remove)
  content = content.replace(
    /const id = Number\(pageRemove\.dataset\.pageRemove\);[\s\S]*?saveSavedCart\(nextCart\);/g,
    `const targetId = String(pageRemove.dataset.pageRemove || pageRemove.dataset.checkoutRemove || '').trim();
    const nextCart = getSavedCart().filter((item) => {
      const itemId = String(item.id || item.printfulId || item._id || '').trim();
      const itemName = String(item.name || '').trim();
      return itemId !== targetId && itemName !== targetId && String(item.id) !== targetId;
    });
    saveSavedCart(nextCart);`
  );

  content = content.replace(
    /state\.cart = state\.cart\.filter\(item => item\.id !== Number\(remove\.dataset\.remove\)\);/g,
    `const targetId = String(remove.dataset.remove || '').trim();
    state.cart = state.cart.filter(item => {
      const itemId = String(item.id || item.printfulId || item._id || '').trim();
      const itemName = String(item.name || '').trim();
      return itemId !== targetId && itemName !== targetId;
    });`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Fixed cart removal in:", filePath);
}

console.log("Cart removal fix completed successfully!");
