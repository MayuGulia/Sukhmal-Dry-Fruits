function splitEmails(raw) {
  return String(raw || '')
    .split(/[,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Firebase owner account — Google/Firebase stays on this Gmail. */
export const OWNER_ADMIN_EMAIL = 'mayu.gulia156@gmail.com';
/** Store Gmail — extra admin login for /admin. */
export const STORE_ADMIN_EMAIL = 'sukhmaldryfruitskorner2@gmail.com';
/** Primary admin shown in UI copy. */
export const ADMIN_EMAIL = OWNER_ADMIN_EMAIL;

const HARDCODED = [
  OWNER_ADMIN_EMAIL,
  STORE_ADMIN_EMAIL,
];

export const ADMIN_EMAILS = new Set([
  ...HARDCODED,
  ...splitEmails(process.env.REACT_APP_ADMIN_EMAIL),
  ...splitEmails(process.env.REACT_APP_ADMIN_EMAILS),
]);

export function isAdminEmail(email) {
  return ADMIN_EMAILS.has(String(email || '').trim().toLowerCase());
}
