const login = require('../api-disabled/admin-login');
const verify = require('../api-disabled/admin-verify');
const session = require('../api-disabled/admin-session');
const logout = require('../api-disabled/admin-logout');
const stats = require('../api-disabled/admin-stats');
const orders = require('../api-disabled/orders');
const rewards = require('../api-disabled/rewards');
const autoImportPrintful = require('../api-disabled/auto-import-printful');
const affiliateApprovalEmail = require('../api-disabled/affiliate-approval-email');
const { validAdminSession } = require('../lib/admin-auth');
const { cleanString, logSecurityEvent, rateLimit, setSecurityHeaders } = require('../lib/security');
const { db, parseBody } = require('../lib/auth-lib');

function json(req, res, status, body) {
  res.statusCode = status;
  setSecurityHeaders(req, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(body));
}

function cronAuthorized(req) {
  const configured = process.env.CRON_SECRET || '';
  if (!configured) return false;
  const supplied = String(req.headers['x-cron-secret'] || req.query.secret || '');
  return Boolean(supplied && supplied === configured);
}

function publicAffiliate(app) {
  if (!app) return null;
  return { ...app };
}

async function affiliateAdmin(req, res) {
  const database = await db();
  const collection = database.collection('affiliates');
  if (req.method === 'GET') {
    const apps = await collection.find({}).sort({ createdAt: -1 }).limit(500).toArray();
    return json(req, res, 200, { ok: true, apps: apps.map(publicAffiliate) });
  }
  if (req.method !== 'POST') return json(req, res, 405, { ok: false, error: 'Method not allowed' });
  const body = parseBody(req);
  const mode = cleanString(body.mode || 'save', 40);
  const id = cleanString(body.id || body.app?.id || body.app?._id || '', 120);
  if (!id) return json(req, res, 400, { ok: false, error: 'Affiliate ID is required' });
  if (mode === 'delete') {
    await collection.deleteOne({ _id: id });
    return json(req, res, 200, { ok: true });
  }
  const app = body.app && typeof body.app === 'object' ? body.app : {};
  const safe = {
    ...app,
    _id: id,
    id,
    fullName: cleanString(app.fullName || app.name || 'Affiliate', 120),
    email: String(app.email || '').trim().toLowerCase(),
    phone: cleanString(app.phone || '', 40),
    country: cleanString(app.country || '', 80),
    website: cleanString(app.website || '', 220),
    instagram: cleanString(app.instagram || '', 160),
    youtube: cleanString(app.youtube || '', 160),
    tiktok: cleanString(app.tiktok || '', 160),
    pinterest: cleanString(app.pinterest || '', 160),
    facebook: cleanString(app.facebook || '', 160),
    x: cleanString(app.x || '', 160),
    status: cleanString(app.status || 'pending', 40),
    affiliateId: cleanString(app.affiliateId || '', 80),
    password: cleanString(app.password || '', 140),
    coupon: cleanString(app.coupon || '', 80),
    link: cleanString(app.link || '', 260),
    promotionMethod: cleanString(app.promotionMethod || '', 180),
    commission: Math.max(1, Math.min(50, Number(app.commission || 10))),
    updatedAt: new Date().toISOString()
  };
  await collection.updateOne({ _id: id }, { $set: safe }, { upsert: true });
  return json(req, res, 200, { ok: true, app: safe });
}

module.exports = async function handler(req, res) {
  setSecurityHeaders(req, res);
  if (!rateLimit(req, res, 'admin-api', { windowMs: 60_000, max: 60 })) return;
  const action = String(req.query.action || '').trim();
  const publicActions = new Set(['login', 'verify', 'session', 'logout', 'orders', 'rewards']);
  const hasAdmin = Boolean(validAdminSession(req));
  if (!publicActions.has(action) && !hasAdmin && !(action === 'auto-import-printful' && cronAuthorized(req))) {
    logSecurityEvent(req, 'admin_action_denied', { action });
    return json(req, res, 401, { ok: false, error: 'Admin authentication required' });
  }

  if (action === 'login') return login(req, res);
  if (action === 'verify') return verify(req, res);
  if (action === 'session') return session(req, res);
  if (action === 'logout') return logout(req, res);
  if (action === 'stats') return stats(req, res);
  if (action === 'orders') return orders(req, res);
  if (action === 'rewards') return rewards(req, res);
  if (action === 'auto-import-printful') return autoImportPrintful(req, res);
  if (action === 'affiliate-approval-email') return affiliateApprovalEmail(req, res);
  if (action === 'affiliates') return affiliateAdmin(req, res);

  return json(req, res, 404, {
    ok: false,
    error: 'Unknown admin action'
  });
};
