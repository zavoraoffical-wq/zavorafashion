module.exports = function handler(req, res) {
  res.statusCode = 302;
  res.setHeader('Set-Cookie', [
    'admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0; Priority=High',
    'admin_otp_verified=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0; Priority=High'
  ]);
  res.setHeader('Location', '/admin-login.html');
  res.end();
};
