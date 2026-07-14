function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(body));
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_PRODUCTS_TABLE = process.env.SUPABASE_PRODUCTS_TABLE || process.env.PRODUCTS_TABLE || 'products';
const { db: mongoDb } = require('../lib/auth-lib');

const allowedCategories = new Set([
  'oversized-tees',
  'heavyweight-tees',
  'baby-tees',
  'tees',
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

const knownCollections = new Set([
  'sportswear',
  'streetwear',
  'beachwear',
  'gifts',
  'style-trends',
  'grow-a-fashion-brand',
  'made-in-eu',
  'halloween',
  'back-to-school',
  'holiday-season',
  'summer-hats-bags',
  'matching-sets',
  'summer-soccer-2026',
  'fourth-of-july',
  'new',
  'best',
  'limited',
  'essentials'
]);

function isAllowedProduct(product = {}) {
  const text = `${product.name || ''} ${product.productType || ''} ${product.category || ''}`.toLowerCase();
  const blocked = /(underwear|boxer|brief|trunk|thong|panties|bra|legging|bikini|sock|backpack|bag|tote|duffle|luggage|rug|ornament|poster|mug|canvas|sticker|phone|pillow|blanket|towel|apron|pet|case|sleeve|laptop|bottle|mouse pad|notebook|journal|stationery|tumbler|cup|drinkware|water bottle|card|postcard)/i;
  return allowedCategories.has(String(product.category || '').toLowerCase()) && !blocked.test(text);
}

function productMatches(product, query) {
  const gender = String(query.gender || '').toLowerCase();
  const category = String(query.category || '').toLowerCase();
  const collection = String(query.collection || '').toLowerCase();
  const search = String(query.q || query.search || '').toLowerCase();
  const productGender = String(product.gender || '').toLowerCase();
  const productCategory = String(product.category || '').toLowerCase();
  const collections = Array.isArray(product.collection) ? product.collection.map((item) => String(item).toLowerCase()) : [];
  const text = `${product.name || ''} ${product.category || ''} ${product.productType || ''} ${(product.colors || []).join(' ')} ${collections.join(' ')}`.toLowerCase();
  return isAllowedProduct(product)
    && (!gender || gender === 'all' || productGender === gender)
    && categoryMatches(productCategory, category)
    && (!collection || collection === 'all' || (knownCollections.has(collection) && collections.includes(collection)))
    && (!search || text.includes(search));
}

function categoryMatches(productCategory, requestedCategory) {
  const requested = String(requestedCategory || '').toLowerCase();
  const category = String(productCategory || '').toLowerCase();
  if (!requested || requested === 'all') return true;
  const groups = {
    'oversized-tees': ['oversized-tees'],
    'heavyweight-tees': ['heavyweight-tees'],
    'baby-tees': ['baby-tees'],
    tees: ['tees', 'oversized-tees', 'heavyweight-tees', 'baby-tees'],
    hoodies: ['hoodies'],
    'cropped-hoodies': ['cropped-hoodies'],
    'zip-hoodies': ['zip-hoodies'],
    sweatshirts: ['sweatshirts'],
    'cargo-pants': ['cargo-pants'],
    sweatpants: ['sweatpants'],
    joggers: ['sweatpants'],
    pants: ['cargo-pants', 'sweatpants'],
    shorts: ['shorts'],
    jackets: ['jackets'],
    outerwear: ['jackets'],
    accessories: ['accessories'],
    shoes: ['accessories']
  };
  return (groups[requested] || [requested]).includes(category);
}

function requestOrigin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.zavorafashion.com';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

async function loadPrintfulFallback(req, limit) {
  const requestedGender = String(req.query.gender || '').toLowerCase();
  const genders = requestedGender && requestedGender !== 'all' ? [requestedGender] : ['men', 'women'];
  const perGenderLimit = Math.max(12, Math.ceil(limit / genders.length));
  const batches = await Promise.all(genders.map(async (gender) => {
    const data = await callPrintfulHandler(req, {
      ...req.query,
      gender,
      limit: perGenderLimit,
      page: 1
    });
    return Array.isArray(data.products) ? data.products : [];
  }));
  return batches
    .flat()
    .filter((product, index, products) => products.findIndex((item) => String(item.id) === String(product.id)) === index)
    .filter((product) => productMatches(product, req.query))
    .slice(0, limit);
}

async function callPrintfulHandler(req, query) {
  const printfulHandler = require('./printful-products');
  let statusCode = 200;
  let body = '';
  const fakeReq = {
    ...req,
    method: 'GET',
    query
  };
  const fakeRes = {
    setHeader() {},
    get statusCode() {
      return statusCode;
    },
    set statusCode(value) {
      statusCode = value;
    },
    end(value) {
      body = value || '';
    }
  };
  await printfulHandler(fakeReq, fakeRes);
  if (statusCode >= 400) return {};
  try {
    return JSON.parse(body || '{}');
  } catch (error) {
    return {};
  }
}

module.exports = async function handler(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit || 1000), 1000);
    try {
      const database = await mongoDb();
      const products = await database.collection('products')
        .find({})
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray();
      const filtered = products
        .map((product) => product.payload || product)
        .filter(Boolean)
        .filter((product) => productMatches(product, req.query));
      if (filtered.length || !SUPABASE_URL || !SUPABASE_KEY) {
        return json(res, 200, {
          ok: true,
          provider: 'mongodb',
          count: filtered.length,
          products: filtered
        });
      }
    } catch (error) {
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        return json(res, 500, { ok: false, error: error.message || 'MongoDB env is missing' });
      }
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return json(res, 500, { ok: false, error: 'Product database env is missing' });
    }

    const base = SUPABASE_URL.replace(/\/$/, '');
    const table = SUPABASE_PRODUCTS_TABLE.replace(/^\/+|\/+$/g, '');
    const url = `${base}/rest/v1/${table}?select=payload,updated_at&order=updated_at.desc&limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: 'application/json'
      }
    });
    const rows = await response.json().catch(() => []);
    if (!response.ok) {
      const fallbackProducts = await loadPrintfulFallback(req, limit);
      if (fallbackProducts.length) {
        return json(res, 200, {
          ok: true,
          provider: 'printful-fallback',
          count: fallbackProducts.length,
          products: fallbackProducts,
          warning: rows?.message || 'Supabase products table unavailable'
        });
      }
      return json(res, response.status, { ok: false, error: rows?.message || 'Could not read Supabase products' });
    }
    const products = rows
      .map((row) => row.payload)
      .filter(Boolean)
      .filter((product) => productMatches(product, req.query));
    if (!products.length) {
      const fallbackProducts = await loadPrintfulFallback(req, limit);
      if (fallbackProducts.length) {
        return json(res, 200, {
          ok: true,
          provider: 'printful-fallback',
          count: fallbackProducts.length,
          products: fallbackProducts
        });
      }
    }
    return json(res, 200, {
      ok: true,
      provider: 'supabase',
      count: products.length,
      products
    });
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message || 'Could not load products' });
  }
};
