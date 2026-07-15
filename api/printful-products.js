const PRINTFUL_API_BASE_URL = process.env.PRINTFUL_API_BASE_URL || 'https://api.printful.com';
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY
  || process.env.PRINTFUL_API_TOKEN
  || process.env.PRINTFUL_ACCESS_TOKEN
  || process.env.PRINTFUL_PRIVATE_TOKEN
  || process.env.PRINTFUL_TOKEN;
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID;
const INCLUDED_SHIPPING_COST = 14.99;
const SELLING_MARKUP = 1.3;
const COMPARE_AT_MARKUP = 2.3;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_PRODUCTS_TABLE = process.env.SUPABASE_PRODUCTS_TABLE || process.env.PRODUCTS_TABLE || 'products';
const { db: mongoDb } = require('../lib/auth-lib');

const categoryRules = [
  { match: /women|women's|ladies|female/i, gender: 'Women' },
  { match: /men|men's|male/i, gender: 'Men' },
  { match: /unisex/i, gender: 'Unisex' },
  { match: /zip hoodie|zip-up|full zip|zip/i, category: 'zip-hoodies', categoryPath: 'Men > Zip Hoodies', collection: 'streetwear', label: 'Zip Hoodie' },
  { match: /cropped hoodie|crop hoodie/i, category: 'cropped-hoodies', categoryPath: 'Women > Cropped Hoodies', collection: 'streetwear', label: 'Cropped Hoodie' },
  { match: /hoodie|pullover hoodie/i, category: 'hoodies', categoryPath: 'Men > Hoodies', collection: 'streetwear', label: 'Hoodie' },
  { match: /sweatshirt|crew neck|crewneck|fleece/i, category: 'sweatshirts', categoryPath: 'Men > Sweatshirts', collection: 'streetwear', label: 'Sweatshirt' },
  { match: /baby tee/i, category: 'baby-tees', categoryPath: 'Women > Baby Tees', collection: 'streetwear', label: 'Baby Tee' },
  { match: /heavyweight tee|heavyweight t-shirt|heavyweight shirt/i, category: 'heavyweight-tees', categoryPath: 'Men > Heavyweight T-Shirts', collection: 'streetwear', label: 'Heavyweight T-Shirt' },
  { match: /oversized tee|oversized t-shirt|oversize tee|oversize t-shirt/i, category: 'oversized-tees', categoryPath: 'Men > Oversized T-Shirts', collection: 'streetwear', label: 'Oversized T-Shirt' },
  { match: /t-shirt|tee|shirt|polo/i, category: 'oversized-tees', categoryPath: 'Men > Oversized T-Shirts', collection: 'streetwear', label: 'T-Shirt' },
  { match: /jacket|bomber|varsity|windbreaker|coat/i, category: 'jackets', categoryPath: 'Men > Jackets', collection: 'streetwear', label: 'Jacket' },
  { match: /cargo/i, category: 'cargo-pants', categoryPath: 'Men > Cargo Pants', collection: 'streetwear', label: 'Cargo Pant' },
  { match: /sweatpants|joggers|jogger/i, category: 'sweatpants', categoryPath: 'Men > Sweatpants', collection: 'streetwear', label: 'Sweatpant' },
  { match: /shorts|short/i, category: 'shorts', categoryPath: 'Men > Shorts', collection: 'beachwear', label: 'Short' },
  { match: /set|matching|tracksuit/i, category: 'matching-sets', categoryPath: 'Men > Matching Sets', collection: 'matching-sets', label: 'Matching Set' },
  { match: /sport|performance|athletic|training|gym|workout|active|jersey/i, category: 'sportswear', categoryPath: 'Men > Sportswear', collection: 'sportswear', label: 'Sportswear' },
  { match: /beach|swim|board short|boardshort|flip-flop|flip flop|slide/i, category: 'beachwear', categoryPath: 'Men > Beachwear', collection: 'beachwear', label: 'Beachwear' },
  { match: /shoe|sneaker/i, category: 'accessories', categoryPath: 'Men > Accessories', collection: 'streetwear', label: 'Footwear' },
  { match: /cap|hat|beanie/i, category: 'accessories', categoryPath: 'Men > Accessories', collection: 'streetwear', label: 'Accessory' }
];

const collectionRules = [
  { slug: 'sportswear', label: 'Sportswear', match: /sport|performance|athletic|training|gym|workout|active|jersey|soccer|basketball|tennis|golf|yoga|legging|running/i },
  { slug: 'streetwear', label: 'Streetwear', match: /street|hoodie|sweatshirt|tee|t-shirt|cargo|jogger|cap|hat|sneaker|oversized|heavyweight|beanie|fleece/i },
  { slug: 'beachwear', label: 'Beachwear', match: /beach|swim|board short|boardshort|flip-flop|flip flop|slide|short|summer|towel|sandal/i },
  { slug: 'gifts', label: 'Gifts', match: /gift|mug|tumbler|journal|notebook|poster|card|blanket|pillow|bag|tote|phone|case|sticker|hat|cap|beanie/i },
  { slug: 'style-trends', label: 'Style Trends', match: /trend|fashion|style|oversized|minimal|premium|crop|vintage|washed|acid|tie-dye|tie dye/i },
  { slug: 'grow-a-fashion-brand', label: 'Grow a Fashion Brand', match: /brand|label|sample|starter|basic|classic|premium|organic|eco|essential/i },
  { slug: 'made-in-eu', label: 'Made in EU', match: /eu|europe|made in eu|organic|eco|stanley|stella/i },
  { slug: 'halloween', label: 'Halloween', match: /halloween|skull|black|orange|costume|spooky|goth|dark/i },
  { slug: 'back-to-school', label: 'Back to School', match: /school|backpack|notebook|journal|tote|hoodie|tee|cap|sweatshirt/i },
  { slug: 'holiday-season', label: 'Holiday Season', match: /holiday|christmas|gift|winter|beanie|sweater|fleece|blanket|red|green/i },
  { slug: 'summer-hats-bags', label: 'Summer Hats & Bags', match: /hat|cap|bag|tote|bucket|summer|visor|beach/i },
  { slug: 'matching-sets', label: 'Matching Sets', match: /set|matching|tracksuit|sweatpants.*hoodie|hoodie.*sweatpants/i },
  { slug: 'summer-soccer-2026', label: 'Summer of Soccer 2026', match: /soccer|football|jersey|sport|performance|short|training/i },
  { slug: 'fourth-of-july', label: '4th of July', match: /4th|july|usa|america|american|red|blue|white|stars|stripe/i }
];

const allowedCatalogCategories = new Set([
  'oversized-tees',
  'heavyweight-tees',
  'baby-tees',
  'hoodies',
  'cropped-hoodies',
  'zip-hoodies',
  'sweatshirts',
  'jackets',
  'cargo-pants',
  'sweatpants',
  'shorts',
  'accessories',
  'shoes',
  'sportswear',
  'matching-sets',
  'beachwear'
]);

function response(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(body));
}

async function printfulFetch(path) {
  const separator = path.includes('?') ? '&' : '?';
  const scopedPath = PRINTFUL_STORE_ID ? `${path}${separator}store_id=${encodeURIComponent(PRINTFUL_STORE_ID)}` : path;
  const headers = {
    Authorization: `Bearer ${PRINTFUL_API_KEY}`,
    'Content-Type': 'application/json'
  };
  if (PRINTFUL_STORE_ID) {
    headers['X-PF-Store-Id'] = PRINTFUL_STORE_ID;
  }
  const result = await fetch(`${PRINTFUL_API_BASE_URL}${scopedPath}`, {
    headers
  });
  const body = await result.json().catch(() => ({}));
  if (!result.ok) {
    throw new Error(body?.error?.message || body?.message || `Printful request failed: ${result.status}`);
  }
  return body;
}

async function tryPrintfulFetch(paths) {
  const errors = [];
  for (const path of paths) {
    try {
      const body = await printfulFetch(path);
      return { body, path };
    } catch (error) {
      errors.push(`${path}: ${error.message}`);
    }
  }
  throw new Error(errors.join(' | '));
}

async function printfulCatalogFetch(path) {
  const headers = { 'Content-Type': 'application/json' };
  if (PRINTFUL_API_KEY) {
    headers.Authorization = `Bearer ${PRINTFUL_API_KEY}`;
  }
  const result = await fetch(`${PRINTFUL_API_BASE_URL}${path}`, {
    headers
  });
  const body = await result.json().catch(() => ({}));
  if (!result.ok) {
    throw new Error(body?.error?.message || body?.message || `Printful catalog request failed: ${result.status}`);
  }
  return body;
}

function supabaseProductRow(product) {
  return {
    printful_id: String(product.printfulId || product.id || product.name),
    store_product_id: product.id ? String(product.id) : null,
    name: product.name,
    gender: product.gender || 'Unisex',
    category: product.category || 'uncategorized',
    category_path: product.categoryPath || 'Uncategorized',
    product_type: product.productType || '',
    collection: product.collection || [],
    color: product.color || '',
    colors: product.colors || [],
    sizes: product.sizes || [],
    price: product.price || 0,
    compare_at: product.compareAt || null,
    image: product.img || product.image || null,
    images: product.images || [],
    variant_groups: product.variantGroups || {},
    variants: product.variantOptions || [],
    payload: product,
    source: 'printful',
    updated_at: new Date().toISOString()
  };
}

async function saveProductsToSupabase(products = []) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return {
      saved: false,
      provider: 'supabase',
      count: 0,
      reason: 'missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    };
  }
  if (!products.length) {
    return { saved: false, provider: 'supabase', count: 0 };
  }
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  const table = SUPABASE_PRODUCTS_TABLE.replace(/^\/+|\/+$/g, '');
  const result = await fetch(`${baseUrl}/rest/v1/${table}?on_conflict=printful_id`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(products.map(supabaseProductRow))
  });
  if (!result.ok) {
    const body = await result.text().catch(() => '');
    throw new Error(`Supabase save failed: ${result.status} ${body}`);
  }
  return {
    saved: true,
    provider: 'supabase',
    table,
    count: products.length
  };
}

