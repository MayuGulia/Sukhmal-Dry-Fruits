/**
 * Canonical HTTP APIs on Firebase Functions v2 (codebase: http).
 * Firebase Hosting rewrites /api/* and /sitemap.xml to these onRequest handlers.
 * Order notify lives only here — default codebase must not export order triggers.
 */
exports.subscribe = require('./http/subscribe').subscribe;
exports.feedback = require('./http/feedback').feedback;
exports.enquiryBulk = require('./http/enquiryBulk').enquiryBulk;
exports.sitemap = require('./http/sitemap').sitemap;
exports.trackOrder = require('./http/trackOrder').trackOrder;
exports.aiChat = require('./http/aiChat').aiChat;
exports.aiInventory = require('./http/aiInventory').aiInventory;
exports.generateHamperImageHttp = require('./http/generateHamperImageHttp').generateHamperImageHttp;
exports.createOrder = require('./http/createOrder').createOrder;
exports.verifyPayment = require('./http/verifyPayment').verifyPayment;
exports.webhooksRazorpay = require('./http/webhooksRazorpay').webhooksRazorpay;
exports.createAdminSession = require('./http/adminSession').createAdminSession;
exports.clearAdminSession = require('./http/adminSession').clearAdminSession;
exports.admin = require('./http/admin').admin;
exports.scheduleAnalyticsRollup = require('./triggers/scheduleAnalyticsRollup').scheduleAnalyticsRollup;
// Firestore trigger deploy needs a working databases.get; keep source in triggers/
// and export again once that API call succeeds for this CLI identity.
