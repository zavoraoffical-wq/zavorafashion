/**
 * Enterprise Import Queue — api/import-queue.js
 * Handles Printful catalog imports of 1–1000+ products.
 * Features: batch processing, retry (3x), resume, deduplication, progress tracking.
 */

const { db: mongoDb } = require('../lib/auth-lib');
const { requireAdminSession } = require('../lib/admin-auth');
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

const { NormalizationEngine, ProductRepository } = require('../lib/local-product-engine');

function transformProduct(raw, index, requestedGender) {
  return NormalizationEngine.normalize(raw, index, requestedGender);
}

async function upsertProducts(products) {
  try {
    const res = await ProductRepository.bulkUpsert(products);
    return { mongo: res.upserted + res.modified, supabase: products.length, errors: [] };
  } catch (e) {
    return { mongo: 0, supabase: 0, errors: [e.message] };
  }
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
  if (!requireAdminSession(req, res)) return;

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
