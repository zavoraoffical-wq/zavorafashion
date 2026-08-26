const { rateLimit, setSecurityHeaders } = require('../lib/security');
const { ProductRepository } = require('../lib/local-product-engine');

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PRODUCTS_TABLE = process.env.SUPABASE_PRODUCTS_TABLE || process.env.PRODUCTS_TABLE || 'products';
const STOREFRONT_ORIGIN = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'https://www.zavorafashion.com';

function json(req, res, status, body) {
  res.statusCode = status;
  setSecurityHeaders(req, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(body));
}

function requestBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (error) { return {}; }
}

async function fetchWithRetry(url, options, label) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetch(url, { ...options, signal: AbortSignal.timeout(12_000) });
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  throw new Error(`${label} connection failed: ${lastError?.cause?.code || lastError?.message || 'network error'}`);
}

async function paypalAccessToken() {
  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetchWithRetry(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  }, 'PayPal authentication');
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) throw new Error(body.error_description || 'PayPal authentication failed');
  return body.access_token;
}

async function paypalRequest(path, options = {}) {
  const token = await paypalAccessToken();
  const response = await fetchWithRetry(`${PAYPAL_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': options.requestId || `zavora-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...(options.headers || {})
    }
  }, 'PayPal order');
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body.details?.[0]?.description || body.message || `PayPal request failed (${response.status})`;
    const error = new Error(detail);
    error.status = response.status;
    error.debugId = body.debug_id;
    throw error;
  }
  return body;
}

async function verifiedProduct(productId) {
  const safeId = String(productId || '').trim();
  if (!/^[A-Za-z0-9._:-]{1,120}$/.test(safeId)) throw new Error('Invalid product ID');
  let product = null;
  let supabaseError = null;
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const base = SUPABASE_URL.replace(/\/$/, '');
      const table = PRODUCTS_TABLE.replace(/^\/+|\/+$/g, '');
      const params = new URLSearchParams({
        select: 'printful_id,store_product_id,name,price,payload',
        or: `(printful_id.eq.${safeId},store_product_id.eq.${safeId})`,
        limit: '1'
      });
      const response = await fetchWithRetry(`${base}/rest/v1/${table}?${params.toString()}`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: 'application/json' }
      }, 'Product database');
      const rows = await response.json().catch(() => []);
      const row = Array.isArray(rows) ? rows[0] : null;
      if (response.ok && row) {
        const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
        product = { ...row, ...payload };
      }
    } catch (error) {
      supabaseError = error;
    }
  }
  if (!product) {
    try {
      const params = new URLSearchParams({ id: safeId, limit: '1' });
      const response = await fetchWithRetry(`${STOREFRONT_ORIGIN}/api/products?${params.toString()}`, {
        headers: { Accept: 'application/json' }
      }, 'Storefront catalog');
      const body = await response.json().catch(() => ({}));
      if (response.ok) product = body.product || body.products?.[0] || null;
    } catch (error) {}
  }
  if (!product) product = await ProductRepository.getProductById(safeId).catch(() => null);
  if (!product) throw new Error(supabaseError?.message || `Product ${safeId} is unavailable`);
  const price = Number(product.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error(`Product ${safeId} has an invalid price`);
  return { id: safeId, name: String(product.name || 'Zavora product').slice(0, 127), price };
}

async function createOrder(body) {
  const items = Array.isArray(body.items) ? body.items.slice(0, 25) : [];
  if (!items.length) throw new Error('Your bag is empty');
  const verified = await Promise.all(items.map(async (item) => {
    const product = await verifiedProduct(item.printfulId || item.productId || item.id);
    const quantity = Math.max(1, Math.min(10, Math.floor(Number(item.qty || item.quantity || 1))));
    return { ...product, quantity };
  }));
  const subtotal = verified.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const requestedShipping = Number(body.shipping || 0);
  const shipping = [0, 6.99, 14.99].includes(requestedShipping) ? requestedShipping : 0;
  const couponCode = String(body.couponCode || '').trim().toUpperCase();
  const discount = couponCode === 'WELCOME10' && subtotal >= 49
    ? 10
    : (couponCode === 'SUMMER15' ? subtotal * 0.15 : 0);
  const total = subtotal + shipping - discount;

  return paypalRequest('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        description: 'Zavora Fashion Order',
        amount: {
          currency_code: 'USD',
          value: total.toFixed(2),
          breakdown: {
            item_total: { currency_code: 'USD', value: subtotal.toFixed(2) },
            shipping: { currency_code: 'USD', value: shipping.toFixed(2) },
            discount: { currency_code: 'USD', value: discount.toFixed(2) }
          }
        },
        items: verified.map(item => ({
          name: item.name,
          quantity: String(item.quantity),
          unit_amount: { currency_code: 'USD', value: item.price.toFixed(2) }
        }))
      }],
      application_context: {
        brand_name: 'Zavora Fashion',
        shipping_preference: 'GET_FROM_FILE',
        user_action: 'PAY_NOW'
      }
    })
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(req, res, 405, { ok: false, error: 'Method not allowed' });
  if (!rateLimit(req, res, 'paypal-checkout', { windowMs: 60_000, max: 20 })) return;
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    return json(req, res, 503, { ok: false, error: 'PayPal checkout is not configured' });
  }
  try {
    const action = String(req.query.action || '').toLowerCase();
    const body = requestBody(req);
    if (action === 'create') {
      const order = await createOrder(body);
      return json(req, res, 200, { ok: true, id: order.id, status: order.status });
    }
    if (action === 'capture') {
      const orderId = String(body.orderId || '').trim();
      if (!/^[A-Z0-9]{8,30}$/i.test(orderId)) return json(req, res, 400, { ok: false, error: 'Invalid PayPal order ID' });
      const capture = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
        method: 'POST',
        body: '{}'
      });
      return json(req, res, 200, { ok: true, id: capture.id, status: capture.status });
    }
    return json(req, res, 400, { ok: false, error: 'Unknown PayPal action' });
  } catch (error) {
    return json(req, res, error.status >= 400 && error.status < 500 ? error.status : 502, {
      ok: false,
      error: error.message || 'PayPal checkout failed',
      debugId: error.debugId || undefined
    });
  }
};
