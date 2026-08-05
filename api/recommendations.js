const productsHandler = require('./products');

module.exports = async function handler(req, res) {
  req.query = req.query || {};
  req.query.action = 'recommendations';
  return productsHandler(req, res);
};
