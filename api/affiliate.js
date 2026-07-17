const crypto = require('crypto');
const { cleanString, rateLimit, setSecurityHeaders, validateEmail } = require('../lib/security');
const { db, json, parseBody } = require('../lib/auth-lib');

function affiliateId(app) {
  return app.affiliateId || `ZAF-${String(app.email || app.id || Date.now()).replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}${String(Date.now()).slice(-4)}`;
}

function publicAffiliate(app) {
  if (!app) return null;
  const { password, ...safe } = app;
  return safe;
}

function normalizeApplication(body = {}) {
  return {
    fullName: cleanString(body.fullName || body.name || '', 120),
    email: String(body.email || '').trim().toLowerCase(),
    phone: cleanString(body.phone || '', 40),
    country: cleanString(body.country || '', 80),
    website: cleanString(body.website || '', 220),
    instagram: cleanString(body.instagram || '', 160),
    youtube: cleanString(body.youtube || '', 160),
    tiktok: cleanString(body.tiktok || '', 160),
    pinterest: cleanString(body.pinterest || '', 160),
    facebook: cleanString(body.facebook || '', 160),
    x: cleanString(body.x || '', 160),
    followers: cleanString(body.followers || '', 80),
    monthlyTraffic: cleanString(body.monthlyTraffic || '', 80),
    promotionMethod: cleanString(body.promotionMethod || '', 180),
    reason: cleanString(body.reason || body.why || '', 1200)
  };
}

module.exports = async function handler(req, res) {
  setSecurityHeaders(req, res);
  if (!rateLimit(req, res, 'affiliate-api', { windowMs: 60_000, max: 40 })) return;

  const action = String(req.query.action || '').trim();
  const database = await db();
  const collection = database.collection('affiliates');

  if (req.method === 'POST' && action === 'apply') {
    const body = parseBody(req);
    if (!body.agree) return json(res, 400, { ok: false, error: 'Agree to terms before applying.' });
    const app = normalizeApplication(body);
    if (!validateEmail(app.email)) return json(res, 400, { ok: false, error: 'Valid email is required.' });
    if (!app.fullName) return json(res, 400, { ok: false, error: 'Full name is required.' });

    const existing = await collection.findOne({ email: app.email });
    if (existing) {
      return json(res, 200, {
        ok: true,
        exists: true,
        app: publicAffiliate(existing),
        message: `Application already exists with status: ${existing.status || 'pending'}.`
      });
    }

    const id = `AFF-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const record = {
      ...app,
      _id: id,
      id,
      status: 'pending',
      commission: 10,
      clicks: 0,
      orders: 0,
      revenue: 0,
      pendingBalance: 0,
      paidBalance: 0,
      availableBalance: 0,
      approvedBalance: 0,
      lifetimeRevenue: 0,
      lifetimeCommission: 0,
      referralLinks: [],
      coupons: [],
      payoutRequests: [],
      notifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await collection.insertOne(record);
    return json(res, 200, { ok: true, app: publicAffiliate(record) });
  }

  if (req.method === 'POST' && action === 'login') {
    const body = parseBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();
    if (!validateEmail(email) || !password) return json(res, 400, { ok: false, error: 'Email and password are required.' });
    const app = await collection.findOne({ email });
    if (!app || app.status !== 'approved') return json(res, 401, { ok: false, error: 'Affiliate account is not approved yet.' });
    if (!app.password || String(app.password).trim() !== password) return json(res, 401, { ok: false, error: 'Invalid affiliate credentials.' });
    await collection.updateOne({ _id: app._id }, { $set: { lastLoginAt: new Date().toISOString() } });
    return json(res, 200, { ok: true, app: publicAffiliate(app) });
  }

  return json(res, 404, { ok: false, error: 'Unknown affiliate action' });
};
