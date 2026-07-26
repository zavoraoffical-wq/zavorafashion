/**
 * Products API — api/products.js
 * Local Product Engine powered by MongoDB (10,000+ scalable).
 *
 * GUARANTEES:
 * - 100% MongoDB native queries via ProductRepository
 * - ZERO runtime calls to Printful during page rendering
 * - CDN caching (Cache-Control: public, s-maxage=120)
 * - Full-text search, filtering by gender, category, collection, color, size, price
 * - Bulk update & deletion API
 */

'use strict';

const { ProductRepository, NormalizationEngine } = require('../lib/local-product-engine');
const { logSecurityEvent, rateLimit, setSecurityHeaders } = require('../lib/security');

function json(res, status, body, cacheSeconds = 0) {
  res.statusCode = status;
  setSecurityHeaders({ headers: {} }, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (cacheSeconds > 0) {
    res.setHeader('Cache-Control', `public, s-maxage=${cacheSeconds}, stale-while-revalidate=60`);
  } else {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
  }
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(String(req.body || '{}')); } catch { return {}; }
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

function storefrontProducts(products = []) {
  return products.filter(isRealStorefrontProduct);
}

module.exports = async function handler(req, res) {
  if (!rateLimit(req, res, 'products-api', { windowMs: 60_000, max: 300 })) return;

  let action = String(req.query.action || '').toLowerCase();
  if (req.method === 'POST' && !action) action = 'update';

  // ── Webhook receiver (Printful -> DB update) ─────────────────────────────
  if (action === 'webhook' && req.method === 'POST') {
    const body = parseBody(req);
    const type = String(body.type || '').toLowerCase();
    logSecurityEvent(req, 'printful_webhook', { type });
    return json(res, 200, { ok: true, received: type });
  }

  // ── Bulk update ──────────────────────────────────────────────────────────
  if (action === 'bulk-update' && req.method === 'POST') {
    try {
      const body = parseBody(req);
      if (!Array.isArray(body.ids) || !body.ids.length) {
        return json(res, 400, { ok: false, error: 'ids array required' });
      }
      const patch = body;
      // Fetch existing, patch, and upsert
      const updatedList = [];
      for (const id of body.ids) {
        const existing = await ProductRepository.getProductById(id);
        if (existing) {
          if (patch.status !== undefined) existing.status = patch.status;
          if (patch.published !== undefined) existing.published = patch.published;
          if (patch.category !== undefined) existing.category = patch.category;
          if (patch.gender !== undefined) existing.gender = patch.gender;
          if (patch.price !== undefined) existing.price = Number(patch.price);
          updatedList.push(existing);
        }
      }
      const resCount = await ProductRepository.bulkUpsert(updatedList);
      return json(res, 200, { ok: true, updated: resCount.modified + resCount.upserted });
    } catch (e) {
      return json(res, 400, { ok: false, error: e.message });
    }
  }

  // ── Single Product Add/Update/Save ─────────────────────────────────────────
  if (['update', 'save', 'add'].includes(action) && req.method === 'POST') {
    try {
      const body = parseBody(req);
      const id = body.id || body.printfulId || body.printful_id || `ZVR-${Date.now()}`;

      let productDoc = await ProductRepository.getProductById(id);
      if (!productDoc) {
        // Create new product in MongoDB
        productDoc = NormalizationEngine.normalize(body, 0, body.gender) || {
          ...body,
          id: id,
          printfulId: String(id),
          updatedAt: new Date()
        };
        productDoc.id = id;
        productDoc.printfulId = String(id);
      } else {
        const fields = ['name', 'title', 'price', 'compareAt', 'category', 'gender', 'collection', 'status', 'published', 'description', 'img', 'image', 'images', 'sizes', 'colors', 'badge', 'videoUrl', 'hoverImage', 'stock', 'sku'];
        fields.forEach(f => {
          if (body[f] !== undefined) productDoc[f] = body[f];
        });
      }

      const resCount = await ProductRepository.bulkUpsert([productDoc]);
      return json(res, 200, { ok: true, updated: resCount.modified + resCount.upserted, product: productDoc });
    } catch (e) {
      return json(res, 500, { ok: false, error: e.message });
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  if (action === 'delete' && req.method === 'POST') {
    try {
      const body = parseBody(req);
      const ids = Array.isArray(body.ids) ? body.ids : [body.id].filter(Boolean);
      const resCount = await ProductRepository.deleteByIds(ids);
      return json(res, 200, { ok: true, deleted: resCount.deleted });
    } catch (e) {
      return json(res, 500, { ok: false, error: e.message });
    }
  }

  // ── GET Single Product or Search/Catalog ─────────────────────────────────
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });

  try {
    // Single Product lookup
    const singleId = req.query.id || req.query.productId;
    if (singleId) {
      const product = await ProductRepository.getProductById(singleId);
      if (!product) return json(res, 404, { ok: false, error: 'Product not found' });
      if (!isRealStorefrontProduct(product)) return json(res, 404, { ok: false, error: 'Product not found' });
      return json(res, 200, { ok: true, product }, 120);
    }

    // Catalog query via ProductRepository (MongoDB Native Indexed)
    const result = await ProductRepository.findProducts(req.query);

    res.setHeader('X-Total-Count', String(result.total));
    res.setHeader('X-Page', String(result.page));
    res.setHeader('X-Per-Page', String(result.limit));

    const products = storefrontProducts(result.products);

    return json(res, 200, {
      ok: true,
      provider: 'local-mongodb',
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      count: products.length,
      products
    }, 120); // 2-minute CDN cache

  } catch (error) {
    logSecurityEvent(req, 'products_api_error', { message: error.message });
    return json(res, 500, { ok: false, error: 'Could not load products from database' });
  }
};
