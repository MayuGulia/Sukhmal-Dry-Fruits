/**
 * HTTP APIs on Firebase Functions v2 (codebase: http).
 * Deployed alongside (not replacing) live Netlify functions.
 * Does not export default-codebase functions (hamper onCall, webhook, order triggers).
 */
exports.subscribe = require('./http/subscribe').subscribe;
exports.enquiryBulk = require('./http/enquiryBulk').enquiryBulk;
exports.sitemap = require('./http/sitemap').sitemap;
exports.trackOrder = require('./http/trackOrder').trackOrder;
exports.aiChat = require('./http/aiChat').aiChat;
exports.aiInventory = require('./http/aiInventory').aiInventory;
exports.generateHamperImageHttp = require('./http/generateHamperImageHttp').generateHamperImageHttp;
