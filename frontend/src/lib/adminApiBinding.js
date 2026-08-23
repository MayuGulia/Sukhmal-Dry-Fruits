/** Stable singleton so HMR/circular imports never replace adminApi with an empty object. */
const root = typeof globalThis !== 'undefined' ? globalThis : window;
if (!root.__SK_ADMIN_API__) root.__SK_ADMIN_API__ = {};
export const adminApi = root.__SK_ADMIN_API__;
