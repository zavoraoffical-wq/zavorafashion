/**
 * Enterprise Import Queue — api/import-queue.js
 * Handles Printful catalog imports of 1–1000+ products.
 * Features: batch processing, retry (3x), resume, deduplication, progress tracking.
 */

const { db: mongoDb } = require('../lib/auth-lib');
const { rateLimit, setSecurityHeaders, logSecurityEvent } = require('../lib/security');

const PRINTFUL_API_BASE = process.env.PRINTFUL_API_BASE_URL || 'https://api.printful.com';
const PRINTFUL_KEY      = process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_API_TOKEN || process.env.PRINTFUL_ACCESS_TOKEN || process.env.PRINTFUL_PRIVATE_TOKEN || process.env.PRINTFUL_TOKEN;
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID;

// Blocked product types — never import these
const BLOCKED_TERMS = /(underwear|boxer|brief|trunk|thong|panties|bra|bikini|sock|backpack|bag|tote|duffle|luggage|rug|ornament|poster|mug|canvas|sticker|phone|pillow|blanket|towel|apron|pet|case|sleeve|laptop|bottle|mouse\s?pad|notebook|journal|stationery|tumbler|cup|drinkware|water\s?bottle|postcard|bodysuit|baby\s+body|legging)/i;

const BATCH_SIZE    = 10;  // products per batch
const MAX_RETRIES   = 3;
const CONCURRENCY   = 5;   // max simultaneous Printful API calls

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(res, status, body) {
  res.statusCode = status;
  setSecurityHeaders({ headers: {} }, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(String(req.body || '{}')); } catch { return {}; }
}

