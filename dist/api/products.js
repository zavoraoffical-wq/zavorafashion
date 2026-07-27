'use strict';

const { ProductRepository } = require('../lib/local-product-engine');

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

function isRealStorefrontProduct(product = {}) {
  const text = `${product.name || ''} ${product.title || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase();
  const images = [
    product.img,
    product.image,
    product.thumbnail,
    product.hoverImage,
    ...(Array.isArray(product.images) ? product.images : [])
  ].filter(Boolean).join(' ').toLowerCase();
  const fakeName = /zavora\s+(women'?s|unisex)\s+(relaxed|baby rib|fleece|organic|high-waisted|tailored|staple|heavy blend|heavyweight vintage|luxury|crewneck|champion|embroidered|studio)|zavora\s+ultimate|zavora\s+recycled|zavora\s+classic/i;
  const fakeAsset = /zavora-(women|men|hero-clean|premium-hero)|studio-wide-trouser/i;
  return !fakeName.test(text) && !fakeAsset.test(images);
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
    const action = String(req.query.action || '').toLowerCase();
    if (action === 'delete') {
      parseBody(req);
      return json(res, 200, { ok: true, deleted: 0, note: 'Demo products are blocked from storefront output.' });
    }
    const body = parseBody(req);
    const products = Array.isArray(body.products) ? body.products : (body.product ? [body.product] : (body.id || body.printfulId ? [body] : []));
    if (['bulk_upsert', 'sync-cache', 'update', 'upsert', 'save'].includes(action) || products.length) {
      const clean = filterProducts(products).map((product) => ({
        ...product,
        status: product.status || (product.published === false ? 'draft' : 'active'),
        published: product.published !== false,
        updatedAt: new Date().toISOString()
      }));
      const db = await ProductRepository.bulkUpsert(clean);
      return json(res, 200, { ok: true, saved: clean.length, db, products: clean });
    }
    return json(res, 400, { ok: false, error: 'No valid products supplied.' });
  }

  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });

  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 24), 1), 60);
    const productId = String(req.query.id || req.query.productId || '').trim();

    if (productId) {
      const seed = REAL_PRINTFUL_IMPORTED_PRODUCTS.find((item) => String(item.id) === productId || String(item.printfulId) === productId);
      const saved = await ProductRepository.getProductById(productId).catch(() => null);
      const product = saved || seed;
      if (!product) return json(res, 404, { ok: false, error: 'Product not found' });
      return json(res, 200, { ok: true, provider: saved ? 'mongodb' : 'seed', product }, 120);
    }

    const requestedGender = String(req.query.gender || '').toLowerCase();
    const savedData = await ProductRepository.findProducts({ ...req.query, limit, page: req.query.page || 1 }).catch(() => ({ products: [], total: 0 }));
    let products = filterProducts([...REAL_PRINTFUL_IMPORTED_PRODUCTS, ...(savedData.products || [])]);
    const requestedCategory = String(req.query.category || '').toLowerCase();
    if (requestedGender === 'women' && (!requestedCategory || requestedCategory === 'all' || requestedCategory === 'oversized-tees' || requestedCategory === 'tees')) {
      products = products.filter(isTshirtProduct).map((product) => ({
        ...product,
        category: ['heavyweight-tees', 'baby-tees', 'polo-shirts', 'crop-tops'].includes(product.category) ? product.category : 'oversized-tees',
        categoryPath: product.categoryPath || 'Women > Oversized T-Shirts',
        gender: 'Women'
      }));
    }
    products = products.slice(0, limit);

    return json(res, 200, {
      ok: true,
      provider: 'printful-live',
      page: Number(req.query.page || 1),
      limit,
      total: products.length,
      totalPages: 1,
      count: products.length,
      products
    }, 120);
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message || 'Could not load products' });
  }
};
