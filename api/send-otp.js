const RESEND_API_URL = 'https://api.resend.com/emails';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOREPLY_FROM_EMAIL || process.env.FROM_EMAIL || 'Zavora No Reply <noreply@zavorafashion.com>';

  if (!apiKey) {
    return json(res, 500, { error: 'RESEND_API_KEY is not configured' });
  }

  let payload = {};
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch (error) {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const to = String(payload.to || '').trim().toLowerCase();
  const otp = String(payload.otp || '').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return json(res, 400, { error: 'Valid recipient email is required' });
  }

  if (!/^\d{6}$/.test(otp)) {
    return json(res, 400, { error: 'Valid 6-digit OTP is required' });
  }

  const safeOtp = escapeHtml(otp);
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:28px;color:#111">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #ddd;padding:28px">
        <p style="letter-spacing:4px;font-weight:700">ZAVORA FASHION</p>
        <h1 style="font-family:Georgia,serif;font-size:36px;line-height:1.05;margin:18px 0">Your verification code</h1>
        <p>Welcome to Zavora Fashion.</p>
        <p>Your verification code is:</p>
        <div style="font-size:34px;letter-spacing:8px;font-weight:800;border:1px solid #c9a227;padding:18px;text-align:center">${safeOtp}</div>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
        <p style="margin-top:28px">Zavora Fashion</p>
      </div>
    </div>
  `;

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Your Zavora Fashion Verification Code',
      html,
      text: `Welcome to Zavora Fashion.\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this code, please ignore this email.\n\nZavora Fashion`
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return json(res, response.status, { error: data.message || 'Could not send OTP email' });
  }

  return json(res, 200, { ok: true, id: data.id });
};
