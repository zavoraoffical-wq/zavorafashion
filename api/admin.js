const login = require('../api-disabled/admin-login');
const verify = require('../api-disabled/admin-verify');
const session = require('../api-disabled/admin-session');
const logout = require('../api-disabled/admin-logout');
const stats = require('../api-disabled/admin-stats');
const orders = require('../api-disabled/orders');
const rewards = require('../api-disabled/rewards');
const autoImportPrintful = require('../api-disabled/auto-import-printful');
const { validAdminSession } = require('../lib/admin-auth');
const { logSecurityEvent, rateLimit, setSecurityHeaders } = require('../lib/security');

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

  return json(req, res, 404, {
    ok: false,
    error: 'Unknown admin action'
  });
};
