// api/webhook.js
// Simple webhook receiver for Vercel. Logs incoming body and responds 200.
// Extend: validate signatures, write to DB, emit events, etc.

module.exports = async (req, res) => {
  // Allow CORS from anywhere (adjust if you need stricter policy)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    if (req.method === 'OPTIONS') {
      // CORS preflight
      res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(200).send('');
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
    }

    // parse JSON body (Vercel / Node provides parsed body for Next.js api; for raw frameworks, parse manually)
    const payload = req.body || null;

    // Basic validation example (you can add secret header validation here)
    // const signature = req.headers['x-webhook-signature'];
    // verifySignature(payload, signature);

    // Example: basic routing by type
    const type = (payload && payload.type) || 'event';
    console.log('[webhook] received type=', type, 'payload=', JSON.stringify(payload));

    // TODO: persist to DB, send to admin webhook, or push to message queue
    // e.g. await saveToSupabase(payload);

    return res.status(200).json({ ok: true, received: true });
  } catch (err) {
    console.error('webhook error', err);
    return res.status(500).json({ ok: false, error: 'internal_server_error' });
  }
};
