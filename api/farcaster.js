// api/farcaster.js
// Vercel serverless (CommonJS). Best-effort Farcaster profile lookup by ETH address or username.
// Places to customize: add API keys or change provider order if you have paid access.

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const address = (req.query.address || req.query.q || '').toString().trim();
    if (!address) {
      return res.status(400).json({ ok: false, error: 'Missing address or identity parameter' });
    }

    // Normalize: allow either eth address or farcaster username
    const identity = address;

    // 1) Try web3.bio profile API (supports Farcaster identity lookups)
    // Endpoint: https://api.web3.bio/profile/farcaster/{identity}
    // NOTE: public service; rate limits / availability may vary.
    try {
      const web3bioUrl = `https://api.web3.bio/profile/farcaster/${encodeURIComponent(identity)}`;
      const r = await fetch(web3bioUrl, { method: 'GET' });
      if (r.ok) {
        const j = await r.json().catch(() => null);
        if (j && (j.username || j.displayName || j.avatar || j.profile)) {
          // web3.bio formats vary, try to normalize
          const profile = {
            username: j.username || j.profile?.username || null,
            displayName: j.displayName || j.profile?.displayName || null,
            avatar: j.avatar || j.profile?.avatar || j.pfpUrl || null,
            raw: j
          };
          return res.status(200).json({ ok: true, profile });
        }
      }
    } catch (e) {
      // continue to next provider
      console.warn('web3.bio lookup failed', e && e.message);
    }

    // 2) (Optional) Try Clicker/Daylight/other public proxies (example placeholder)
    // Many third-party services exist. Here we try a generic Clicker endpoint example.
    try {
      const clickerUrl = `https://api.clicker.xyz/v1/addresses/from-farcaster/${encodeURIComponent(identity)}`;
      const r2 = await fetch(clickerUrl, { method: 'GET' });
      if (r2.ok) {
        const j2 = await r2.json().catch(() => null);
        if (j2 && j2.addresses && j2.addresses.length) {
          return res.status(200).json({
            ok: true,
            profile: { username: identity, displayName: identity, avatar: null, addresses: j2.addresses, raw: j2 }
          });
        }
      }
    } catch (e) {
      console.warn('clicker lookup failed', e && e.message);
    }

    // 3) If you have a Neynar / paid Farcaster indexer, call it here (example commented)
    // const neynarUrl = `https://api.neynar.com/v1/users/by-address/${identity}?apiKey=REPLACE`;
    // try { ... }

    // fallback: not found
    return res.status(200).json({ ok: false, error: 'Profile not found (best-effort)', identity });

  } catch (err) {
    console.error('api/farcaster error', err);
    return res.status(500).json({ ok: false, error: 'internal_server_error' });
  }
};
