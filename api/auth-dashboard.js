const { db, getSessionUser, json, publicUser } = require('../lib/auth-lib');

module.exports = async function handler(req, res) {
  try {
    const user = await getSessionUser(req);
    if (!user) return json(res, 401, { error: 'Login required' });
    const database = await db();
    const orders = await database.collection('orders').find({ email: user.email }).sort({ createdAt: -1 }).limit(25).toArray().catch(() => []);
    const rewards = await database.collection('rewards').find({ email: user.email }).sort({ createdAt: -1 }).limit(50).toArray().catch(() => []);
    const rewardByOrder = new Map(rewards.map((reward) => [String(reward.orderId || ''), reward]));
    const ordersWithRewards = orders.map((order) => {
      const reward = rewardByOrder.get(String(order.id || ''));
      return reward ? { ...order, rewardId: reward.rewardId, rewardStatus: reward.status, rewardAvailableAt: reward.availableAt } : order;
    });
    const wishlist = await database.collection('wishlists').find({ email: user.email }).limit(50).toArray().catch(() => []);
    const addresses = await database.collection('addresses').find({ email: user.email }).limit(10).toArray().catch(() => []);
    return json(res, 200, {
      ok: true,
      user: publicUser(user),
      orders: ordersWithRewards,
      rewards,
      wishlist,
      addresses
    });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Dashboard load failed' });
  }
};
