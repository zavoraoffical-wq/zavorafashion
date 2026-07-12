const { clearSessionCookie, json } = require('../lib/auth-lib');

module.exports = async function handler(req, res) {
  clearSessionCookie(req, res);
  if (req.method === 'GET') {
    res.statusCode = 302;
    res.setHeader('Location', '/login.html');
    return res.end();
  }
  return json(res, 200, { ok: true });
};