function mongoProductRow(product) {
  const now = new Date();
  return {
    printfulId: String(product.printfulId || product.id || product.name),
    storeProductId: product.id ? String(product.id) : null,
    name: product.name,
    gender: product.gender || 'Unisex',
    category: product.category || 'uncategorized',
    categoryPath: product.categoryPath || 'Uncategorized',
    productType: product.productType || '',
    collection: product.collection || [],
    colors: product.colors || [],
    sizes: product.sizes || [],
    price: product.price || 0,
    compareAt: product.compareAt || null,
    image: product.img || product.image || null,
    images: product.images || [],
    variantGroups: product.variantGroups || {},
    variants: product.variantOptions || [],
    payload: product,
    source: 'printful-catalog',
    updatedAt: now,
    createdAt: now
  };
}

async function saveProductsToMongo(products = []) {
  if (!products.length) return { saved: false, provider: 'mongodb', count: 0 };
  const database = await mongoDb();
  const collection = database.collection('products');
  await collection.createIndex({ printfulId: 1 }, { unique: true });
  await collection.createIndex({ gender: 1, category: 1, updatedAt: -1 });
  await collection.createIndex({ collection: 1 });
  const operations = products.map((product) => {
    const row = mongoProductRow(product);
    const { createdAt, ...set } = row;
    return {
      updateOne: {
        filter: { printfulId: row.printfulId },
        update: { $set: set, $setOnInsert: { createdAt } },
        upsert: true
      }
    };
  });
  if (typeof collection.bulkWrite !== 'function') {
    let upserted = 0;
    let modified = 0;
    for (const operation of operations) {
      const update = operation.updateOne;
      const result = await collection.updateOne(update.filter, update.update, { upsert: update.upsert });
      if (result.upsertedId) upserted += 1;
      if (result.modifiedCount) modified += result.modifiedCount;
    }
    return {
      saved: true,
      provider: 'mongodb-adapter',
      count: products.length,
      upserted,
      modified
    };
  }
  const result = await collection.bulkWrite(operations, { ordered: false });
  return {
    saved: true,
    provider: 'mongodb',
    count: products.length,
    upserted: result.upsertedCount || 0,
    modified: result.modifiedCount || 0
  };
}

