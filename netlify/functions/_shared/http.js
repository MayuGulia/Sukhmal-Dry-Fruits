function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function notConfigured() {
  return json({ error: 'not_configured', message: 'Connect Firebase / Gemini / Razorpay env vars for live APIs. The shop is using the local catalog fallback.' }, 501);
}

function env(name) {
  return (typeof Netlify !== 'undefined' && Netlify.env?.get)
    ? Netlify.env.get(name)
    : process.env[name];
}

export { json, notConfigured, env };