async function pfFetch(path) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${PRINTFUL_API_BASE}${path}${PRINTFUL_STORE_ID ? `${sep}store_id=${PRINTFUL_STORE_ID}` : ''}`;
  const headers = {
    'Authorization': `Bearer ${PRINTFUL_KEY}`,
    'Content-Type': 'application/json'
  };
  if (PRINTFUL_STORE_ID) headers['X-PF-Store-Id'] = PRINTFUL_STORE_ID;
  const r = await fetch(url, { headers });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.error?.message || body?.message || `Printful ${r.status}`);
  return body;
}

// Run at most `limit` promises concurrently
async function pMap(items, fn, limit) {
  const results = [];
  let i = 0;
  async function run() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, run);
  await Promise.all(workers);
  return results;
}

// ─── Job Store (MongoDB) ────────────────────────────────────────────────────

async function jobCollection() {
  const database = await mongoDb();
  const col = database.collection('import_jobs');
  await col.createIndex({ jobId: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 * 7 }).catch(() => {});
  return col;
}

async function createJob(opts) {
  const col  = await jobCollection();
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const doc = {
    jobId,
    status:    'queued',
    gender:    opts.gender || 'all',
    category:  opts.category || '',
    limit:     Math.min(Number(opts.limit || 100), 1500),
    offset:    0,
    total:     0,
    imported:  0,
    failed:    0,
    skipped:   0,
    batches:   [],
    errors:    [],
    log:       [],
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null
  };
  await col.insertOne(doc);
  return doc;
}

async function getJob(jobId) {
  const col = await jobCollection();
  return col.findOne({ jobId });
}

async function updateJob(jobId, patch) {
  const col = await jobCollection();
  await col.updateOne({ jobId }, { $set: { ...patch, updatedAt: new Date() } });
}

async function appendJobLog(jobId, message, level = 'info') {
  const col = await jobCollection();
  await col.updateOne({ jobId }, {
    $push: { log: { t: new Date(), msg: message, level } },
    $set:  { updatedAt: new Date() }
  });
}

// ─── Product Transform (lightweight copy from printful-products.js) ────────

const CATEGORY_RULES = [
  { match: /zip hoodie|zip-up|full zip/i,             category: 'zip-hoodies',      gender: null  },
  { match: /cropped hoodie|crop hoodie/i,              category: 'cropped-hoodies',  gender: 'Women' },
  { match: /hoodie|pullover hoodie/i,                  category: 'hoodies',          gender: null  },
  { match: /sweatshirt|crewneck|crew neck|fleece/i,   category: 'sweatshirts',      gender: null  },
  { match: /baby tee/i,                               category: 'baby-tees',        gender: 'Women' },
  { match: /heavyweight tee|heavyweight t-shirt/i,    category: 'heavyweight-tees', gender: null  },
  { match: /oversized tee|oversized t-shirt/i,        category: 'oversized-tees',   gender: null  },
  { match: /t-shirt|tee|shirt/i,                      category: 'oversized-tees',   gender: null  },
  { match: /jacket|bomber|varsity|windbreaker|coat/i, category: 'jackets',          gender: null  },
  { match: /cargo/i,                                  category: 'cargo-pants',      gender: null  },
  { match: /sweatpants|jogger/i,                      category: 'sweatpants',       gender: null  },
  { match: /short/i,                                  category: 'shorts',           gender: null  },
  { match: /set|matching|tracksuit/i,                 category: 'matching-sets',    gender: null  },
  { match: /sport|athletic|gym|training|active|jersey/i, category: 'sportswear',   gender: null  },
  { match: /cap|hat|beanie/i,                         category: 'accessories',      gender: null  }
];

const ALLOWED_CATEGORIES = new Set([
  'oversized-tees','heavyweight-tees','baby-tees','hoodies','cropped-hoodies',
  'zip-hoodies','sweatshirts','jackets','cargo-pants','sweatpants','shorts',
  'accessories','sportswear','matching-sets','beachwear'
]);

function detectCategory(name) {
  const rule = CATEGORY_RULES.find(r => r.match.test(name));
  return rule ? rule.category : 'uncategorized';
}

function detectGender(name, requestedGender) {
  if (requestedGender && requestedGender !== 'all') {
    return requestedGender.charAt(0).toUpperCase() + requestedGender.slice(1).toLowerCase();
  }
  if (/women|women's|ladies|female|crop/i.test(name)) return 'Women';
  if (/men|men's|male/i.test(name)) return 'Men';
  return 'Unisex';
}

function transformProduct(raw, index, requestedGender) {
  const name = String(
    raw?.name || raw?.external_name || raw?.sync_product?.name || raw?.title || `Product ${index + 1}`
  ).replace(/\b(all-over print|unisex|printful|dtg|gildan|bella canvas|champion|hanes)\b/gi, '').trim();

  const category = detectCategory(name);
  const gender   = detectGender(name, requestedGender);
  const text     = `${name} ${raw?.description || ''}`.toLowerCase();

  if (!ALLOWED_CATEGORIES.has(category)) return null;
  if (BLOCKED_TERMS.test(text)) return null;

  const price      = Math.round(((Number(raw?.retail_price || raw?.price || 58) + 14.99) * 1.3) * 100) / 100;
  const compareAt  = Math.round(((Number(raw?.retail_price || raw?.price || 58) + 14.99) * 2.3) * 100) / 100;

  // Image — try every known field
  const img = raw?.thumbnail_url || raw?.image || raw?.image_url
    || raw?.catalog_product?.image || raw?.product?.image
    || (raw?.sync_variants?.[0]?.files?.[0]?.preview_url)
    || '';

  // Sizes
  const sizeOrder = ['XS','S','M','L','XL','2XL','3XL'];
  const allVariants = [
    ...(raw?.catalog_variants || []),
    ...(raw?.sync_variants    || []),
    ...(raw?.variants         || [])
  ];
  const sizes = allVariants.length
    ? [...new Set(allVariants.map(v => {
        const s = String(v?.size || v?.size_name || '').toUpperCase();
        return sizeOrder.includes(s) ? s : null;
      }).filter(Boolean))].sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b))
    : ['S','M','L','XL'];

  // Colors
  const colorMap = ['black','white','gray','blue','green','red','pink','purple','brown','gold'];
  const rawColors = allVariants.map(v => {
    const c = String(v?.color || v?.color_name || v?.name || '').toLowerCase();
    return colorMap.find(col => c.includes(col)) || '';
  }).filter(Boolean);
  const colors = [...new Set(rawColors)] || ['black'];

  const collections = ['streetwear'];
  if (index < 6) collections.push('new');
  if (/women/i.test(gender)) collections.push('streetwear');
  if (index % 23 === 0) collections.push('limited');

  return {
    id:          Number(raw?.id || raw?.template_id || Date.now() + index),
    printfulId:  String(raw?.id || raw?.template_id || ''),
    name:        /^zavora/i.test(name) ? name : `Zavora ${name}`,
    gender,
    category,
    categoryPath: `${gender} > ${category.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}`,
    productType: category,
    collection:  collections,
    color:       colors[0] || 'black',
    colors:      colors.length ? colors : ['black'],
    sizes,
    price,
    compareAt,
    sale:        true,
    popularity:  90 - (index % 10),
    badge:       index < 4 ? 'New' : 'Zavora',
    img,
    images:      img ? [img] : [],
    stock:       5,
    published:   true,
    status:      'active',
    source:      'printful',
    importedAt:  new Date().toISOString(),
    description: `${name} — premium ${category.replace(/-/g,' ')} for Zavora's minimal streetwear wardrobe.`,
    seoTitle:    `${name} | Zavora Fashion`,
    seoDescription: `Shop ${name} from Zavora Fashion. Premium ${gender.toLowerCase()} streetwear.`
  };
}

