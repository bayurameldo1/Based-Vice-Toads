// api/farcaster.js
// GET /api/farcaster?address=0x...
// returns JSON: { ok:true, profile: { username, displayName, avatar } } or { ok:false, error: "..." }

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CACHE_FILE = path.join(DATA_DIR, "farcaster_cache.json");

// helper: ensure data dir exists
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
    if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, JSON.stringify({}), "utf8");
  } catch (e) {
    // ignore
  }
}

export default async function handler(req, res) {
  ensureDataDir();

  const address = (req.query.address || "").toString().trim().toLowerCase();
  if (!address) {
    res.status(400).json({ ok: false, error: "address required" });
    return;
  }

  // Try cached result first
  try {
    const cacheRaw = fs.readFileSync(CACHE_FILE, "utf8");
    const cache = JSON.parse(cacheRaw || "{}");
    if (cache[address]) {
      res.setHeader("Cache-Control", "public, max-age=60"); // short cache
      res.json({ ok: true, profile: cache[address], source: "cache" });
      return;
    }
  } catch (e) {
    // ignore cache errors
  }

  // Best-effort remote lookups:
  // 1) try Farcaster public API (if available)
  // 2) try Warpcast public API (if available)
  // Note: these endpoints may change; we handle failures gracefully.

  const tryEndpoints = [
    // community endpoints: (may or may not work)
    `https://api.farcaster.xyz/v2/user-by-address?address=${encodeURIComponent(address)}`,
    `https://api.warpcast.com/v2/users/by-address/${encodeURIComponent(address)}`,
    `https://api.castalchemy.org/v1/user?address=${encodeURIComponent(address)}` // example third-party (may 404)
  ];

  let profile = null;
  let source = null;

  for (const url of tryEndpoints) {
    try {
      const resp = await fetch(url, { method: "GET" });
      if (!resp.ok) continue;
      const j = await resp.json().catch(() => null);
      if (!j) continue;

      // Normalize different shapes
      // Farcaster: might return { user: { username, displayName, avatar } } or similar
      // Warpcast: returns user object frequently with avatar and username
      let candidate = null;

      // heuristics:
      if (j.user) {
        candidate = {
          username: j.user.username || j.user.fname || null,
          displayName: j.user.displayName || j.user.name || null,
          avatar: j.user.avatar || j.user.avatarUrl || j.user.profileImageUrl || null
        };
      } else if (j.username || j.displayName || j.avatar) {
        candidate = {
          username: j.username || null,
          displayName: j.displayName || null,
          avatar: j.avatar || j.avatarUrl || null
        };
      } else if (j.result && j.result.username) {
        candidate = {
          username: j.result.username,
          displayName: j.result.displayName || null,
          avatar: j.result.avatar || null
        };
      }

      if (candidate) {
        profile = candidate;
        source = url;
        break;
      }

      // fallback: if j is an array or object that contains username property deep
      if (typeof j === "object") {
        const flat = JSON.stringify(j);
        if (flat.includes("username") || flat.includes("avatar")) {
          // best-effort parse
          profile = { raw: j };
          source = url;
          break;
        }
      }
    } catch (e) {
      // try next
    }
  }

  if (!profile) {
    res.json({ ok: false, error: "profile not found (best-effort)", sourceTried: tryEndpoints });
    return;
  }

  // Save to cache (best-effort)
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    const cache = JSON.parse(raw || "{}");
    cache[address] = profile;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
  } catch (e) {
    // ignore write errors
  }

  res.setHeader("Cache-Control", "public, max-age=60");
  res.json({ ok: true, profile, source });
}
