const { clearAdminSessionCookies } = require('../lib/admin-auth');

module.exports = function handler(req, res) {
  res.statusCode = 302;
  res.setHeader('Set-Cookie', clearAdminSessionCookies());
  res.setHeader('Location', '/admin-login.html');
  res.end();
};
