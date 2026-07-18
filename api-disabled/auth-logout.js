const { clearSessionCookie, json } = require('../lib/auth-lib');
const { rateLimit } = require('../lib/security');

module.exports = async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return json(res, 405, { error: 'Method not allowed' });
  if (!rateLimit(req, res, 'auth-logout', { windowMs: 60_000, max: 30 })) return;
  clearSessionCookie(req, res);
  if (req.method === 'GET') {
    res.statusCode = 302;
    res.setHeader('Location', '/login.html');
    return res.end();
  }
  return json(res, 200, { ok: true });
};
