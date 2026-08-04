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

  const targetSnippet = `const realProducts = allProducts
      .filter((item) => String(item.id) !== String(current?.id))`;

  const replacementSnippet = `const currentGender = String(current?.gender || '').toLowerCase().trim();
    const isUnisexProduct = currentGender === 'unisex' || !currentGender;

    const realProducts = allProducts
      .filter((item) => {
        if (String(item.id) === String(current?.id)) return false;
        if (isUnisexProduct) return true;
        const itemGender = String(item.gender || '').toLowerCase().trim();
        if (!itemGender || itemGender === 'unisex') return true;
        if (currentGender.includes('women') || currentGender === 'w') {
          return itemGender.includes('women') || itemGender === 'w';
        }
        if (currentGender.includes('men') || currentGender === 'm') {
          return (itemGender.includes('men') || itemGender === 'm') && !itemGender.includes('women');
        }
        return true;
      })`;

  if (content.includes(targetSnippet)) {
    content = content.replace(targetSnippet, replacementSnippet);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Updated gender filter in:", filePath);
  }
}

console.log("Gender recommendation fix applied successfully!");
