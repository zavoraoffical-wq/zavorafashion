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

async function importCatalogPage({ origin, collection, category, productId, search, gender, page, limit }) {
  const params = new URLSearchParams({
    gender,
    limit: String(limit),
    page: String(page),
    save: 'true'
  });
  if (collection) params.set('collection', collection);
  if (category) params.set('category', category);
  if (productId) params.set('productId', productId);
  if (search) params.set('q', search);
  const url = `${origin}/api/printful-products?${params.toString()}`;
  const result = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-zavora-auto-import': 'true'
    }
  });
  const body = await result.json().catch(() => ({}));
  if (!result.ok || body.ok === false) {
    throw new Error(body.error || `Import failed for ${collection}/${gender} page ${page}: ${result.status}`);
  }
  return {
    collection,
    category,
    productId,
    search,
    gender,
    page,
    source: body.source,
    count: body.count || 0,
    total: body.total || 0,
    db: body.db || null
  };
}

function slugFromUrl(url = '') {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').map((part) => part.trim().toLowerCase()).filter(Boolean);
    const last = parts[parts.length - 1] || '';
    const collectionIndex = parts.indexOf('collections');
    const customIndex = parts.indexOf('custom');
    const productId = (url.match(/(?:product|products|catalog|custom-products)[^\d]*(\d{3,})/i) || url.match(/\/(\d{3,})(?:[/?#]|$)/))?.[1] || '';
    return {
      parts,
      last,
      productId,
      collection: collectionIndex >= 0 ? parts[collectionIndex + 1] : '',
      category: customIndex >= 0 ? parts.slice(customIndex + 2).find(Boolean) || last : last
    };
  } catch (error) {
    return { parts: [], last: '', productId: '', collection: '', category: '' };
  }
}

function normalizeCategory(slug = '') {
  const map = {
    hoodies: 'hoodies',
    'sweatpants-joggers': 'sweatpants',
    sweatpants: 'sweatpants',
    joggers: 'sweatpants',
    jackets: 'jackets',
    pants: 'cargo-pants',
    shorts: 'shorts',
    't-shirts': 'tees',
    tees: 'tees',
    shoes: 'shoes',
    footwear: 'shoes',
    accessories: 'accessories',
    'flip-flops': 'beachwear'
  };
  return map[String(slug || '').toLowerCase()] || '';
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

  const origin = String(req.query.origin || originFromRequest(req) || process.env.SITE_URL || process.env.PUBLIC_SITE_URL).replace(/\/$/, '');
  const genders = String(req.query.genders || process.env.AUTO_IMPORT_GENDERS || 'men,women')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const limit = Math.min(Number(req.query.limit || process.env.AUTO_IMPORT_LIMIT || 60), 60);
  const pages = Math.max(1, Math.min(Number(req.query.pages || process.env.AUTO_IMPORT_PAGES || 10), 10));
  const importUrl = String(req.query.url || req.body?.url || '').trim();
  const importMode = String(req.query.mode || req.body?.mode || 'auto').toLowerCase();
  const detected = slugFromUrl(importUrl);
  const requestedCollection = String(req.query.collection || req.body?.collection || detected.collection || '').toLowerCase();
  const requestedCategory = normalizeCategory(String(req.query.category || req.body?.category || detected.category || '').toLowerCase());
  const requestedProductId = String(req.query.productId || req.body?.productId || detected.productId || '').trim();
  const requestedSearch = String(req.query.search || req.query.q || req.body?.search || '').trim();
  const collectionsEnabled = String(req.query.collections || process.env.AUTO_IMPORT_COLLECTIONS || 'true') !== 'false';
  const collectionPages = Math.max(1, Math.min(Number(req.query.collectionPages || process.env.AUTO_IMPORT_COLLECTION_PAGES || 2), 4));
  const collections = String(req.query.collectionList || process.env.AUTO_IMPORT_COLLECTION_LIST || 'sportswear,streetwear,beachwear,gifts,style-trends,grow-a-fashion-brand,made-in-eu,halloween,back-to-school,holiday-season,summer-hats-bags,matching-sets,summer-soccer-2026,fourth-of-july')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const imported = [];
  const errors = [];

  if (importUrl || requestedCollection || requestedCategory || requestedProductId || requestedSearch) {
    for (const gender of genders) {
      for (let page = 1; page <= pages; page += 1) {
        try {
          const result = await importCatalogPage({
            origin,
            collection: importMode === 'category' ? '' : requestedCollection,
            category: importMode === 'collection' ? '' : requestedCategory,
            productId: requestedProductId,
            search: requestedSearch,
            gender,
            page,
            limit
          });
          imported.push(result);
          if (requestedProductId || !result.count) break;
        } catch (error) {
          errors.push({ url: importUrl, gender, page, error: error.message });
          break;
        }
      }
    }
  } else {
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
  }

  if (!importUrl && collectionsEnabled) {
    for (const collection of collections) {
      for (const gender of genders) {
        for (let page = 1; page <= collectionPages; page += 1) {
          try {
            const result = await importCatalogPage({ origin, collection, gender, page, limit });
            imported.push(result);
            if (!result.count) break;
          } catch (error) {
            errors.push({ collection, gender, page, error: error.message });
            break;
          }
        }
      }
    }
  }

  return json(res, errors.length ? 207 : 200, {
    ok: errors.length === 0,
    provider: 'printful-catalog',
    storage: 'mongodb+supabase',
    origin,
    limit,
    pages,
    collectionsEnabled,
    collectionPages,
    imported,
    errors,
    importedCount: imported.reduce((sum, item) => sum + item.count, 0)
  });
};