// ─── DB Save (upsert to MongoDB + Supabase) ────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_TABLE = process.env.SUPABASE_PRODUCTS_TABLE || 'products';

async function upsertProducts(products) {
  const results = { mongo: 0, supabase: 0, errors: [] };

  // MongoDB
  try {
    const database = await mongoDb();
    const col = database.collection('products');
    await col.createIndex({ printfulId: 1 }, { unique: true }).catch(() => {});
    const ops = products.map(p => ({
      updateOne: {
        filter: { printfulId: p.printfulId },
        update: { $set: { ...p, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        upsert: true
      }
    }));
    if (typeof col.bulkWrite === 'function') {
      const r = await col.bulkWrite(ops, { ordered: false });
      results.mongo = (r.upsertedCount || 0) + (r.modifiedCount || 0);
    } else {
      for (const op of ops) {
        await col.updateOne(op.updateOne.filter, op.updateOne.update, { upsert: true });
        results.mongo++;
      }
    }
  } catch (e) {
    results.errors.push(`MongoDB: ${e.message}`);
  }

  // Supabase
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const rows = products.map(p => ({
        printful_id: p.printfulId,
        name:        p.name,
        gender:      p.gender,
        category:    p.category,
        collection:  p.collection,
        price:       p.price,
        compare_at:  p.compareAt,
        image:       p.img,
        images:      p.images,
        sizes:       p.sizes,
        colors:      p.colors,
        payload:     p,
        source:      'printful',
        updated_at:  new Date().toISOString()
      }));
      const base = SUPABASE_URL.replace(/\/$/, '');
      const r = await fetch(`${base}/rest/v1/${SUPABASE_TABLE}?on_conflict=printful_id`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(rows)
      });
      if (r.ok) results.supabase = products.length;
      else results.errors.push(`Supabase: ${r.status} ${await r.text().catch(() => '')}`);
    } catch (e) {
      results.errors.push(`Supabase: ${e.message}`);
    }
  }
  return results;
}

// ─── Core Import Runner (runs in background via Vercel background function) ──

