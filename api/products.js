function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(body));
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_PRODUCTS_TABLE = process.env.SUPABASE_PRODUCTS_TABLE || process.env.PRODUCTS_TABLE || 'products';

function productMatches(product, query) {
  const gender = String(query.gender || '').toLowerCase();
  const category = String(query.category || '').toLowerCase();
  const collection = String(query.collection || '').toLowerCase();
  const search = String(query.q || query.search || '').toLowerCase();
  const productGender = String(product.gender || '').toLowerCase();
  const productCategory = String(product.category || '').toLowerCase();
  const collections = Array.isArray(product.collection) ? product.collection.map((item) => String(item).toLowerCase()) : [];
  const text = `${product.name || ''} ${product.category || ''} ${product.productType || ''} ${(product.colors || []).join(' ')} ${collections.join(' ')}`.toLowerCase();
  return (!gender || productGender === gender || productGender === 'unisex')
    && categoryMatches(productCategory, category)
    && (!collection || collection === 'all' || collections.includes(collection))
    && (!search || text.includes(search));
}

function categoryMatches(productCategory, requestedCategory) {
  const requested = String(requestedCategory || '').toLowerCase();
  const category = String(productCategory || '').toLowerCase();
  if (!requested || requested === 'all') return true;
  const groups = {
    'oversized-tees': ['tees'],
    'heavyweight-tees': ['tees'],
    'baby-tees': ['tees'],
    tees: ['tees'],
    hoodies: ['hoodies'],
    'cropped-hoodies': ['hoodies'],
    'zip-hoodies': ['zip-hoodies', 'hoodies'],
    'cargo-pants': ['cargo-pants', 'pants'],
    sweatpants: ['sweatpants', 'pants'],
    joggers: ['sweatpants', 'pants'],
    pants: ['pants', 'cargo-pants', 'sweatpants'],
    shorts: ['shorts'],
    jackets: ['jackets', 'outerwear'],
    outerwear: ['jackets', 'outerwear'],
    accessories: ['accessories'],
    shoes: ['accessories']
  };
  return (groups[requested] || [requested]).includes(category);
}

module.exports = async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return json(res, 500, { ok: false, error: 'Supabase env is missing' });
  }

  try {
    const limit = Math.min(Number(req.query.limit || 1000), 1000);
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
      return json(res, response.status, { ok: false, error: rows?.message || 'Could not read Supabase products' });
    }
    const products = rows
      .map((row) => row.payload)
      .filter(Boolean)
      .filter((product) => productMatches(product, req.query));
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
