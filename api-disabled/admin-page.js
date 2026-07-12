const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function secret() {
  return process.env.ADMIN_AUTH_SECRET || process.env.RESEND_API_KEY || 'zavora-admin-demo-secret';
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((item) => {
    const [key, ...rest] = item.trim().split('=');
    return [key, rest.join('=')];
  }).filter(([key]) => key));
}

function validSession(raw) {
  if (!raw) return false;
  let payload = {};
  try {
    payload = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch (error) {
    return false;
  }
  const email = String(payload.email || '').trim().toLowerCase();
  const expiresAt = Number(payload.expiresAt || 0);
  const signature = String(payload.signature || '');
  if (!email || !expiresAt || Date.now() > expiresAt) return false;
  const expected = sign(`${email}:${expiresAt}:admin`);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  if (!validSession(cookies.admin_session)) {
    res.statusCode = 302;
    res.setHeader('Location', '/admin-login.html');
    res.end();
    return;
  }

  const filePath = path.join(process.cwd(), 'dist', 'admin.html');
  const html = fs.readFileSync(filePath, 'utf8');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(html);
};
