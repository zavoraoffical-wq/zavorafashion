let globalApiProductCache = null;
let globalApiProductCacheTime = 0;
'use strict';

const { ProductRepository } = require('../lib/local-product-engine');
const { requireAdminSession, validAdminSession } = require('../lib/admin-auth');

// Lazily load feed cache invalidator to avoid circular deps
function invalidateFeedCache() {
  try {
    const feed = require('./feed');
    if (typeof feed.invalidateFeedCache === 'function') feed.invalidateFeedCache();
  } catch (e) { /* feed module may not be loaded */ }
  // Also bust product API cache
  globalApiProductCache = null;
  globalApiProductCacheTime = 0;
}

function envValue(...names) {
  for (const name of names) {
    const value = String(process.env[name] || '').trim().replace(/^['"]|['"]$/g, '');
    if (value) return value;
  }
  return '';
}

function supabaseConfig() {
  const url = envValue('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
  const key = envValue('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ''), key };
}

function supabaseProductRow(product = {}) {
  const id = String(product.printfulId || product.id || product.sku || product.name || '').trim();
  return {
    printful_id: id,
    store_product_id: product.id ? String(product.id) : id,
    name: product.name || product.title || 'Zavora Product',
    gender: product.gender || 'Unisex',
    category: product.category || 'oversized-tees',
    category_path: product.categoryPath || product.category_path || '',
    product_type: product.productType || product.product_type || product.category || '',
    collection: Array.isArray(product.collection) ? product.collection : [product.collection || 'new'].filter(Boolean),
    color: product.color || (Array.isArray(product.colors) ? product.colors[0] : ''),
    colors: Array.isArray(product.colors) ? product.colors : [product.color || 'black'].filter(Boolean),
    sizes: Array.isArray(product.sizes) ? product.sizes : ['S', 'M', 'L', 'XL'],
    price: Number(product.price || 0),
    compare_at: Number(product.compareAt || product.compare_at || product.originalPrice || 0) || null,
    image: product.img || product.image || product.thumbnail || (Array.isArray(product.images) ? product.images[0] : ''),
    images: Array.isArray(product.images) ? product.images : [product.img || product.image].filter(Boolean),
    variant_groups: product.variantGroups || product.variant_groups || {},
    variants: product.variantOptions || product.variants || [],
    payload: {
      ...product,
      status: product.status || (product.published === false ? 'draft' : 'active'),
      published: product.published !== false
    },
    source: product.source || 'printful-import',
    updated_at: new Date().toISOString()
  };
}

function compactProductPayload(product = {}) {
  const images = Array.isArray(product.images)
    ? product.images.filter(Boolean).slice(0, 12)
    : [product.img || product.image || product.thumbnail].filter(Boolean);
  const rawVariants = Array.isArray(product.variantOptions || product.variants)
    ? (product.variantOptions || product.variants)
    : [];
  const variants = rawVariants.slice(0, 80).map((variant) => ({
    id: variant?.id || variant?.variant_id || variant?.catalog_variant_id || variant?.external_id || variant?.sku || '',
    sku: variant?.sku || variant?.external_id || variant?.variant_id || '',
    name: variant?.name || variant?.variantName || variant?.title || '',
    color: variant?.color || variant?.color_name || variant?.colorName || '',
    size: variant?.size || variant?.size_name || variant?.sizeName || '',
    price: Number(variant?.price || variant?.retail_price || product.price || 0),
    inStock: variant?.inStock ?? variant?.available ?? (variant?.availability_status !== 'discontinued')
  }));
  return {
    ...product,
    img: product.img || product.image || product.thumbnail || images[0] || '',
    image: product.image || product.img || product.thumbnail || images[0] || '',
    thumbnail: product.thumbnail || product.img || product.image || images[0] || '',
    images,
    galleryImages: Array.isArray(product.galleryImages) ? product.galleryImages.filter(Boolean).slice(0, 12) : undefined,
    mockupImages: Array.isArray(product.mockupImages) ? product.mockupImages.filter(Boolean).slice(0, 12) : undefined,
    variants,
    variantOptions: variants,
    printAreas: Array.isArray(product.printAreas) ? product.printAreas.slice(0, 20) : undefined,
    raw: undefined,
    payload: undefined,
    printful_detail: undefined,
    catalog_variants: undefined,
    sync_variants: undefined,
    catalogProduct: undefined,
    syncProduct: undefined,
    files: undefined
  };
}

function supabaseRowProduct(row = {}) {
  const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
  return {
    ...payload,
    id: payload.id || row.store_product_id || row.printful_id,
    printfulId: payload.printfulId || row.printful_id,
    name: payload.name || row.name,
    gender: payload.gender || row.gender,
    category: payload.category || row.category,
    categoryPath: payload.categoryPath || row.category_path,
    productType: payload.productType || row.product_type,
    collection: payload.collection || row.collection || [],
    color: payload.color || row.color,
    colors: payload.colors || row.colors || [],
    sizes: payload.sizes || row.sizes || [],
    price: payload.price ?? Number(row.price || 0),
    compareAt: payload.compareAt ?? Number(row.compare_at || 0),
    img: payload.img || row.image,
    image: payload.image || row.image,
    images: payload.images || row.images || [],
    variantGroups: payload.variantGroups || row.variant_groups || {},
    variantOptions: payload.variantOptions || row.variants || [],
    source: payload.source || row.source || 'supabase-products'
  };
}

async function saveProductsToSupabase(products = []) {
  const config = supabaseConfig();
  if (!config || !products.length) return { saved: false, provider: 'supabase', count: 0, reason: 'missing config or products' };
  const rows = products.map(supabaseProductRow).filter((row) => row.printful_id && row.name);
  if (!rows.length) return { saved: false, provider: 'supabase', count: 0, reason: 'no valid rows' };
  const response = await fetch(`${config.url}/rest/v1/products?on_conflict=printful_id`, {
    method: 'POST',
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(rows)
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase products upsert failed: ${response.status} ${text}`);
  let savedRows = [];
  try { savedRows = JSON.parse(text || '[]'); } catch (error) {}
  return { saved: true, provider: 'supabase', count: rows.length, rows: Array.isArray(savedRows) ? savedRows.length : 0 };
}

async function fetchProductsFromSupabase({ id = '', limit = 60 } = {}) {
  const config = supabaseConfig();
  if (!config) return [];
  const params = new URLSearchParams({
    select: '*',
    order: 'updated_at.desc',
    limit: String(limit)
  });
  if (id) params.set('or', `(printful_id.eq.${id},store_product_id.eq.${id})`);
  const response = await fetch(`${config.url}/rest/v1/products?${params.toString()}`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Accept: 'application/json'
    }
  });
  if (!response.ok) return [];
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows.map(supabaseRowProduct) : [];
}

function json(res, status, body, cacheSeconds = 0) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    cacheSeconds > 0
      ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=60`
      : 'no-store, max-age=0'
  );
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(String(req.body || '{}'));
  } catch (error) {
    return {};
  }
}

function productIsLive(product = {}) {
  const status = String(product.status || '').toLowerCase();
  if (product.published === false) return false;
  if (['draft', 'hidden', 'inactive', 'archived', 'blocked'].includes(status)) return false;
  return product.published === true || ['active', 'published', 'live'].includes(status);
}

function productMatchesGender(product = {}, requestedGender = '') {
  const requested = String(requestedGender || '').toLowerCase();
  if (!requested || requested === 'all') return true;
  const gender = String(product.gender || product.categoryPath || product.name || '').toLowerCase();
  if (requested === 'women') return /\bwomen\b|women's|ladies|female/.test(gender);
  if (requested === 'men') return /\bmen\b|men's|male/.test(gender) && !/\bwomen\b|women's|ladies|female/.test(gender);
  return gender === requested;
}

function productMatchesCategory(product = {}, requestedCategory = '') {
  const requested = String(requestedCategory || '').toLowerCase();
  if (!requested || requested === 'all') return true;
  const category = String(product.category || '').toLowerCase();
  if (requested === 'tees') return ['oversized-tees', 'heavyweight-tees', 'baby-tees', 'polo-shirts', 'crop-tops'].includes(category);
  return category === requested;
}

function isRealStorefrontProduct(product = {}) {
  if (!product || !product.name) return false;
  const text = `${product.name || ''} ${product.title || ''} ${product.description || ''}`.toLowerCase();
  const fakeText = /\b(demo|sample product|placeholder|lorem ipsum)\b/i;
  return !fakeText.test(text);
}

async function callPrintfulHandler(req, query) {
  const printfulHandler = require('./printful-products');
  let statusCode = 200;
  let body = '';
  const fakeReq = {
    ...req,
    method: 'GET',
    headers: req.headers || {},
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

function uniqueProducts(products = []) {
  const seen = new Set();
  return products.filter((product) => {
    const key = String(product?.id || product?.printfulId || product?.sku || product?.name || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function filterProducts(products = []) {
  return uniqueProducts(products).filter(isRealStorefrontProduct);
}

function isTshirtProduct(product = {}) {
  const text = `${product.name || ''} ${product.title || ''} ${product.description || ''} ${product.category || ''} ${product.productType || ''}`.toLowerCase();
  const category = String(product.category || '').toLowerCase();
  return ['oversized-tees', 'heavyweight-tees', 'baby-tees', 'tees', 'polo-shirts', 'crop-tops'].includes(category)
    || /(t-?shirt|tee|shirt|polo)/i.test(text);
}

const REAL_PRINTFUL_IMPORTED_PRODUCTS = [
  {
    id: 862,
    printfulId: 862,
    name: "Zavora Women's Heavyweight Boxy T-Shirt",
    category: 'oversized-tees',
    categoryPath: 'Women > Oversized T-Shirts',
    gender: 'Women',
    productType: 'T-Shirt',
    collection: ['streetwear', 'new', 'limited'],
    color: 'orchid',
    colors: ['orchid', 'black', 'white', 'pepper'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    basePrice: 58,
    includedShippingCost: 14.99,
    price: 94.89,
    compareAt: 167.88,
    sale: true,
    popularity: 95,
    badge: 'New',
    img: 'https://files.cdn.printful.com/products/862/22596_1743753167.jpg',
    alt: 'Comfort Colors 3023CL heavyweight boxy t-shirt from Printful',
    images: [
      'https://files.cdn.printful.com/products/862/22596_1743753167.jpg',
      'https://files.cdn.printful.com/products/862/22604_1743753168.jpg',
      'https://files.cdn.printful.com/products/862/22585_1769501205.jpg'
    ],
    stock: 5,
    sku: 'PF-862-3023CL-ORCHID-S',
    description: "Women's Heavyweight Boxy T-Shirt | Comfort Colors 3023CL imported from Printful.",
    source: 'printful-catalog',
    status: 'active',
    published: true
  }
];

module.exports = async function handler(req, res) {
  if (req.method === 'POST') {
    if (!requireAdminSession(req, res)) return;
    try {
      const action = String(req.query?.action || '').toLowerCase();
      if (action === 'delete') {
        const body = parseBody(req);
        const ids = Array.isArray(body.ids) ? body.ids : [body.id || body.printfulId].filter(Boolean);
        const result = ids.length ? await ProductRepository.deleteByIds(ids) : { deleted: 0 };
        invalidateFeedCache();
        return json(res, 200, { ok: true, deleted: result.deleted || 0, db: result });
      }
      const body = parseBody(req);
      if (['clear_all', 'delete_all', 'wipe'].includes(action)) {
        const confirm = String(body.confirm || body.confirmation || '').trim().toUpperCase();
        if (confirm !== 'DELETE_ALL_PRODUCTS') {
          return json(res, 400, {
            ok: false,
            error: 'Confirmation required',
            requiredConfirmation: 'DELETE_ALL_PRODUCTS'
          });
        }
        const result = await ProductRepository.deleteAllProducts();
        invalidateFeedCache();
        return json(res, 200, {
          ok: true,
          action,
          deleted: result.deleted || 0,
          db: result,
          cache: { invalidated: true },
          message: 'All product catalog records were deleted. Users, orders, and settings were not touched.'
        });
      }
      const products = Array.isArray(body.products) ? body.products : (body.product ? [body.product] : (body.id || body.printfulId ? [body] : []));
      if (['bulk_upsert', 'sync-cache', 'update', 'upsert', 'save'].includes(action) || products.length) {
        const clean = uniqueProducts(products).filter(Boolean).map(compactProductPayload).map((product) => {
          const isPublished = product.published === true
            || ['published', 'active', 'live'].includes(String(product.status || '').toLowerCase());
          return {
            ...product,
            printfulId: String(product.printfulId || product.id || product.sku || product.slug || product.name || '').trim(),
            status: isPublished ? 'published' : 'draft',
            published: isPublished,
            updatedAt: new Date().toISOString()
          };
        }).filter((product) => product.printfulId && (product.name || product.title));
        let mongo = { saved: false, provider: 'mongodb', count: 0 };
        try {
          mongo = await ProductRepository.bulkUpsert(clean);
        } catch (error) {
          mongo = { saved: false, provider: 'mongodb', count: 0, error: error.message };
        }
        let supabase = { saved: false, provider: 'supabase', count: 0 };
        try {
          supabase = await saveProductsToSupabase(clean);
        } catch (error) {
          supabase = { saved: false, provider: 'supabase', count: 0, error: error.message };
        }
        const mongoSaved = Boolean(mongo?.saved || mongo?.acknowledged || mongo?.count || mongo?.total || mongo?.upserted || mongo?.modified);
        const supabaseSaved = Boolean(supabase?.saved);
        const db = { mongo, supabase, saved: Boolean(mongoSaved || supabaseSaved), count: Math.max(Number(mongo?.count || mongo?.total || mongo?.upserted || 0), Number(supabase?.count || 0)) };
        if (!db.saved) {
          return json(res, 500, { ok: false, saved: 0, error: 'Database save failed. Product was not published because no persistent database accepted it.', db, products: clean });
        }
        invalidateFeedCache();
        return json(res, 200, { ok: true, saved: clean.length, db, products: clean });
      }
      return json(res, 400, { ok: false, error: 'No valid products supplied.' });
    } catch (error) {
      return json(res, 500, { ok: false, error: error.message || 'Product save crashed before completion.' });
    }
  }

  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });

  try {
    const action = String(req.query.action || '').toLowerCase();
    const wantsSummary = action === 'summary' || String(req.query.summary || '').toLowerCase() === 'true';
    if (wantsSummary) {
      const summary = await ProductRepository.countSummary();
      return json(res, 200, { ok: true, provider: summary.provider || 'mongodb', summary }, 0);
    }

    const isAdminListRequest = Boolean(validAdminSession(req)) || req.query.status === 'all';
    const maxLimit = isAdminListRequest ? 1000 : 60;
    const limit = Math.min(Math.max(Number(req.query.limit || 24), 1), maxLimit);
    const productId = String(req.query.id || req.query.productId || '').trim();

    if (productId) {
      const saved = await ProductRepository.getProductById(productId).catch(() => null);
      const supabaseProducts = [];
      const product = saved || supabaseProducts[0];
      if (!product) return json(res, 404, { ok: false, error: 'Product not found' });
      return json(res, 200, { ok: true, provider: saved ? 'mongodb' : 'supabase', product }, 120);
    }

    const requestedGender = String(req.query.gender || '').toLowerCase();
    const requestedStatus = String(req.query.status || '').toLowerCase();
    let savedData = null;
    if (globalApiProductCache && (Date.now() - globalApiProductCacheTime) < 120000 && !req.query.q && !req.query.search && !req.query.nocache) {
      savedData = globalApiProductCache;
    } else {
      savedData = await ProductRepository.findProducts({ ...req.query, limit: 100, page: 1 }).catch(() => ({ products: [], total: 0 }));
      if (savedData && Array.isArray(savedData.products) && savedData.products.length > 0) {
        globalApiProductCache = savedData;
        globalApiProductCacheTime = Date.now();
      }
    }
    const supabaseProducts = [];
    let products = filterProducts([...(savedData.products || []), ...supabaseProducts]);
    const requestedCategory = String(req.query.category || '').toLowerCase();
    products = products
      .filter((product) => requestedStatus === 'all' || productIsLive(product))
      .filter((product) => productMatchesGender(product, requestedGender))
      .filter((product) => productMatchesCategory(product, requestedCategory));
    

    const totalCount = Number(savedData?.total || products.length || 0);
    return json(res, 200, {
      ok: true,
      provider: 'mongodb',
      page: Number(req.query.page || 1),
      limit,
      total: totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / Math.max(limit, 1))),
      count: products.length,
      products
    }, 0);
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message || 'Could not load products' });
  }
};
