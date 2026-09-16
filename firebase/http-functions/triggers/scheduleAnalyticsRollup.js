const { onSchedule } = require('firebase-functions/v2/scheduler');
const { REGION, VERTEX_RUNTIME_SA } = require('../_shared/httpFn');
const { rollupAnalyticsDays } = require('../_shared/analyticsRollup');

const scheduleAnalyticsRollup = onSchedule(
  {
    region: REGION,
    schedule: 'every 1 hours',
    timeZone: 'Asia/Kolkata',
    timeoutSeconds: 180,
    serviceAccount: VERTEX_RUNTIME_SA,
  },
  async () => {
    const results = await rollupAnalyticsDays(3);
    console.log('[Sukhmal analytics] rollup', JSON.stringify(results));
    return results;
  },
);

module.exports = { scheduleAnalyticsRollup };
