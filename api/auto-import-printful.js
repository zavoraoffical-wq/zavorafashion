function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(data));
}

function originFromRequest(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || process.env.VERCEL_URL || 'www.zavorafashion.com';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${host}`;
}

async function importPage({ origin, gender, page, limit }) {
  const url = `${origin}/api/printful-products?gender=${encodeURIComponent(gender)}&limit=${limit}&page=${page}&save=true`;
  const result = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-zavora-auto-import': 'true'
    }
  });
  const body = await result.json().catch(() => ({}));
  if (!result.ok || body.ok === false) {
    throw new Error(body.error || `Import failed for ${gender} page ${page}: ${result.status}`);
  }
  return {
    gender,
    page,
    source: body.source,
    count: body.count || 0,
    total: body.total || 0,
    db: body.db || null
  };
}

module.exports = async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET || '';
  const providedSecret = String(req.query.secret || req.headers['x-cron-secret'] || '');
  if (cronSecret && providedSecret !== cronSecret) {
    return json(res, 401, { ok: false, error: 'Invalid cron secret' });
  }

  const origin = process.env.SITE_URL || process.env.PUBLIC_SITE_URL || originFromRequest(req);
  const genders = String(req.query.genders || process.env.AUTO_IMPORT_GENDERS || 'men,women')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const limit = Math.min(Number(req.query.limit || process.env.AUTO_IMPORT_LIMIT || 60), 60);
  const pages = Math.max(1, Math.min(Number(req.query.pages || process.env.AUTO_IMPORT_PAGES || 3), 10));
  const imported = [];
  const errors = [];

  for (const gender of genders) {
    for (let page = 1; page <= pages; page += 1) {
      try {
        const result = await importPage({ origin, gender, page, limit });
        imported.push(result);
        if (!result.count) break;
      } catch (error) {
        errors.push({ gender, page, error: error.message });
        break;
      }
    }
  }

  return json(res, errors.length ? 207 : 200, {
    ok: errors.length === 0,
    provider: 'printful-catalog',
    storage: 'supabase',
    origin,
    limit,
    pages,
    imported,
    errors,
    importedCount: imported.reduce((sum, item) => sum + item.count, 0)
  });
};
