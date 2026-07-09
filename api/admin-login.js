const crypto = require('crypto');

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function secret() {
  return process.env.ADMIN_AUTH_SECRET || process.env.RESEND_API_KEY || 'zavora-admin-demo-secret';
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

function verifiedSender(value) {
  const fallback = 'Zavora Admin <noreply@zavorafashion.com>';
  const sender = String(value || '').trim();
  if (!sender) return fallback;
  const match = sender.match(/<([^>]+)>/) || sender.match(/([^\s<>]+@[^\s<>]+)/);
  const email = String(match?.[1] || '').toLowerCase();
  return email.endsWith('@zavorafashion.com') ? sender : fallback;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (error) {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const adminEmail = String(process.env.ADMIN_EMAIL || 'kitchenwala1@gmail.com').trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || '');

  if (!adminEmail || !adminPassword) return json(res, 500, { error: 'Admin env is not configured' });
  if (email !== adminEmail || password !== adminPassword) return json(res, 401, { error: 'Invalid admin credentials' });
  if (!process.env.RESEND_API_KEY) return json(res, 500, { error: 'Missing RESEND_API_KEY' });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const challenge = Buffer.from(JSON.stringify({
    email,
    expiresAt,
    hash: sign(`${email}:${otp}:${expiresAt}`)
  })).toString('base64url');

  const from = verifiedSender(process.env.ADMIN_OTP_EMAIL || process.env.NOREPLY_FROM_EMAIL);
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: 'Zavora Admin Login OTP',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#111;line-height:1.6">
          <h1 style="font-family:Georgia,serif;font-size:34px;margin-bottom:8px">Admin login code</h1>
          <p>Use this one-time code to access the hidden Zavora Fashion admin control center.</p>
          <p style="font-size:34px;letter-spacing:8px;font-weight:800">${otp}</p>
          <p>This code expires in 10 minutes. If you did not request it, please secure your admin password.</p>
          <p>Zavora Fashion Support</p>
        </div>
      `,
      text: `Your Zavora Admin OTP is ${otp}. This code expires in 10 minutes.`
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) return json(res, response.status, { error: data.message || 'OTP email failed' });

  return json(res, 200, { ok: true, challenge });
};
