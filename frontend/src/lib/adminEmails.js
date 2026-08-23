function splitEmails(raw) {
  return String(raw || '')
    .split(/[,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Store Gmail — the only account allowed into /admin. */
export const STORE_ADMIN_EMAIL = 'sukhmaldryfruitskorner2@gmail.com';
/** Primary admin shown in UI copy and notifications. */
export const ADMIN_EMAIL = STORE_ADMIN_EMAIL;
/** @deprecated Use ADMIN_EMAIL. Kept so older imports keep compiling. */
export const OWNER_ADMIN_EMAIL = STORE_ADMIN_EMAIL;

const HARDCODED = [STORE_ADMIN_EMAIL];

export const ADMIN_EMAILS = new Set([
  ...HARDCODED,
  ...splitEmails(process.env.REACT_APP_ADMIN_EMAIL),
  ...splitEmails(process.env.REACT_APP_ADMIN_EMAILS),
].filter((email) => email === STORE_ADMIN_EMAIL));

export function isAdminEmail(email) {
  return ADMIN_EMAILS.has(String(email || '').trim().toLowerCase());
}
