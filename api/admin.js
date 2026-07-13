const login = require('../api-disabled/admin-login');
const verify = require('../api-disabled/admin-verify');
const session = require('../api-disabled/admin-session');
const logout = require('../api-disabled/admin-logout');
const stats = require('../api-disabled/admin-stats');
const orders = require('../api-disabled/orders');
const autoImportPrintful = require('../api-disabled/auto-import-printful');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  const action = String(req.query.action || '').trim();

  if (action === 'login') return login(req, res);
  if (action === 'verify') return verify(req, res);
  if (action === 'session') return session(req, res);
  if (action === 'logout') return logout(req, res);
  if (action === 'stats') return stats(req, res);
  if (action === 'orders') return orders(req, res);
  if (action === 'auto-import-printful') return autoImportPrintful(req, res);

  return json(res, 404, {
    ok: false,
    error: 'Unknown admin action'
  });
};
