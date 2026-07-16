function json(res, status, body) {
  res.statusCode = status;
  require('../lib/security').setSecurityHeaders({ headers: {} }, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(body));
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_PRODUCTS_TABLE = process.env.SUPABASE_PRODUCTS_TABLE || process.env.PRODUCTS_TABLE || 'products';
const SUPABASE_ORDERS_TABLE = process.env.SUPABASE_ORDERS_TABLE || process.env.ORDERS_TABLE || 'orders';
const { db: mongoDb } = require('../lib/auth-lib');
const { logSecurityEvent } = require('../lib/security');

function countBy(products, getter) {
  return products.reduce((acc, product) => {
    const key = getter(product) || 'uncategorized';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

module.exports = async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return json(res, 500, { ok: false, error: 'Supabase env is missing' });
  }

  try {
    const base = SUPABASE_URL.replace(/\/$/, '');
    const table = SUPABASE_PRODUCTS_TABLE.replace(/^\/+|\/+$/g, '');
    const response = await fetch(`${base}/rest/v1/${table}?select=payload,updated_at&order=updated_at.desc&limit=1000`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: 'application/json'
      }
    });
    const rows = await response.json().catch(() => []);
    const productRows = response.ok && Array.isArray(rows) ? rows : [];
    const products = productRows.map((row) => row.payload).filter(Boolean);
    const orders = await loadOrders(base);
    const mongoStats = await loadMongoStats();
    const totalValue = products.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const lowStock = products.filter((item) => Number(item.stock || 5) <= 5).length;
    return json(res, 200, {
      ok: true,
      updatedAt: new Date().toISOString(),
      products: products.length,
      categories: countBy(products, (item) => item.category),
      genders: countBy(products, (item) => item.gender),
      customers: mongoStats.customers,
      rewardClaims: mongoStats.rewardClaims,
      lowStock,
      revenuePreview: Math.round(totalValue * 2.7),
      topProducts: products.slice(0, 8).map((item, index) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        sold: 220 - index * 17
      })),
      orders
    });
  } catch (error) {
    logSecurityEvent(req, 'admin_stats_error', { message: error.message });
    return json(res, 500, { ok: false, error: 'Could not load admin stats' });
  }
};

async function loadOrders(base) {
  try {
    const table = SUPABASE_ORDERS_TABLE.replace(/^\/+|\/+$/g, '');
    const response = await fetch(`${base}/rest/v1/${table}?select=*&order=updated_at.desc&limit=20`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: 'application/json'
      }
    });
    const rows = await response.json().catch(() => []);
    if (!response.ok || !Array.isArray(rows)) return [];
    return rows.map((row) => row.payload || {
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
  } catch (error) {
    return [];
  }
}

async function loadMongoStats() {
  try {
    const database = await mongoDb();
    const customers = await database.collection('users').countDocuments();
    const rewardRows = await database.collection('rewards')
      .find({})
      .sort({ updatedAt: -1, redeemedAt: -1, createdAt: -1 })
      .limit(20)
      .toArray();
    return {
      customers,
      rewardClaims: rewardRows.map((reward) => ({
        rewardId: reward.rewardId,
        orderId: reward.orderId,
        email: reward.email,
        name: reward.claimedBy?.name || '',
        status: reward.status,
        amount: reward.amount || 10,
        redeemedAt: reward.redeemedAt,
        availableAt: reward.availableAt,
        updatedAt: reward.updatedAt
      }))
    };
  } catch (error) {
    return { customers: 0, rewardClaims: [] };
  }
}
