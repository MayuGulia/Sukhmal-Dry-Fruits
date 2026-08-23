/**
 * Fallback preview: the selected hamper catalog photo, unchanged.
 * No oval overlay, no product stickers — Gemini edits the interior when the API succeeds.
 */
export async function composeHamperPreview(payload) {
  const hamperSrc = String(payload?.hamperImage || payload?.hamperImages?.[0] || '').split('?')[0];
  if (!hamperSrc) throw new Error('Choose a hamper first');
  return hamperSrc;
}
