const { validAdminSession } = require('../lib/admin-auth');
const { setSecurityHeaders } = require('../lib/security');

function json(req, res, status, body) {
  res.statusCode = status;
  setSecurityHeaders(req, res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(body));
}

module.exports = function handler(req, res) {
  const session = validAdminSession(req);
  return json(req, res, 200, { ok: Boolean(session), session });
};
