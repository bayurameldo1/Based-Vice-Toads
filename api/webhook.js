// api/webhook.js
// Simple webhook endpoint for Vercel / Next.js style functions.
// Exports default handler (ESM style). Vercel will compile if necessary.

export default function handler(req, res) {
  // Allow CORS so Base / other services can POST
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // GET -> quick healthcheck
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "Webhook endpoint active"
    });
  }

  // POST -> handle event payload
  if (req.method === "POST") {
    try {
      // If the platform sends JSON, Vercel/Next will parse body for you.
      const payload = req.body ?? null;

      // (Optional) Do something with payload:
      // - save to DB
      // - verify signature
      // - trigger downstream process
      // For now just log to Vercel logs (visible in Deployment / Functions logs)
      console.log("Webhook received:", typeof payload, payload);

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("Webhook error:", err);
      return res.status(500).json({ ok: false, error: String(err) });
    }
  }

  // Other methods not allowed
  res.setHeader("Allow", "GET, POST, OPTIONS");
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
