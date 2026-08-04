const fs = require('fs');

const FALLBACK_PRODUCTS = [
  {
    id: 862,
    printfulId: 862,
    name: "Zavora Women's Heavyweight Boxy T-Shirt",
    category: 'oversized-tees',
    gender: 'Women',
    price: 94.89,
    img: 'https://files.cdn.printful.com/products/862/22596_1743753167.jpg',
    collection: ['streetwear', 'new', 'limited']
  },
  {
    id: 828,
    printfulId: 828,
    name: "Zavora Women's Short Sleeve Pajama Top Short",
    category: 'oversized-tees',
    gender: 'Women',
    price: 119.3,
    img: 'https://files.cdn.printful.com/products/828/20974_1731507539.jpg',
    collection: ['women', 'new', 'streetwear']
  },
  {
    id: 604,
    printfulId: 604,
    name: "Zavora Women's Cotton Wide-Leg Pants",
    category: 'sweatpants',
    gender: 'Women',
    price: 124.99,
    img: 'https://files.cdn.printful.com/products/604/16723_1684323281.jpg',
    collection: ['women', 'best', 'streetwear']
  },
  {
    id: 489,
    printfulId: 489,
    name: "Zavora Men's Fleece Shorts Sweatshirt",
    category: 'shorts',
    gender: 'Men',
    price: 89.99,
    img: 'https://files.cdn.printful.com/products/489/13982_1648464971.jpg',
    collection: ['men', 'trending', 'streetwear']
  },
  {
    id: 512,
    printfulId: 512,
    name: "Zavora Men's Track Pants",
    category: 'cargo-pants',
    gender: 'Men',
    price: 114.99,
    img: 'https://files.cdn.printful.com/products/512/14589_1654321098.jpg',
    collection: ['men', 'best', 'streetwear']
  },
  {
    id: 720,
    printfulId: 720,
    name: "Zavora Unisex Organic Heavyweight Hoodie",
    category: 'hoodies',
    gender: 'Unisex',
    price: 139.99,
    img: 'https://files.cdn.printful.com/products/720/19823_1712398471.jpg',
    collection: ['new', 'best', 'streetwear']
  },
  {
    id: 640,
    printfulId: 640,
    name: "Zavora Heavyweight Unisex Crewneck Sweatshirt",
    category: 'sweatshirts',
    gender: 'Unisex',
    price: 108.99,
    img: 'https://files.cdn.printful.com/products/640/17492_1694382019.jpg',
    collection: ['trending', 'streetwear']
  },
  {
    id: 590,
    printfulId: 590,
    name: "Zavora Women's Cropped Hoodie",
    category: 'cropped-hoodies',
    gender: 'Women',
    price: 118.99,
    img: 'https://files.cdn.printful.com/products/590/16284_1678912304.jpg',
    collection: ['women', 'new', 'limited']
  }
];

const scriptFiles = [
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\github-deploy\\dist\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\source-pages\\script.js',
  'c:\\Users\\tejsh\\Music\\all apps\\zavorafashion\\dist\\script.js'
];

const fallbackJson = JSON.stringify(FALLBACK_PRODUCTS);

for (const sf of scriptFiles) {
  if (!fs.existsSync(sf)) continue;
  let content = fs.readFileSync(sf, 'utf8');

  content = content.replace(
    /printfulProducts:\s*\(function\(\)[\s\S]*?\}\)\(\)/,
    `printfulProducts: (function() { try { const c = JSON.parse(localStorage.getItem('zavora_cached_products') || '[]'); return c.length ? c : ${fallbackJson}; } catch(e) { return ${fallbackJson}; } })()`
  );

  fs.writeFileSync(sf, content, 'utf8');
  console.log("Embedded 0ms fallback products into:", sf);
}

console.log("0ms fallback catalog embedding complete!");
