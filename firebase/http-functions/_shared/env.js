/** Firebase Functions env (no Netlify.env). Same names as Netlify. */
function envGet(name) {
  return String(process.env[name] || '').trim();
}

module.exports = { envGet };
