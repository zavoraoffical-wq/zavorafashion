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

function senderFromEnv() {
  const configured = process.env.WELCOME_EMAIL || process.env.HELLO_EMAIL;
  if (!configured) return 'Zavora Fashion <hello@zavorafashion.com>';
  return configured.includes('<') ? configured : `Zavora Fashion <${configured}>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
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
  const name = escapeHtml(payload.name || 'Zavora member');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return json(res, 400, { error: 'Valid recipient email is required' });
  }

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:28px;color:#111">
      <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #ddd;padding:30px">
        <p style="letter-spacing:4px;font-weight:700">ZAVORA FASHION</p>
        <h1 style="font-family:Georgia,serif;font-size:38px;line-height:1.05;margin:18px 0">Welcome to Zavora Fashion.</h1>
        <p>Hello ${name},</p>
        <p>Your account is verified. You can now save wishlist pieces, track orders, use faster checkout, and receive private drop access.</p>
        <p style="border-top:1px solid #ddd;padding-top:18px;margin-top:24px">Designed in the USA. Crafted for Everyday Luxury.</p>
        <p>Zavora Fashion</p>
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
      from: senderFromEnv(),
      to,
      subject: 'Welcome to Zavora Fashion',
      html,
      text: `Hello ${payload.name || 'Zavora member'},\n\nYour account is verified. Welcome to Zavora Fashion.\n\nDesigned in the USA. Crafted for Everyday Luxury.\n\nZavora Fashion`
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json(res, response.status, { error: data.message || 'Could not send welcome email' });
  }

  return json(res, 200, { ok: true, id: data.id });
};
