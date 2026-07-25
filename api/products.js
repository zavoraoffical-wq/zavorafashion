/**
 * Products API — api/products.js
 * Enterprise-grade product read/write/search/sync endpoint.
 * Features: pagination, search, bulk ops, CDN cache headers, webhook receive.
 * NO live Printful fallback — DB only. Printful only on explicit import.
 */

'use strict';

const { db: mongoDb } = require('../lib/auth-lib');
const { logSecurityEvent, rateLimit, setSecurityHeaders } = require('../lib/security');

const SUPABASE_URL   = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_TABLE = process.env.SUPABASE_PRODUCTS_TABLE || 'products';

// ─── Allowed categories & collections ─────────────────────────────────────────
const ALLOWED_CATEGORIES = new Set([
  'oversized-tees','heavyweight-tees','baby-tees','hoodies','cropped-hoodies',
  'zip-hoodies','sweatshirts','jackets','cargo-pants','sweatpants','shorts',
  'accessories','sportswear','matching-sets','beachwear','tees'
]);

const BLOCKED_TERMS = /(underwear|boxer|brief|trunk|thong|panties|bra|bikini|sock|backpack|bag|tote|duffle|luggage|rug|ornament|poster|mug|canvas|sticker|phone|pillow|blanket|towel|apron|pet|case|sleeve|laptop|bottle|mouse\s?pad|notebook|journal|stationery|tumbler|cup|drinkware|water\s?bottle|postcard|bodysuit|baby\s+body|baby\s+jersey|legging)/i;

// ─── Response helpers ──────────────────────────────────────────────────────────

function setCache(res, seconds) {
  res.setHeader('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=60`);
}

function json(res, status, body, cacheSeconds = 0) {
  res.statusCode = status;
  setSecurityHeaders({ headers: {} }, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (cacheSeconds > 0) setCache(res, cacheSeconds);
  else res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(String(req.body || '{}')); } catch { return {}; }
}

// ─── Product validation & filtering ───────────────────────────────────────────

function isValidProduct(p) {
  if (!p || !p.name) return false;
  const text = `${p.name} ${p.category || ''} ${p.productType || ''}`;
  if (BLOCKED_TERMS.test(text)) return false;
  const cat = String(p.category || '').toLowerCase();
  return ALLOWED_CATEGORIES.has(cat) || cat === '';
}

function categoryMatches(productCat, requested) {
  const req = String(requested || '').toLowerCase().trim();
  const cat = String(productCat  || '').toLowerCase().trim();
  if (!req || req === 'all') return true;
  const groups = {
    tees:            ['tees','oversized-tees','heavyweight-tees','baby-tees'],
    hoodies:         ['hoodies','cropped-hoodies','zip-hoodies'],
    pants:           ['cargo-pants','sweatpants'],
    outerwear:       ['jackets'],
    accessories:     ['accessories'],
    joggers:         ['sweatpants'],
    'oversized-tees':['oversized-tees'],
    'heavyweight-tees':['heavyweight-tees'],
    'baby-tees':     ['baby-tees'],
    'cropped-hoodies':['cropped-hoodies'],
    'zip-hoodies':   ['zip-hoodies'],
    sweatshirts:     ['sweatshirts'],
    'cargo-pants':   ['cargo-pants'],
    sweatpants:      ['sweatpants'],
    shorts:          ['shorts'],
    jackets:         ['jackets'],
    sportswear:      ['sportswear'],
    'matching-sets': ['matching-sets'],
    beachwear:       ['beachwear']
  };
  return (groups[req] || [req]).includes(cat);
}

function productMatches(p, query) {
  const gender     = String(query.gender     || '').toLowerCase();
  const category   = String(query.category   || '').toLowerCase();
  const collection = String(query.collection || '').toLowerCase();
  const search     = String(query.q || query.search || '').toLowerCase();
  const status     = String(query.status     || 'active').toLowerCase();

  const productGender  = String(p.gender || '').toLowerCase();
  const productStatus  = String(p.status || 'active').toLowerCase();
  const collections    = Array.isArray(p.collection) ? p.collection.map(c => String(c).toLowerCase()) : [];
  const searchText     = `${p.name || ''} ${p.category || ''} ${p.productType || ''} ${(p.colors || []).join(' ')} ${collections.join(' ')}`.toLowerCase();

  if (!isValidProduct(p)) return false;
  if (status !== 'all' && productStatus !== status && productStatus !== 'active') return false;
  if (gender && gender !== 'all' && productGender !== gender && productGender !== 'unisex') return false;
  if (!categoryMatches(p.category, category)) return false;
  if (collection && collection !== 'all' && !collections.includes(collection)) return false;
  if (search && !searchText.includes(search)) return false;
  return true;
}

// ─── DB read ───────────────────────────────────────────────────────────────────

async function readFromMongo(query, limit, skip) {
  const database = await mongoDb();
  const filter = {};
  const gender = String(query.gender || '').toLowerCase();
  if (gender && gender !== 'all') filter['payload.gender'] = new RegExp(`^${gender}$`, 'i');

  const products = await database.collection('products')
    .find(filter)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await database.collection('products').countDocuments(filter);
  return { products: products.map(p => p.payload || p).filter(Boolean), total };
}

async function readFromSupabase(limit, skip) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { products: [], total: 0 };
  const base  = SUPABASE_URL.replace(/\/$/, '');
  const url   = `${base}/rest/v1/${SUPABASE_TABLE}?select=payload,updated_at&order=updated_at.desc&limit=${limit}&offset=${skip}`;
  const r = await fetch(url, {
    headers: {
      apikey:        SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept:        'application/json',
      'Range-Unit':  'items',
      Range:         `${skip}-${skip + limit - 1}`
    }
  });
  const rows = await r.json().catch(() => []);
  if (!r.ok) throw new Error(`Supabase: ${r.status}`);
  const total = parseInt(r.headers.get('Content-Range')?.split('/')[1] || '0', 10);
  return { products: rows.map(row => row.payload).filter(Boolean), total };
}

