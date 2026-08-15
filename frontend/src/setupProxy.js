const { registerAiInventoryRoutes } = require('../scripts/registerAiInventoryRoutes');

module.exports = function setupProxy(app) {
  registerAiInventoryRoutes(app);
};
