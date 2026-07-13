const crypto = require('crypto');
const { db, getSessionUser, json, parseBody } = require('../lib/auth-lib');

function rewardCode() {
  return `ZVR-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

function rewardSender() {
  const configured = process.env.REWARDS_FROM_EMAIL || process.env.NOREPLY_FROM_EMAIL || 'noreply@zavorafashion.com';
  return configured.includes('<') ? configured : `Zavora Rewards <${configured}>`;
}

async function sendRewardClaimEmail(user, reward) {
  if (!process.env.RESEND_API_KEY || !user?.email) return false;
  const html = `
    <div style="font-family:Arial,sans-serif;background:#f5f5f5;padding:28px;color:#111">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #ddd;padding:30px">
        <p style="letter-spacing:4px;font-weight:700">ZAVORA FASHION</p>
        <h1 style="font-family:Georgia,serif;font-size:38px;line-height:1.05;margin:18px 0">Wow, offer claimed.</h1>
        <p>Your $10 Zavora Store Credit has been added to your account wallet.</p>
        <p><strong>Reward ID:</strong> ${reward.rewardId}<br><strong>Credit:</strong> $10</p>
        <p>Use your wallet credit on your next Zavora Fashion order.</p>
      </div>
    </div>
  `;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: rewardSender(),
      to: user.email,
      subject: 'Wow, your Zavora offer was claimed',
      html,
      text: `Wow, offer claimed. $10 Zavora Store Credit has been added to your account. Reward ID: ${reward.rewardId}`
    })
  });
  return response.ok;
}

module.exports = async function handler(req, res) {
  const user = await getSessionUser(req);
  if (!user) return json(res, 401, { ok: false, error: 'LOGIN_REQUIRED' });

  const database = await db();
  const rewards = database.collection('rewards');
  const wallet = database.collection('wallet_ledger');

  if (req.method === 'GET') {
    const rows = await rewards.find({ userId: String(user._id) }).sort({ createdAt: -1 }).limit(50).toArray();
    const balanceRows = await wallet.find({ userId: String(user._id) }).toArray();
    const balance = balanceRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return json(res, 200, { ok: true, balance, rewards: rows });
  }

  if (req.method === 'POST') {
    const body = parseBody(req);
    const rewardId = String(body.rewardId || '').trim().toUpperCase();
    if (!rewardId) return json(res, 400, { ok: false, error: 'Reward ID is required' });
    const reward = await rewards.findOne({ rewardId, userId: String(user._id) });
    if (!reward) return json(res, 404, { ok: false, error: 'Reward not found for this account' });
    if (['invalid', 'cancelled', 'returned', 'refunded'].includes(reward.status)) {
      return json(res, 409, { ok: false, error: 'This reward is no longer valid' });
    }
    if (reward.redeemedAt) return json(res, 409, { ok: false, error: 'Reward already redeemed' });
    if (reward.availableAt && new Date(reward.availableAt) > new Date()) {
      return json(res, 409, { ok: false, error: 'Reward unlocks 24 hours after delivery' });
    }
    const redeemedAt = new Date();
    await rewards.updateOne({ _id: reward._id }, {
      $set: {
        status: 'redeemed',
        redeemedAt,
        claimedBy: { userId: String(user._id), email: user.email, name: user.name || 'Zavora Customer' },
        updatedAt: redeemedAt
      }
    });
    await wallet.insertOne({
      userId: String(user._id),
      email: user.email,
      rewardId,
      amount: 10,
      type: 'launch_store_credit',
      createdAt: new Date()
    });
    const emailSent = await sendRewardClaimEmail(user, { ...reward, redeemedAt });
    const balanceRows = await wallet.find({ userId: String(user._id) }).toArray();
    const balance = balanceRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return json(res, 200, { ok: true, balance, credit: 10, emailSent });
  }

  return json(res, 405, { ok: false, error: 'Method not allowed' });
};

module.exports.createOrUpdateRewardForOrder = async function createOrUpdateRewardForOrder(order) {
  if (!order?.email || !order?.id) return;
  const status = String(order.status || '').toLowerCase();
  const total = Number(order.total || 0);
  const database = await db();
  const rewards = database.collection('rewards');
  const users = database.collection('users');
  const user = await users.findOne({ email: String(order.email).toLowerCase() });
  if (!user) return;
  const query = { orderId: order.id, userId: String(user._id) };
  if (/(cancel|return|refund)/.test(status)) {
    await rewards.updateOne(query, { $set: { status: 'invalid', invalidatedAt: new Date(), updatedAt: new Date() } });
    return;
  }
  if (!status.includes('delivered') || total < 100) return;
  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : new Date();
  await rewards.updateOne(
    query,
    {
      $setOnInsert: {
        rewardId: rewardCode(),
        orderId: order.id,
        userId: String(user._id),
        email: user.email,
        amount: 10,
        createdAt: new Date()
      },
      $set: {
        status: 'ready',
        availableAt: new Date(deliveredAt.getTime() + 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
};
