const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    return json(res, 500, { error: 'Missing RESEND_API_KEY' });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (error) {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const to = String(body.to || '').trim().toLowerCase();
  if (!isEmail(to)) {
    return json(res, 400, { error: 'Valid email is required' });
  }

  const origin = req.headers.origin || process.env.SITE_URL || 'https://zavorafashion.com';
  const resetUrl = `${origin.replace(/\/$/, '')}/forgot-password.html?reset=sent`;
  const from = process.env.PASSWORD_RESET_EMAIL || process.env.NOREPLY_FROM_EMAIL || 'Zavora No Reply <noreply@zavorafashion.com>';

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'Reset your Zavora Fashion password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#111;line-height:1.6">
          <h1 style="font-family:Georgia,serif;font-size:34px;margin-bottom:8px">Reset your password</h1>
          <p>We received a request to reset the password for your Zavora Fashion account.</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 24px;letter-spacing:2px;text-transform:uppercase">
              Reset Password
            </a>
          </p>
          <p>This secure reset link is demo-ready for your website flow. If you did not request this, you can ignore this email.</p>
          <p style="color:#666">Need help? Contact support@zavorafashion.com.</p>
          <p>Zavora Fashion Support</p>
        </div>
      `,
      text: `Reset your Zavora Fashion password: ${resetUrl}\n\nIf you did not request this, ignore this email.\nNeed help? support@zavorafashion.com`
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json(res, response.status, { error: data.message || 'Resend request failed' });
  }

  return json(res, 200, { ok: true, id: data.id });
};
