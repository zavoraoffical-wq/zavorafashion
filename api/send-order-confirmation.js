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

function money(value) {
  return `$${Number(value || 0).toLocaleString('en-US')}`;
}

function senderFromEnv() {
  const configured = process.env.ORDER_FROM_EMAIL || process.env.ORDERS_EMAIL || 'orders@zavorafashion.com';
  return configured.includes('<') ? configured : `Zavora Orders <${configured}>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return json(res, 500, { error: 'RESEND_API_KEY is not configured' });

  let payload = {};
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch (error) {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const to = String(payload.to || payload.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return json(res, 400, { error: 'Valid recipient email is required' });
  }

  const orderId = escapeHtml(payload.orderId || 'ZAV-2026-READY');
  const method = escapeHtml(payload.method || 'PayPal');
  const total = money(payload.total || 0);
  const items = Array.isArray(payload.items) ? payload.items.slice(0, 8) : [];
  const trackUrl = `${String(req.headers.origin || process.env.SITE_URL || 'https://zavorafashion.com').replace(/\/$/, '')}/track-order.html?order=${encodeURIComponent(orderId)}&email=${encodeURIComponent(to)}`;
  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #ddd">${escapeHtml(item.name || 'Zavora Product')}</td>
      <td style="padding:12px 0;border-bottom:1px solid #ddd;text-align:center">${escapeHtml(item.qty || 1)}</td>
      <td style="padding:12px 0;border-bottom:1px solid #ddd;text-align:right">${money(item.price || 0)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:28px;color:#111">
      <div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #ddd;padding:30px">
        <p style="letter-spacing:4px;font-weight:700">ZAVORA FASHION</p>
        <h1 style="font-family:Georgia,serif;font-size:38px;line-height:1.05;margin:18px 0">Order received.</h1>
        <p>Your order <strong>#${orderId}</strong> has been confirmed.</p>
        <p><strong>Payment method:</strong> ${method}<br><strong>Total:</strong> ${total}</p>
        <table style="width:100%;border-collapse:collapse;margin:22px 0">
          <thead><tr><th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Price</th></tr></thead>
          <tbody>${itemRows || '<tr><td style="padding:12px 0">Zavora order</td><td>1</td><td style="text-align:right">$0</td></tr>'}</tbody>
        </table>
        <p>
          <a href="${trackUrl}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 22px;letter-spacing:2px;text-transform:uppercase">
            Track Order
          </a>
        </p>
        <p style="border-top:1px solid #ddd;padding-top:18px;margin-top:24px">Designed in the USA. Crafted for Everyday Luxury.</p>
        <p>Zavora Orders</p>
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
      subject: `Zavora Fashion order received #${orderId}`,
      html,
      text: `Your Zavora Fashion order #${orderId} has been confirmed.\nPayment method: ${method}\nTotal: ${total}\nTrack: ${trackUrl}`
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) return json(res, response.status, { error: data.message || 'Could not send order email' });

  return json(res, 200, { ok: true, id: data.id });
};