// ─── Bulk operations ────────────────────────────────────────────────────────────

async function bulkUpdate(ids, patch) {
  if (!ids?.length) throw new Error('ids array required');
  const allowed = ['status','published','category','collection','price','gender'];
  const update  = {};
  for (const key of allowed) {
    if (patch[key] !== undefined) update[`payload.${key}`] = patch[key];
    if (key === 'published') update['payload.status'] = patch.published ? 'active' : 'hidden';
  }
  if (!Object.keys(update).length) throw new Error('No valid fields to update');

  const database = await mongoDb();
  const stringIds = ids.map(String);
  const result = await database.collection('products').updateMany(
    { 'payload.printfulId': { $in: stringIds } },
    { $set: { ...update, updatedAt: new Date() } }
  );
  return { updated: result.modifiedCount };
}

async function deleteProducts(ids) {
  if (!ids?.length) throw new Error('ids array required');
  const database = await mongoDb();
  const result = await database.collection('products').deleteMany({
    'payload.printfulId': { $in: ids.map(String) }
  });
  // Also mark hidden in Supabase (soft delete)
  if (SUPABASE_URL && SUPABASE_KEY) {
    const base = SUPABASE_URL.replace(/\/$/, '');
    for (const id of ids) {
      await fetch(`${base}/rest/v1/${SUPABASE_TABLE}?printful_id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ payload: { status: 'deleted' } })
      }).catch(() => {});
    }
  }
  return { deleted: result.deletedCount };
}

async function updateSingleProduct(id, patch) {
  const database = await mongoDb();
  const allowedFields = ['name','price','compareAt','category','gender','collection','status','published','description','img','images','sizes','colors','badge'];
  const update = {};
  for (const key of allowedFields) {
    if (patch[key] !== undefined) update[`payload.${key}`] = patch[key];
  }
  update['updatedAt'] = new Date();
  const result = await database.collection('products').updateOne(
    { $or: [{ 'payload.printfulId': String(id) }, { 'payload.id': Number(id) }] },
    { $set: update }
  );
  return { updated: result.modifiedCount };
}

// ─── Webhook handler (Printful → auto-sync) ───────────────────────────────────

async function handleWebhook(req, res) {
  // Verify Printful webhook signature
  const sig   = req.headers['x-printful-signature'] || '';
  const secret = process.env.PRINTFUL_WEBHOOK_SECRET || '';
  if (secret && sig) {
    const crypto = require('crypto');
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (sig !== expected) return json(res, 401, { ok: false, error: 'Invalid signature' });
  }

  const body = parseBody(req);
  const type = String(body.type || '').toLowerCase();

  logSecurityEvent(req, 'printful_webhook', { type });

  // Product update / stock / price change
  if (['product_updated','stock_updated','variant_updated','order_created'].includes(type)) {
    const printfulId = String(body.data?.sync_product?.id || body.data?.product?.id || '').trim();
    if (printfulId) {
      // Mark for re-sync (next catalog read will pick it up)
      const database = await mongoDb();
      await database.collection('products').updateOne(
        { 'payload.printfulId': printfulId },
        { $set: { needsSync: true, updatedAt: new Date() } }
      );
    }
  }

  return json(res, 200, { ok: true, received: type });
}

// ─── Main handler ──────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (!rateLimit(req, res, 'products-api', { windowMs: 60_000, max: 200 })) return;

  const action = String(req.query.action || '').toLowerCase();

  // ── Webhook ─────────────────────────────────────────────────────────────
  if (action === 'webhook' && req.method === 'POST') return handleWebhook(req, res);

  // ── Bulk update ─────────────────────────────────────────────────────────
  if (action === 'bulk-update' && req.method === 'POST') {
    try {
      const body   = parseBody(req);
      const result = await bulkUpdate(body.ids, body);
      return json(res, 200, { ok: true, ...result });
    } catch (e) {
      return json(res, 400, { ok: false, error: e.message });
    }
  }

  // ── Single update ────────────────────────────────────────────────────────
  if (action === 'update' && req.method === 'POST') {
    try {
      const body   = parseBody(req);
      const id     = body.id || body.printfulId;
      if (!id) return json(res, 400, { ok: false, error: 'id required' });
      const result = await updateSingleProduct(id, body);
      return json(res, 200, { ok: true, ...result });
    } catch (e) {
      return json(res, 500, { ok: false, error: e.message });
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  if (action === 'delete' && req.method === 'POST') {
    try {
      const body   = parseBody(req);
      const ids    = Array.isArray(body.ids) ? body.ids : [body.id].filter(Boolean);
      const result = await deleteProducts(ids);
      return json(res, 200, { ok: true, ...result });
    } catch (e) {
      return json(res, 500, { ok: false, error: e.message });
    }
  }

  // ── Sync cache (called by import-queue after completion) ─────────────────
  if (action === 'sync-cache' && req.method === 'POST') {
    // Just a no-op acknowledgement — data is already in MongoDB
    return json(res, 200, { ok: true, message: 'Cache sync acknowledged' });
  }

  // ── GET products ─────────────────────────────────────────────────────────
  if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' });

  try {
    const limit = Math.min(Number(req.query.limit || 24), 1000);
    const page  = Math.max(Number(req.query.page || 1), 1);
    const skip  = (page - 1) * limit;

    // 1. Try MongoDB
    try {
      const { products: rawProducts, total } = await readFromMongo(req.query, limit * 4, 0);
      const filtered = rawProducts
        .filter(p => productMatches(p, req.query))
        .slice(skip, skip + limit);

      if (filtered.length > 0 || total > 0) {
        res.setHeader('X-Total-Count', String(total));
        res.setHeader('X-Page', String(page));
        res.setHeader('X-Per-Page', String(limit));
        return json(res, 200, {
          ok:       true,
          provider: 'mongodb',
          page,
          limit,
          total,
          count:    filtered.length,
          products: filtered
        }, 120); // 2-minute CDN cache
      }
    } catch (mongoErr) {
      logSecurityEvent(req, 'products_mongo_error', { message: mongoErr.message });
    }

    // 2. Try Supabase
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const { products: rawProducts, total } = await readFromSupabase(limit * 4, 0);
        const filtered = rawProducts
          .filter(p => productMatches(p, req.query))
          .slice(skip, skip + limit);

        if (filtered.length > 0) {
          res.setHeader('X-Total-Count', String(total));
          return json(res, 200, {
            ok:       true,
            provider: 'supabase',
            page,
            limit,
            total,
            count:    filtered.length,
            products: filtered
          }, 120);
        }
      } catch (supaErr) {
        logSecurityEvent(req, 'products_supabase_error', { message: supaErr.message });
      }
    }

    // 3. No products in DB — return empty (do NOT fall back to live Printful)
    return json(res, 200, {
      ok:       true,
      provider: 'empty',
      page,
      limit,
      total:    0,
      count:    0,
      products: [],
      hint:     'No products in database. Use Admin > Import Products to import from Printful.'
    });

  } catch (error) {
    logSecurityEvent(req, 'products_api_error', { message: error.message });
    return json(res, 500, { ok: false, error: 'Could not load products' });
  }
};