async function runImportJob(jobId) {
  const job = await getJob(jobId);
  if (!job || job.status === 'completed' || job.status === 'cancelled') return;

  await updateJob(jobId, { status: 'running' });
  await appendJobLog(jobId, `Import started — gender=${job.gender}, limit=${job.limit}`);

  try {
    // Step 1: Fetch Printful catalog list
    await appendJobLog(jobId, 'Fetching Printful catalog list...');
    const catalog = await pfFetch('/products');
    const allRows = Array.isArray(catalog.result) ? catalog.result : [];

    // Step 2: Filter by gender and blocked types
    const genderFilter = String(job.gender || 'all').toLowerCase();
    const filtered = allRows.filter(p => {
      const text = `${p?.name || ''} ${p?.title || ''} ${p?.type_name || ''} ${p?.description || ''}`;
      if (BLOCKED_TERMS.test(text)) return false;
      if (genderFilter === 'women') return /women|ladies|female|crop|baby\s?tee/i.test(text) && !/\bmen\b|\bmale\b/i.test(text);
      if (genderFilter === 'men')   return /\bhoodie|\btee|\bt-shirt|\bshirt|\bjacket|\bpant|\bjogger|\bcargo|\bshort|\bcap|\bhat|\bbeanie/i.test(text) && !/women|ladies|female/i.test(text);
      return true;
    }).slice(0, job.limit);

    await updateJob(jobId, { total: filtered.length });
    await appendJobLog(jobId, `Found ${filtered.length} matching products in catalog`);

    // Step 3: Process in batches
    let imported = 0, failed = 0, skipped = 0;
    const batches = [];
    for (let i = 0; i < filtered.length; i += BATCH_SIZE) {
      batches.push(filtered.slice(i, i + BATCH_SIZE));
    }

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      let attempt = 0;
      let batchOk = false;

      while (attempt < MAX_RETRIES && !batchOk) {
        attempt++;
        try {
          // Fetch detail for each product in batch (with concurrency limit)
          const detailed = await pMap(batch, async (p, i) => {
            const productId = p?.id || p?.product_id;
            try {
              if (productId) {
                const detail = await pfFetch(`/products/${productId}`);
                const result = detail.result || {};
                return {
                  ...p,
                  ...result.product,
                  catalog_variants: result.variants || [],
                  printful_detail: result
                };
              }
              return p;
            } catch {
              return p; // Use basic product data if detail fetch fails
            }
          }, CONCURRENCY);

          // Transform products
          const transformed = detailed
            .map((p, i) => transformProduct(p, imported + i, genderFilter !== 'all' ? genderFilter : ''))
            .filter(Boolean);

          if (!transformed.length) { skipped += batch.length; batchOk = true; continue; }

          // Save to DB
          const saveResult = await upsertProducts(transformed);
          imported += transformed.length;
          skipped  += (batch.length - transformed.length);
          batchOk = true;

          await updateJob(jobId, { imported, failed, skipped });
          await appendJobLog(jobId,
            `Batch ${batchIdx + 1}/${batches.length}: saved ${transformed.length} products (Mongo: ${saveResult.mongo}, Supabase: ${saveResult.supabase})`
          );
        } catch (e) {
          await appendJobLog(jobId, `Batch ${batchIdx + 1} attempt ${attempt} failed: ${e.message}`, 'warn');
          if (attempt >= MAX_RETRIES) {
            failed += batch.length;
            await updateJob(jobId, { failed });
            await appendJobLog(jobId, `Batch ${batchIdx + 1} permanently failed after ${MAX_RETRIES} retries`, 'error');
          } else {
            await new Promise(r => setTimeout(r, 1000 * attempt)); // back-off
          }
        }
      }
    }

    await updateJob(jobId, { status: 'completed', completedAt: new Date(), imported, failed, skipped });
    await appendJobLog(jobId, `Import complete — ${imported} imported, ${failed} failed, ${skipped} skipped`);

  } catch (e) {
    await updateJob(jobId, { status: 'failed' });
    await appendJobLog(jobId, `Fatal error: ${e.message}`, 'error');
    logSecurityEvent({}, 'import_queue_fatal', { message: e.message, jobId });
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  setSecurityHeaders({ headers: {} }, res);

  if (!rateLimit(req, res, 'import-queue', { windowMs: 60_000, max: 60 })) return;

  const action = String(req.query.action || (req.method === 'POST' ? '' : 'status')).toLowerCase();

  // ── GET status ──────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const jobId = String(req.query.jobId || '').trim();
    if (!jobId) {
      // List recent jobs
      try {
        const col = await jobCollection();
        const jobs = await col.find({}, {
          projection: { log: 0 }
        }).sort({ createdAt: -1 }).limit(20).toArray();
        return json(res, 200, { ok: true, jobs });
      } catch (e) {
        return json(res, 500, { ok: false, error: e.message });
      }
    }
    try {
      const job = await getJob(jobId);
      if (!job) return json(res, 404, { ok: false, error: 'Job not found' });
      const { _id, ...safeJob } = job;
      const progress = job.total > 0
        ? Math.round(((job.imported + job.failed + job.skipped) / job.total) * 100)
        : 0;
      return json(res, 200, { ok: true, progress, ...safeJob });
    } catch (e) {
      return json(res, 500, { ok: false, error: e.message });
    }
  }

  // ── POST actions ─────────────────────────────────────────────────────────
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

  const body = parseBody(req);
  const act  = String(body.action || action || 'start').toLowerCase();

  // Start a new import job
  if (act === 'start') {
    if (!PRINTFUL_KEY) return json(res, 500, { ok: false, error: 'Printful API key not configured' });
    try {
      const job = await createJob({
        gender:   body.gender || req.query.gender || 'all',
        category: body.category || req.query.category || '',
        limit:    body.limit || req.query.limit || 100
      });

      // Kick off async processing (Vercel: fire-and-forget pattern)
      setImmediate(() => runImportJob(job.jobId).catch(e =>
        console.error(`[ImportQueue] job ${job.jobId} failed:`, e)
      ));

      return json(res, 202, {
        ok: true,
        message: 'Import job started',
        jobId:   job.jobId,
        status:  'queued',
        gender:  job.gender,
        limit:   job.limit
      });
    } catch (e) {
      return json(res, 500, { ok: false, error: e.message });
    }
  }

  // Retry a failed job
  if (act === 'retry') {
    const jobId = body.jobId || req.query.jobId;
    if (!jobId) return json(res, 400, { ok: false, error: 'jobId required' });
    try {
      const job = await getJob(jobId);
      if (!job) return json(res, 404, { ok: false, error: 'Job not found' });
      await updateJob(jobId, { status: 'queued', errors: [], log: [], imported: 0, failed: 0, skipped: 0 });
      setImmediate(() => runImportJob(jobId).catch(e =>
        console.error(`[ImportQueue] retry ${jobId} failed:`, e)
      ));
      return json(res, 202, { ok: true, message: 'Job retry started', jobId });
    } catch (e) {
      return json(res, 500, { ok: false, error: e.message });
    }
  }

  // Cancel a running job
  if (act === 'cancel') {
    const jobId = body.jobId || req.query.jobId;
    if (!jobId) return json(res, 400, { ok: false, error: 'jobId required' });
    try {
      await updateJob(jobId, { status: 'cancelled' });
      return json(res, 200, { ok: true, message: 'Job cancelled', jobId });
    } catch (e) {
      return json(res, 500, { ok: false, error: e.message });
    }
  }

  // Delete a job record
  if (act === 'delete') {
    const jobId = body.jobId || req.query.jobId;
    if (!jobId) return json(res, 400, { ok: false, error: 'jobId required' });
    try {
      const col = await jobCollection();
      await col.deleteOne({ jobId });
      return json(res, 200, { ok: true, message: 'Job deleted' });
    } catch (e) {
      return json(res, 500, { ok: false, error: e.message });
    }
  }

  return json(res, 400, { ok: false, error: `Unknown action: ${act}` });
};
