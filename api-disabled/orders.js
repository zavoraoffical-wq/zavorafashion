function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(body));
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_ORDERS_TABLE = process.env.SUPABASE_ORDERS_TABLE || process.env.ORDERS_TABLE || 'orders';
const { db: mongoDb } = require('../lib/auth-lib');

function normalizeOrder(input = {}) {
  const orderId = String(input.orderId || input.order_id || input.id || '').replace(/^#/, '').toUpperCase();
  const email = String(input.email || input.customerEmail || '').trim().toLowerCase();
  const payload = {
    id: orderId,
    email,
    customer: input.customer || input.customerName || input.name || 'Zavora customer',
    payment: input.payment || input.method || 'Pending',
    status: input.status || 'Order confirmed',
    tracking: input.tracking || '',
    total: Number(input.total || 0),
    items: Array.isArray(input.items) ? input.items : [],
    updatedAt: new Date().toISOString(),
    createdAt: input.createdAt || new Date().toISOString()
  };
  return { orderId, email, payload };
}

async function supabase(path, options = {}) {
  const base = SUPABASE_URL.replace(/\/$/, '');
  const table = SUPABASE_ORDERS_TABLE.replace(/^\/+|\/+$/g, '');
  return fetch(`${base}/rest/v1/${table}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
}

module.exports = async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return json(res, 500, { ok: false, error: 'Supabase env is missing' });

  try {
    if (req.method === 'GET') {
      const orderId = String(req.query.orderId || req.query.id || '').replace(/^#/, '').toUpperCase();
      const email = String(req.query.email || '').trim().toLowerCase();
      const filters = [];
      if (orderId) filters.push(`order_id=eq.${encodeURIComponent(orderId)}`);
      if (email) filters.push(`email=eq.${encodeURIComponent(email)}`);
      const query = `?select=*&order=updated_at.desc&limit=100${filters.length ? `&${filters.join('&')}` : ''}`;
      const response = await supabase(query);
      const rows = await response.json().catch(() => []);
      if (!response.ok) return json(res, response.status, { ok: false, error: rows?.message || 'Could not load orders' });
      const orders = rows.map((row) => row.payload || {
        id: row.order_id,
        email: row.email,
        customer: row.customer,
        payment: row.payment,
        status: row.status,
        tracking: row.tracking,
        total: row.total,
        items: row.items || [],
        updatedAt: row.updated_at,
        createdAt: row.created_at
      });
      return json(res, 200, { ok: true, count: orders.length, orders });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const { orderId, email, payload } = normalizeOrder(body);
      if (!orderId || !email) return json(res, 400, { ok: false, error: 'Order ID and email are required' });
      let existing = {};
      try {
        const existingResponse = await supabase(`?select=payload&order_id=eq.${encodeURIComponent(orderId)}&email=eq.${encodeURIComponent(email)}&limit=1`);
        const existingRows = await existingResponse.json().catch(() => []);
        existing = existingRows?.[0]?.payload || {};
      } catch (error) {}
      const mergedPayload = {
        ...existing,
        ...payload,
        customer: payload.customer === 'Zavora customer' ? (existing.customer || payload.customer) : payload.customer,
        payment: payload.payment === 'Pending' ? (existing.payment || payload.payment) : payload.payment,
        total: payload.total || existing.total || 0,
        items: payload.items.length ? payload.items : (existing.items || []),
        createdAt: existing.createdAt || payload.createdAt,
        updatedAt: new Date().toISOString()
      };
      const row = {
        order_id: orderId,
        email,
        customer: mergedPayload.customer,
        payment: mergedPayload.payment,
        status: mergedPayload.status,
        tracking: mergedPayload.tracking,
        total: mergedPayload.total,
        items: mergedPayload.items,
        payload: mergedPayload,
        updated_at: new Date().toISOString()
      };
      const response = await supabase('?on_conflict=order_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(row)
      });
      const data = await response.json().catch(() => []);
      if (!response.ok) return json(res, response.status, { ok: false, error: data?.message || 'Could not save order' });
      try {
        const database = await mongoDb();
        await database.collection('orders').updateOne(
          { id: orderId, email },
          { $set: { ...mergedPayload, id: orderId, email, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date(mergedPayload.createdAt || Date.now()) } },
          { upsert: true }
        );
      } catch (error) {}
      return json(res, 200, { ok: true, order: data?.[0]?.payload || mergedPayload });
    }

    return json(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    return json(res, 500, { ok: false, error: error.message || 'Orders API failed' });
  }
};
