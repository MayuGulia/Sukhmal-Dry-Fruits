const { registerAiInventoryRoutes } = require('../scripts/registerAiInventoryRoutes');
const { registerCommerceRoutes } = require('../scripts/registerCommerceRoutes');

module.exports = function setupProxy(app) {
  registerAiInventoryRoutes(app);
  registerCommerceRoutes(app);
};
