const changePassword = require('../api-disabled/auth-change-password');
const dashboard = require('../api-disabled/auth-dashboard');
const forgotStart = require('../api-disabled/auth-forgot-start');
const login = require('../api-disabled/auth-login');
const logout = require('../api-disabled/auth-logout');
const session = require('../api-disabled/auth-session');
const start = require('../api-disabled/auth-start');
const updateProfile = require('../api-disabled/auth-update-profile');
const verifyOtp = require('../api-disabled/auth-verify-otp');
const newsletter = require('../api-disabled/send-newsletter-confirmation');
const { setSecurityHeaders } = require('../lib/security');
const { json } = require('../lib/auth-lib');

const handlers = {
  'change-password': changePassword,
  dashboard,
  'forgot-start': forgotStart,
  login,
  logout,
  session,
  start,
  newsletter,
  'update-profile': updateProfile,
  'verify-otp': verifyOtp
};

module.exports = async function handler(req, res) {
  setSecurityHeaders(req, res);
  const action = String(req.query.action || '').trim();
  const actionHandler = handlers[action];
  if (!actionHandler) return json(res, 404, { error: 'Unknown auth action' });
  return actionHandler(req, res);
};
