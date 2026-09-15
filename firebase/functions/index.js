/**
 * Default Cloud Functions codebase.
 * Order/payment/email HTTP APIs live only in firebase/http-functions
 * (createOrder, verifyPayment, webhooksRazorpay). Do not re-add Firestore
 * order triggers here — they would double-send mail on the same writes.
 */
exports.generateHamperImage = require('./generateHamperImage').generateHamperImage;
