const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { REGION, RESEND_SECRETS, WHATSAPP_SECRETS } = require('../_shared/httpFn');
const { adminDb } = require('../_shared/firebaseAdmin');
const { isDispatchStatus } = require('../_shared/orderStatus');
const { notifyOrderShipped } = require('../_shared/notify');
const { notifyOwnerWhatsapp } = require('../_shared/notifyOwnerWhatsapp');

/**
 * Client admin writes order status in Firestore. When status becomes Shipped,
 * email the customer (and ping owner WhatsApp) with the tracking number.
 */
const onOrderUpdated = onDocumentUpdated(
  {
    document: 'orders/{orderId}',
    region: REGION,
    secrets: [...RESEND_SECRETS, ...WHATSAPP_SECRETS],
  },
  async (event) => {
    const before = event.data?.before?.data() || {};
    const after = event.data?.after?.data() || {};
    if (after.shippedNotifyAt) return;
    if (!isDispatchStatus(after.status || after.orderStatus)) return;
    if (isDispatchStatus(before.status || before.orderStatus)) return;

    const order = { ...after, orderId: after.orderId || event.params.orderId, _shipped: true };
    const notify = await notifyOrderShipped(order);
    try {
      await notifyOwnerWhatsapp(order);
    } catch (err) {
      console.error('owner shipped whatsapp ignored', order.orderId, err?.message);
    }

    const sdk = await adminDb();
    if (!sdk || !event.data?.after?.ref) return;
    await event.data.after.ref.update({
      shippedNotifyAt: sdk.FieldValue.serverTimestamp(),
      shippedNotify: notify,
    });
  },
);

module.exports = { onOrderUpdated };
