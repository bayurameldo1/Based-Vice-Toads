// api/claim.js
// POST /api/claim  { address: "0x...", amount: 100 }
// GET /api/claim?address=0x...  -> returns totals
//
// WARNING: data is stored in data/claims.json (ephemeral on serverless platforms).
// For production use a DB (Supabase, Firebase, Postgres, Redis).

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CLAIMS_FILE = path.join(DATA_DIR, "claims.json");

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
    if (!fs.existsSync(CLAIMS_FILE)) fs.writeFileSync(CLAIMS_FILE, JSON.stringify({}), "utf8");
  } catch (e) {
    // ignore
  }
}

function readClaims() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(CLAIMS_FILE, "utf8");
    return JSON.parse(raw || "{}");
  } catch (e) {
    return {};
  }
}

function writeClaims(obj) {
  try {
    fs.writeFileSync(CLAIMS_FILE, JSON.stringify(obj, null, 2), "utf8");
    return true;
  } catch (e) {
    return false;
  }
}

export default function handler(req, res) {
  ensureDataDir();
  if (req.method === "GET") {
    const address = (req.query.address || "").toString().toLowerCase();
    if (!address) {
      res.status(400).json({ ok: false, error: "address query required" });
      return;
    }
    const claims = readClaims();
    const rec = claims[address] || { total: 0, last: 0, streak: 0 };
    res.json({ ok: true, total: rec.total || 0, last: rec.last || 0, streak: rec.streak || 0 });
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};
    const address = (body.address || "").toString().toLowerCase();
    const amount = Number(body.amount || 0);
    if (!address || !amount || isNaN(amount) || amount <= 0) {
      res.status(400).json({ ok: false, error: "invalid address or amount" });
      return;
    }

    try {
      const claims = readClaims();
      const now = Date.now();
      const rec = claims[address] || { total: 0, last: 0, streak: 0 };

      // enforce 24h cooldown server-side (if last exists)
      const DAY_MS = 24 * 60 * 60 * 1000;
      if (rec.last && now - rec.last < DAY_MS) {
        const remaining = DAY_MS - (now - rec.last);
        res.status(429).json({ ok: false, error: "cooldown", remaining });
        return;
      }

      // update
      rec.streak = (rec.streak || 0) + 1;
      rec.total = (rec.total || 0) + amount;
      rec.last = now;
      claims[address] = rec;
      const ok = writeClaims(claims);
      if (!ok) {
        res.status(500).json({ ok: false, error: "write_failed" });
        return;
      }

      res.json({ ok: true, claimedAmount: amount, total: rec.total, last: rec.last, streak: rec.streak });
    } catch (e) {
      res.status(500).json({ ok: false, error: "server_error", detail: e.message });
    }
    return;
  }

  res.status(405).json({ ok: false, error: "method_not_allowed" });
}