async function saveProducts(products = []) {
  const stores = [];
  try {
    stores.push(await saveProductsToMongo(products));
  } catch (error) {
    stores.push({ saved: false, provider: 'mongodb', count: 0, error: error.message || 'MongoDB save failed' });
  }
  try {
    stores.push(await saveProductsToSupabase(products));
  } catch (error) {
    stores.push({ saved: false, provider: 'supabase', count: 0, error: error.message || 'Supabase save failed' });
  }
  return {
    saved: stores.some((store) => store.saved),
    provider: stores.map((store) => store.provider).join('+'),
    count: Math.max(...stores.map((store) => store.count || 0), 0),
    stores
  };
}

function isMenCatalogProduct(product) {
  const text = `${product?.name || ''} ${product?.external_name || ''} ${product?.sync_product?.name || ''} ${product?.title || ''} ${product?.type_name || ''} ${product?.description || ''}`.toLowerCase();
  const allowed = /(hoodie|zip|quarter-zip|tee|t-shirt|shirt|polo|sweatshirt|pullover|fleece|jacket|windbreaker|coat|pants|sweatpants|jogger|cargo|shorts|board short|sport|performance|athletic|training|gym|active|set|matching|tracksuit|shoe|sneaker|flip-flop|flip flop|slide|cap|hat|beanie)/i.test(text);
  const blocked = /(underwear|boxer|brief|trunk|thong|panties|bra|legging|bikini|sock|backpack|bag|tote|duffle|luggage|tag|crop|headband|neck gaiter|rash guard|women|women's|kids|youth|baby|toddler|dress|skirt|rug|ornament|poster|mug|canvas|sticker|phone|pillow|blanket|towel|apron|pet|case|sleeve|laptop|bottle|mouse pad|notebook|journal|stationery|tumbler|cup|mug|straw|drinkware|water bottle|card|postcard|poster)/i.test(text);
  return allowed && !blocked && !product?.is_discontinued;
}

function isWomenCatalogProduct(product) {
  const text = `${product?.name || ''} ${product?.external_name || ''} ${product?.sync_product?.name || ''} ${product?.title || ''} ${product?.type_name || ''} ${product?.description || ''}`.toLowerCase();
  const allowed = /(women|women's|ladies|female|crop|cropped|baby tee|hoodie|zip|quarter-zip|tee|t-shirt|shirt|sweatshirt|pullover|fleece|sweatpants|jogger|shorts|sport|performance|athletic|training|gym|active|set|matching|tracksuit|beach|slide)/i.test(text);
  const blocked = /(men|men's|male|unisex|underwear|boxer|brief|trunk|thong|panties|bra|legging|bikini|sock|backpack|bag|tote|duffle|luggage|tag|headband|neck gaiter|rash guard|kids|youth|baby clothes|toddler|dress|skirt|rug|ornament|poster|mug|canvas|sticker|phone|pillow|blanket|towel|apron|pet|case|sleeve|laptop|bottle|mouse pad|notebook|journal|stationery|tumbler|cup|mug|straw|drinkware|water bottle|card|postcard|poster)/i.test(text);
  return allowed && !blocked && !product?.is_discontinued;
}

function catalogPredicate(gender) {
  return String(gender || '').toLowerCase() === 'women' ? isWomenCatalogProduct : isMenCatalogProduct;
}

function pickRule(name) {
  const rule = categoryRules.find((item) => item.category && item.match.test(name));
  return rule || { category: 'uncategorized', categoryPath: 'Uncategorized', collection: 'streetwear', label: 'Streetwear Essential' };
}

function detectGender(product, name) {
  const text = `${product?.gender || ''} ${product?.department || ''} ${product?.main_category || ''} ${product?.category || ''} ${product?.type_name || ''} ${name || ''}`;
  const explicit = categoryRules.find((rule) => rule.gender && rule.match.test(text));
  return explicit?.gender || 'Unisex';
}

function categoryMapping(product, name, requestedGender = '') {
  const metadata = `${product?.main_category || ''} ${product?.sub_category || ''} ${product?.type_name || ''} ${product?.category || ''}`;
  const rule = pickRule(`${metadata} ${name}`);
  const requested = String(requestedGender || '').toLowerCase();
  const gender = requested === 'women' ? 'Women' : requested === 'men' ? 'Men' : detectGender(product, name);
  let categoryPath = rule.categoryPath || 'Uncategorized';
  if (gender === 'Women') {
    categoryPath = categoryPath
      .replace(/^Men > Oversized T-Shirts$/, 'Women > Oversized T-Shirts')
      .replace(/^Men > Heavyweight T-Shirts$/, 'Women > Oversized T-Shirts')
      .replace(/^Men > Hoodies$/, 'Women > Hoodies')
      .replace(/^Men > Sweatshirts$/, 'Women > Sweatshirts')
      .replace(/^Men > Sweatpants$/, 'Women > Pants')
      .replace(/^Men > Cargo Pants$/, 'Women > Pants')
      .replace(/^Men > Shorts$/, 'Women > Pants')
      .replace(/^Men > Jackets$/, 'Women > Jackets')
      .replace(/^Men > Accessories$/, 'Women > Accessories');
  }
  return { ...rule, gender, categoryPath, productType: rule.label };
}

function collectionTags(product, rule, index) {
  const raw = `${product?.name || ''} ${product?.external_name || ''} ${product?.sync_product?.name || ''} ${product?.title || ''} ${product?.description || ''}`.toLowerCase();
  const tags = new Set([rule.collection, index < 6 ? 'new' : 'best']);
  collectionRules.forEach((collection) => {
    if (collection.match.test(raw)) tags.add(collection.slug);
  });
  if (index % 23 === 0) tags.add('limited');
  return [...tags].filter(Boolean);
}

function productMatchesCollection(product, collection) {
  const slug = String(collection || '').trim().toLowerCase();
  if (!slug || slug === 'all') return true;
  const rule = collectionRules.find((item) => item.slug === slug);
  if (!rule) return true;
  const text = `${product?.title || ''} ${product?.type_name || ''} ${product?.description || ''} ${product?.category || ''} ${product?.main_category || ''} ${product?.sub_category || ''}`.toLowerCase();
  return rule.match.test(text);
}

function productCopy(rule, name) {
  const label = String(rule.label || 'Streetwear Essential').toLowerCase();
  const category = String(rule.category || '');
  const materialMap = {
    'hoodies': 'Soft cotton-blend fleece with a brushed interior and structured everyday drape.',
    'cropped-hoodies': 'Premium cotton-blend fleece with a cropped streetwear proportion.',
    'zip-hoodies': 'Midweight fleece with a smooth zip front, ribbed trims, and a soft hand feel.',
    'sweatshirts': 'Cotton-rich fleece built for relaxed layering and clean daily wear.',
    'oversized-tees': 'Breathable cotton jersey with a soft touch and relaxed premium silhouette.',
    'heavyweight-tees': 'Heavyweight cotton jersey with a substantial hand feel and clean structure.',
    'baby-tees': 'Soft stretch jersey designed for a close, modern fit.',
    'jackets': 'Durable outerwear shell with clean finishing and street-ready layering.',
    'cargo-pants': 'Structured woven fabric with utility storage and easy everyday movement.',
    'sweatpants': 'Soft fleece knit with an adjustable waist and relaxed premium fit.',
    'shorts': 'Lightweight warm-weather fabric designed for movement and clean proportions.',
    'accessories': 'Premium accessory construction with a clean Zavora styling language.'
  };
  return {
    description: `${name} is a premium ${label} designed for Zavora Fashion's minimal streetwear wardrobe. It balances clean proportions, everyday comfort, and USA-ready fulfillment.`,
    material: materialMap[category] || 'Premium fabric selected for comfort, durability, and everyday luxury.',
    features: [
      'Premium streetwear fit',
      'Clean minimal Zavora styling',
      'Made on demand for lower waste',
      'Curated for USA customers'
    ],
    careInstructions: 'Machine wash cold, inside out. Use mild detergent. Tumble dry low or hang dry. Do not bleach. Cool iron only when needed.',
    sizeGuide: category === 'accessories' ? 'One-size accessory fit unless a size is shown.' : 'Choose your regular size for a relaxed fit. Size down for a cleaner fit or size up for oversized volume.',
    shipping: 'Free shipping is available at checkout. Standard and Express delivery options are shown before payment.',
    returnPolicy: 'Eligible unworn items may be returned according to the Zavora Fashion return policy.',
    printArea: 'Print and decoration areas follow official Printful catalog specifications for this product.',
    brandInfo: 'Zavora Fashion creates premium streetwear essentials for modern everyday luxury.'
  };
}

function seoName(rawName, index) {
  const clean = String(rawName || `Printful Product ${index + 1}`)
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*[^|]+$/g, '')
    .replace(/\b(all-over print|unisex|men'?s|adult|printful|dtg|dtfilm|adidas|a4|yupoong|gildan|bella canvas|bella \+ canvas|champion|hanes|jerzees|econscious|stanley\/stella)\b/gi, '')
    .replace(/\b[A-Z]{1,4}\d{2,5}[A-Z]?\b/g, '')
    .trim();
  const rule = pickRule(clean);
  const prefix = /zavora/i.test(clean) ? '' : 'Zavora ';
  const base = clean
    .replace(/\s{2,}/g, ' ')
    .replace(/^[-–| ]+|[-–| ]+$/g, '')
    || rule.label;
  if (/hoodie|tee|shirt|polo|pant|jogger|jacket|cap|hat|beanie/i.test(base)) return `${prefix}${base}`;
  return `${prefix}${base} ${rule.label}`;
}

function colorFromName(name) {
  const lower = String(name || '').toLowerCase();
  const has = (pattern) => new RegExp(`(^|[^a-z])(${pattern})([^a-z]|$)`, 'i').test(lower);
  if (has('black|jet black|true black')) return 'black';
  if (has('white|optic white|true white')) return 'white';
  if (has('gray|grey|heather gray|heather grey|sport gray|sport grey')) return 'gray';
  if (has('blue|navy|royal')) return 'blue';
  if (has('green|olive|forest')) return 'green';
  return '';
}

function colorFromExplicitValue(value) {
  const lower = String(value || '').toLowerCase().trim();
  if (!lower) return '';
  if (lower.includes('black')) return 'black';
  if (lower.includes('white') || lower.includes('natural')) return 'white';
  if (lower.includes('gray') || lower.includes('grey') || lower.includes('heather') || lower.includes('ash')) return 'gray';
  if (lower.includes('blue') || lower.includes('navy') || lower.includes('royal') || lower.includes('denim')) return 'blue';
  if (lower.includes('green') || lower.includes('olive') || lower.includes('forest')) return 'green';
  if (lower.includes('red') || lower.includes('scarlet') || lower.includes('burgundy') || lower.includes('maroon')) return 'red';
  if (lower.includes('pink') || lower.includes('rose')) return 'pink';
  if (lower.includes('purple') || lower.includes('violet') || lower.includes('lavender')) return 'purple';
  if (lower.includes('brown') || lower.includes('tan') || lower.includes('khaki') || lower.includes('sand') || lower.includes('beige') || lower.includes('cream')) return 'brown';
  if (lower.includes('gold') || lower.includes('yellow') || lower.includes('mustard')) return 'gold';
  const aliases = [
    ['black', /^(black|jet black|true black|black heather)$/],
    ['white', /^(white|optic white|true white|off white|natural)$/],
    ['gray', /^(gray|grey|heather gray|heather grey|sport gray|sport grey|ash)$/],
    ['blue', /^(blue|navy|royal|indigo|denim|light blue|dark blue)$/],
    ['green', /^(green|olive|forest|army|military green)$/],
    ['red', /^(red|scarlet|burgundy|maroon|cardinal)$/],
    ['pink', /^(pink|rose|light pink|hot pink)$/],
    ['purple', /^(purple|violet|lavender)$/],
    ['brown', /^(brown|tan|khaki|sand|beige|cream)$/],
    ['gold', /^(gold|yellow|mustard)$/]
  ];
  const match = aliases.find(([, pattern]) => pattern.test(lower));
  return match ? match[0] : '';
}

function colorFromVariant(variant, forceColor = '') {
  if (forceColor) return forceColor;
  const explicit = colorFromExplicitValue(variant?.color || variant?.color_name || variant?.colorName);
  if (explicit) return explicit;
  const text = `${variant?.name || ''} ${variant?.variant_name || ''}`;
  return colorFromName(text) || 'default';
}

function colorKey(color) {
  return String(color || 'default').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'default';
}

function colorLabel(color) {
  const key = colorKey(color);
  if (key === 'default') return 'Original';
  return key.split('-').map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(' ');
}

function colorsFromVariants(variants = [], fallbackText = '') {
  const colorOrder = ['black', 'white', 'gray', 'blue', 'green', 'red', 'pink', 'purple', 'brown', 'gold', 'default'];
  if (/all[- ]?over|aop/i.test(fallbackText)) return ['white'];
  const found = new Set();
  variants.forEach((variant) => {
    const color = colorFromVariant(variant);
    if (color) found.add(color);
  });
  if (!variants.length && fallbackText) {
    const color = colorFromName(fallbackText);
    if (color) found.add(color);
  }
  const ordered = colorOrder.filter((color) => found.has(color));
  const custom = [...found].filter((color) => !colorOrder.includes(color));
  const colors = [...ordered, ...custom];
  return colors.length && !(colors.length === 1 && colors[0] === 'default') ? colors : ['default'];
}

function basePriceFromProduct(product, index) {
  const raw = product?.retail_price || product?.price || product?.sync_variants?.[0]?.retail_price;
  const value = Number(raw);
  if (Number.isFinite(value) && value > 0) return Math.round(value);
  return 58 + (index % 8) * 14;
}

function priceWithIncludedShipping(product, index) {
  return basePriceFromProduct(product, index) + INCLUDED_SHIPPING_COST;
}

function roundedPrice(value) {
  return Math.round(value * 100) / 100;
}

function priceFromProduct(product, index) {
  return roundedPrice(priceWithIncludedShipping(product, index) * SELLING_MARKUP);
}

function compareAtFromProduct(product, index) {
  return roundedPrice(priceWithIncludedShipping(product, index) * COMPARE_AT_MARKUP);
}

function variantPools(product) {
  return [
    ...(product?.catalog_variants || []),
    ...(product?.sync_variants || []),
    ...(product?.variants || []),
    ...(product?.printful_detail?.catalog_variants || []),
    ...(product?.printful_detail?.sync_variants || []),
    ...(product?.printful_detail?.variants || [])
  ];
}

function productPools(product) {
  return [
    product,
    product?.product,
    product?.catalog_product,
    product?.sync_product,
    product?.printful_detail?.product,
    product?.printful_detail,
    product?.printful_detail?.catalog_product,
    product?.printful_detail?.sync_product
  ].filter(Boolean);
}

function fileUrl(file) {
  return file?.preview_url || file?.thumbnail_url || file?.url || file?.preview || file?.image_url || '';
}

function assetUrl(asset) {
  if (!asset) return '';
  if (typeof asset === 'string') return asset;
  return fileUrl(asset) || asset?.image || asset?.src || asset?.href || '';
}

function addUnique(list, url) {
  url = assetUrl(url);
  if (url && !list.includes(url)) list.push(url);
}

function productImageUrls(product) {
  const urls = [];
  productPools(product)
    .flatMap((item) => [
      item?.thumbnail_url,
      item?.image,
      item?.image_url,
      item?.mockup_url,
      item?.main_category_image,
      item?.variant_image,
      ...(item?.images || []),
      ...(item?.gallery || []),
      ...(item?.mockups || []),
      ...(item?.files || []).map(fileUrl)
    ])
    .forEach((url) => addUnique(urls, url));
  return urls;
}

function variantImages(variant) {
  const urls = [];
  [
    variant?.image_url,
    variant?.image,
    variant?.thumbnail_url,
    variant?.preview_url,
    variant?.variant_image,
    variant?.mockup_url,
    variant?.product?.image,
    ...(variant?.images || []),
    ...(variant?.gallery || []),
    ...(variant?.mockups || []),
    ...(variant?.files || []).map(fileUrl)
  ].forEach((url) => addUnique(urls, url));
  return urls;
}

function imagesFromProduct(product) {
  const urls = productImageUrls(product);
  variantPools(product).forEach((variant) => variantImages(variant).forEach((url) => addUnique(urls, url)));
  return urls;
}

function imageFromProduct(product) {
  return productImageUrls(product)[0]
    || variantPools(product).flatMap(variantImages)[0]
    || 'assets/studio-wide-trouser.png';
}

function variantImage(variant, fallback) {
  return variantImages(variant)[0] || fallback;
}

function variantOptionsFromVariants(variants = [], fallbackImage = '', forceColor = '') {
  const seen = new Set();
  const options = [];
  variants.forEach((variant, index) => {
    const color = colorFromVariant(variant, forceColor);
    const sizes = sizesFromVariants([variant]);
    const size = sizes[0] || 'M';
    const key = `${color}-${size}`;
    if (seen.has(key)) return;
    seen.add(key);
    const images = variantImages(variant);
    options.push({
      id: variant?.id || variant?.variant_id || index,
      name: variant?.name || variant?.variant_name || `Variant ${index + 1}`,
      color,
      colorKey: colorKey(color),
      colorLabel: colorLabel(color),
      size,
      images,
      image: images[0] || fallbackImage,
      stock: 5,
      sku: variant?.sku || variant?.external_id || ''
    });
  });
  return options;
}

function variantGroupsFromVariants(variants = [], productImages = [], forceColor = '') {
  const groups = {};
  variants.forEach((variant, index) => {
    const color = colorFromVariant(variant, forceColor);
    const key = colorKey(color);
    if (!groups[key]) {
      groups[key] = {
        color,
        key,
        label: colorLabel(color),
        images: [],
        sizes: [],
        variants: []
      };
    }
    const sizes = sizesFromVariants([variant]);
    const images = variantImages(variant);
    images.forEach((url) => addUnique(groups[key].images, url));
    sizes.forEach((size) => addUnique(groups[key].sizes, size));
    groups[key].variants.push({
      id: variant?.id || variant?.variant_id || index,
      name: variant?.name || variant?.variant_name || `Variant ${index + 1}`,
      size: sizes[0] || 'M',
      sku: variant?.sku || variant?.external_id || '',
      images,
      image: images[0] || ''
    });
  });
  const groupKeys = Object.keys(groups);
  if (groupKeys.length === 1 && productImages.length) {
    productImages.forEach((url) => addUnique(groups[groupKeys[0]].images, url));
  }
  if (!Object.keys(groups).length && productImages.length) {
    groups.default = { color: 'default', key: 'default', label: 'Original', images: productImages, sizes: [], variants: [] };
  }
  return groups;
}

function sizesFromVariants(variants = []) {
  const sizeOrder = ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'];
  const found = new Set();
  variants.forEach((variant) => {
    const explicit = String(variant?.size || variant?.size_name || variant?.sizeName || '').toUpperCase();
    if (explicit && sizeOrder.includes(explicit)) found.add(explicit);
    const text = `${variant?.name || ''} ${variant?.variant_name || ''}`;
    sizeOrder.forEach((size) => {
      if (new RegExp(`\\b${size}\\b`, 'i').test(text)) found.add(size);
    });
  });
  const sizes = sizeOrder.filter((size) => found.has(size));
  return sizes.length ? sizes : ['S', 'M', 'L', 'XL'];
}

async function enrichWithCatalogProduct(product) {
  const variantId = variantPools(product).find((variant) => variant?.variant_id || variant?.id)?.variant_id
    || variantPools(product).find((variant) => variant?.variant_id || variant?.id)?.id;
  if (!variantId) return product;

  try {
    const variantDetail = await printfulCatalogFetch(`/products/variant/${variantId}`);
    const variantResult = variantDetail?.result || {};
    const variant = variantResult?.variant || variantResult;
    const productId = variant?.product_id || variantResult?.product?.id || variantResult?.product_id;
    if (!productId) return product;

    const productDetail = await printfulCatalogFetch(`/products/${productId}`);
    const productResult = productDetail?.result || {};
    const catalogProduct = productResult?.product || productResult;
    const catalogVariants = Array.isArray(productResult?.variants) ? productResult.variants : [];
    if (!catalogVariants.length) return product;

    return {
      ...product,
      catalog_product: catalogProduct,
      catalog_variants: catalogVariants,
      catalog_variant: variant
    };
  } catch (error) {
    return product;
  }
}

function normalizeProduct(product, index, requestedGender = '') {
  const name = seoName(product?.name || product?.external_name || product?.sync_product?.name || product?.title, index);
  const rule = categoryMapping(product, name, requestedGender);
  const variants = variantPools(product);
  const rawName = `${product?.name || ''} ${product?.external_name || ''} ${product?.sync_product?.name || ''} ${product?.title || ''}`;
  const forceColor = /all[- ]?over|aop/i.test(rawName) ? 'white' : '';
  const colors = colorsFromVariants(variants, `${rawName} ${name} ${product?.description || ''}`);
  const image = imageFromProduct(product);
  const images = imagesFromProduct(product);
  const variantGroups = variantGroupsFromVariants(variants, productImageUrls(product), forceColor);
  const sizes = rule.category === 'accessories' ? ['M'] : sizesFromVariants(variants);
  const copy = productCopy(rule, name);
  return {
    id: Number(product?.id || product?.template_id || product?.sync_product?.id || Date.now() + index),
    printfulId: product?.id || product?.template_id || product?.sync_product?.id || null,
    name,
    category: rule.category,
    categoryPath: rule.categoryPath,
    gender: rule.gender,
    productType: rule.productType,
    collection: collectionTags(product, rule, index),
    color: colors[0] || 'default',
    colors,
    sizes,
    basePrice: basePriceFromProduct(product, index),
    includedShippingCost: INCLUDED_SHIPPING_COST,
    price: priceFromProduct(product, index),
    compareAt: compareAtFromProduct(product, index),
    sale: true,
    popularity: 90 - (index % 10),
    badge: index < 4 ? 'New' : rule.collection === 'limited' ? 'Limited' : 'Zavora',
    img: image,
    alt: image,
    images,
    variantGroups,
    stock: 5,
    variantOptions: variantOptionsFromVariants(variants, image, forceColor),
    description: copy.description,
    material: copy.material,
    features: copy.features,
    careInstructions: copy.careInstructions,
    sizeGuide: copy.sizeGuide,
    shipping: copy.shipping,
    returnPolicy: copy.returnPolicy,
    printArea: copy.printArea,
    brandInfo: copy.brandInfo,
    seoTitle: `${name} | Zavora Fashion Premium Streetwear`,
    seoDescription: `Shop ${name} from Zavora Fashion. Premium ${rule.gender.toLowerCase()} streetwear with clean fit, fast USA delivery, and luxury minimal styling.`
  };
}

function normalizeCatalogProduct(product, index, requestedGender = '') {
  const detail = product?.printful_detail || {};
  const detailProduct = detail?.product || product?.product || product?.catalog_product || product;
  const variants = Array.isArray(detail?.variants)
    ? detail.variants
    : (Array.isArray(product?.variants) ? product.variants : []);
  return normalizeProduct({
    ...product,
    ...detailProduct,
    id: detailProduct?.id || product?.id,
    name: detailProduct?.title || detailProduct?.type_name || product?.title || product?.type_name,
    title: detailProduct?.title || product?.title,
    image: detailProduct?.image || product?.image,
    price: detailProduct?.retail_price || product?.retail_price,
    description: detailProduct?.description || product?.description,
    catalog_product: detailProduct,
    catalog_variants: variants,
    variants,
    printful_detail: detail
  }, index, requestedGender);
}

async function fetchCatalogProducts({ gender, limit, offset, query, collection }) {
  const catalog = await printfulCatalogFetch('/products');
  const rows = Array.isArray(catalog.result) ? catalog.result : [];
  const search = String(query || '').trim().toLowerCase();
  const filtered = rows
    .filter(catalogPredicate(gender))
    .filter((product) => productMatchesCollection(product, collection))
    .filter((product) => {
      if (!search) return true;
      const text = `${product?.title || ''} ${product?.type_name || ''} ${product?.description || ''}`.toLowerCase();
      return text.includes(search);
    });
  const pageRows = filtered.slice(offset, offset + limit);
  const detailed = await Promise.all(pageRows.map(async (product, index) => {
    try {
      const productId = product?.id || product?.product_id;
      if (!productId) return normalizeCatalogProduct(product, index, gender);
      const detail = await printfulCatalogFetch(`/products/${productId}`);
      return normalizeCatalogProduct({
        ...product,
        printful_detail: detail.result || {},
        catalog_product: detail.result?.product || product,
        catalog_variants: detail.result?.variants || []
      }, index, gender);
    } catch (error) {
      return normalizeCatalogProduct(product, index, gender);
    }
  }));
  return {
    source: `printful-catalog:${gender}${collection ? `:${collection}` : ''}`,
    total: filtered.length,
    products: detailed.filter((product) => allowedCatalogCategories.has(product.category))
  };
}

module.exports = async function handler(req, res) {
  if (!PRINTFUL_API_KEY) {
    return response(res, 500, { ok: false, error: 'PRINTFUL_API_KEY is missing in Vercel environment variables.' });
  }

  try {
    const gender = String(req.query.gender || 'men').toLowerCase();
    const limit = Math.min(Number(req.query.limit || 23), 60);
    const page = Math.max(Number(req.query.page || 1), 1);
    const collection = String(req.query.collection || '').toLowerCase();
    const offset = (page - 1) * limit;
    const catalogImport = await fetchCatalogProducts({
      gender,
      limit,
      offset,
      query: req.query.q || req.query.search || '',
      collection
    });
    const products = catalogImport.products;
    const source = catalogImport.source;
    let db = {
      saved: false,
      provider: 'mongodb+supabase',
      count: 0,
      reason: 'not requested'
    };
    if (String(req.query.save || 'true') !== 'false') {
      try {
        db = await saveProducts(products);
      } catch (error) {
        db = {
          saved: false,
          provider: 'mongodb+supabase',
          count: 0,
          error: error.message || 'Unable to save Printful products.'
        };
      }
    }
    response(res, 200, { ok: true, source, page, limit, total: catalogImport.total, count: products.length, db, products });
  } catch (error) {
    response(res, 500, { ok: false, error: error.message || 'Unable to import Printful products.' });
  }
};
