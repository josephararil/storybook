// Vercel serverless proxy — forwards Gemini API calls server-side so the API
// key never reaches the client browser.
//
// How it works:
//   Client calls  POST /api/gemini?path=/v1beta/models/gemini-3.5-flash:generateContent
//   This function forwards that request to Google, injects GEMINI_API_KEY, and
//   returns Google's response verbatim.
//
// Environment variable required (set in Vercel dashboard, never committed):
//   GEMINI_API_KEY=AIza...

module.exports = async function handler(req, res) {
  const { path } = req.query;

  // Safety: only allow /v1beta/ paths so this proxy can't be used for
  // arbitrary HTTP requests to other services.
  if (!path || !path.startsWith('/v1beta/')) {
    return res.status(400).json({ error: 'Invalid path — must start with /v1beta/' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Proxy not configured — the app owner needs to set GEMINI_API_KEY in Vercel.',
    });
  }

  const url = `https://generativelanguage.googleapis.com${path}`;

  // Forward the request.  GET is used for key validation; POST for everything else.
  const isBodyRequest = req.method !== 'GET' && req.method !== 'HEAD';
  const upstreamHeaders = { 'x-goog-api-key': apiKey };
  if (isBodyRequest) upstreamHeaders['Content-Type'] = 'application/json';

  let upstream;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers: upstreamHeaders,
      // req.body is already parsed as a JS object by Vercel's default body parser,
      // so we re-stringify it to send as JSON to Google.
      ...(isBodyRequest && { body: JSON.stringify(req.body) }),
    });
  } catch (err) {
    return res.status(502).json({ error: 'Upstream request failed: ' + err.message });
  }

  const responseText = await upstream.text();
  res.status(upstream.status);
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
  res.end(responseText);
};
