module.exports = function handler(req, res) {
  res.statusCode = 302;
  res.setHeader('Set-Cookie', 'admin_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  res.setHeader('Location', '/admin-login.html');
  res.end();
};
