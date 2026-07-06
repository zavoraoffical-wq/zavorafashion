const crypto = require('crypto');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    if (typeof req.body === 'string') return resolve(req.body);
    if (Buffer.isBuffer(req.body)) return resolve(req.body.toString('utf8'));
    if (req.body && typeof req.body === 'object') return resolve(JSON.stringify(req.body));

    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyApliiqSignature(rawBody, signature) {
  const secret = process.env.APLIIQ_SHARED_SECRET;
  if (!secret) return false;

  const base64Payload = Buffer.from(rawBody, 'utf8').toString('base64');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(base64Payload)
    .digest('base64');

  return safeEqual(signature, expected);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers['x-apliiq-hmac'];

  if (!verifyApliiqSignature(rawBody, signature)) {
    return json(res, 401, { error: 'Invalid Apliiq signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    return json(res, 400, { error: 'Invalid JSON payload' });
  }

  const fulfillment = payload.fulfillment || {};
  console.log('Apliiq fulfillment update', {
    orderId: fulfillment.order_id,
    status: fulfillment.status,
    trackingCompany: fulfillment.tracking_company,
    trackingNumbers: fulfillment.tracking_numbers || []
  });

  return json(res, 200, {
    ok: true,
    orderId: fulfillment.order_id || null,
    status: fulfillment.status || null
  });
};
