const { registerAiInventoryRoutes } = require('../scripts/registerAiInventoryRoutes');
const { registerCommerceRoutes } = require('../scripts/registerCommerceRoutes');

/** Local /api AI + hamper routes run Firebase http-functions shared modules, not Netlify. */
module.exports = function setupProxy(app) {
  registerAiInventoryRoutes(app);
  registerCommerceRoutes(app);
};
