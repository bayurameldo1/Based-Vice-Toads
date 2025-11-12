// app.js
/* eslint-disable no-unused-vars */
/*
  App script for Based Vice Toads miniapp.
  - Expects HTML elements with ids used below.
  - Requires Farcaster miniapp SDK to be available via esm import.
  - Uses browser's window.ethereum for simple auto-connect (no Infura).
  - Fallback local claim stored in localStorage.
*/

const LS_KEY = "vct_claims_v1";
const DAY_MS = 24 * 60 * 60 * 1000;

// --- DOM references (must match index.html) ---
const connectInline = document.getElementById("connectInline");
const claimBtn = document.getElementById("claimBtn");
const profileName = document.getElementById("profileName");
const profileSub = document.getElementById("profileSub");
const avatarImg = document.getElementById("avatarImg");
const statusText = document.getElementById("statusText");
const totalClaimedEl = document.getElementById("totalClaimed");
const mintBtn = document.getElementById("mintBtn");

// internal state
let provider = null;
let address = null;
let countdownInterval = null;

/* ---------- Helper utils ---------- */
const short = (a) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "");
const nextAmountFor = (rec) => ((rec?.streak || 0) + 1) * 100;

function startCountdown(msRemaining, nextAmount) {
  clearInterval(countdownInterval);
  const startedAt = Date.now();
  function tick() {
    const left = Math.max(0, msRemaining - (Date.now() - startedAt));
    if (left <= 0) {
      clearInterval(countdownInterval);
      statusText.textContent = `You can claim now — Next +${nextAmount} pts`;
      // when ready, claim button should be black (connected)
      if (address) claimBtn.style.color = "#000";
      return;
    }
    const h = Math.floor(left / (3600 * 1000));
    const m = Math.floor((left % (3600 * 1000)) / (60 * 1000));
    const s = Math.floor((left % (60 * 1000)) / 1000);
    statusText.textContent =
      "Next claim in " +
      String(h).padStart(2, "0") +
      ":" +
      String(m).padStart(2, "0") +
      ":" +
      String(s).padStart(2, "0") +
      ` — Next +${nextAmount} pts`;
  }
  tick();
  countdownInterval = setInterval(tick, 1000);
}

function stopCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = null;
}

function getLocalRecord(addr) {
  try {
    const db = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    return db[addr] || { total: 0, last: 0, streak: 0 };
  } catch (e) {
    return { total: 0, last: 0, streak: 0 };
  }
}

function saveLocalRecord(addr, rec) {
  const db = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  db[addr] = rec;
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

/* ---------- Farcaster SDK ready + init ---------- */
async function initFarcasterReady() {
  try {
    // import sdk dynamically so bundlers or ESM-enabled browsers work
    const { sdk } = await import("https://esm.sh/@farcaster/miniapp-sdk");
    // ready call required for Base preview logs & ready state
    sdk.actions.ready({ disableNativeGestures: true });
    // If you want to listen to ready event: sdk.actions.on("miniapp_ready", ...)
    console.debug("farcaster sdk ready called");
  } catch (e) {
    console.warn("Farcaster SDK import failed:", e);
  }
}

/* ---------- Farcaster profile lookup (best-effort) ----------
   Expects a server endpoint /api/farcaster?address=<address> that returns:
   { ok: true, profile: { username, avatar, displayName } }
   This is optional — if unavailable we'll just show wallet address and default avatar.
*/
async function lookupFarcasterProfile(addr) {
  try {
    const res = await fetch(`/api/farcaster?address=${addr}`);
    if (!res.ok) return null;
    const j = await res.json();
    if (j && j.ok && j.profile) return j.profile;
    return null;
  } catch (e) {
    console.warn("farcaster lookup error", e);
    return null;
  }
}

/* ---------- Wallet connect (simple auto) ----------
   Behavior:
   - On load attempts to request accounts (auto-connect attempt).
   - If user hasn't approved, it will show "Connect wallet" status.
   - No signature step, as requested (simple connect only).
*/
async function tryAutoConnect() {
  try {
    if (window.ethereum) {
      // try to get accounts (without popup) via eth_accounts first
      const accs = await window.ethereum.request({ method: "eth_accounts" });
      if (accs && accs.length) {
        address = accs[0].toLowerCase();
        onConnected();
        // subscribe to account changes
        if (window.ethereum.on) {
          window.ethereum.on("accountsChanged", (newAccs) => {
            if (!newAccs || newAccs.length === 0) {
              handleDisconnect();
            } else {
              address = newAccs[0].toLowerCase();
              onConnected();
            }
          });
        }
        return;
      }
      // if not connected, do nothing (we will wait for user click)
    }
  } catch (e) {
    console.warn("auto connect failed", e);
  }
}

async function doConnect() {
  // simplified: request accounts from wallet
  try {
    statusText.textContent = "Connect wallet";
    if (!window.ethereum) {
      alert("No injected wallet found (MetaMask / mobile dapp). Please open in a wallet.");
      return;
    }
    const accs = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accs || accs.length === 0) {
      statusText.textContent = "Connect wallet";
      return;
    }
    address = accs[0].toLowerCase();
    onConnected();
  } catch (e) {
    console.warn("connect failed", e);
    statusText.textContent = "Connect wallet";
  }
}

async function onConnected() {
  // update UI
  profileName.textContent = short(address);
  profileSub.textContent = "Connected";
  // try Farcaster profile lookup
  statusText.textContent = "Detecting Farcaster profile...";
  const profile = await lookupFarcasterProfile(address).catch(() => null);
  if (profile) {
    profileName.textContent = profile.username || profile.displayName || short(address);
    profileSub.textContent = short(address);
    avatarImg.src = profile.avatar || "/images/icon.png";
  } else {
    profileName.textContent = short(address);
    profileSub.textContent = short(address);
    avatarImg.src = "/images/icon.png";
  }

  // update buttons
  if (connectInline) connectInline.style.display = "none";
  claimBtn.classList.remove("disabled");
  claimBtn.disabled = false;
  claimBtn.style.color = "#000";
  statusText.textContent = "Ready to claim your points";
  loadTotals();
}

/* ---------- Disconnect ---------- */
function handleDisconnect() {
  address = null;
  if (connectInline) connectInline.style.display = "inline-block";
  profileName.textContent = "Not connected";
  profileSub.textContent = "Connect wallet to show profile";
  avatarImg.src = "/images/icon.png";
  claimBtn.classList.add("disabled");
  claimBtn.disabled = true;
  totalClaimedEl.textContent = "0";
  statusText.textContent = "Connect wallet to claim";
  stopCountdown();
  claimBtn.style.color = "#fff";
}

/* ---------- Claim logic (server try then local fallback) ---------- */
async function claimPoints() {
  if (!address) {
    alert("Connect wallet first");
    return;
  }
  claimBtn.disabled = true;
  statusText.textContent = "Claim in progress...";
  try {
    // Try server claim endpoint first
    const resp = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, amount: 100 }),
    });
    const j = await resp.json().catch(() => null);
    if (j && j.ok) {
      // server returned success
      applyLocalAfterClaim(j.claimedAmount || 100);
      totalClaimedEl.textContent = j.total || getLocalTotal(address);
      statusText.textContent = `Claimed +${j.claimedAmount || 100} — next claim in 24:00:00`;
      startNextCountdownForAddress(address);
    } else {
      // server failed -> fallback local
      localClaim();
    }
  } catch (e) {
    // offline or network issue -> fallback local
    localClaim();
  } finally {
    claimBtn.disabled = false;
    // after claim set color back to pre-connect
    claimBtn.style.color = "#fff";
  }
}

function applyLocalAfterClaim(claimAmount) {
  const rec = getLocalRecord(address);
  const now = Date.now();
  if (!rec.last || now - rec.last >= DAY_MS) rec.streak = (rec.streak || 0) + 1;
  rec.total = (rec.total || 0) + claimAmount;
  rec.last = now;
  saveLocalRecord(address, rec);
}

function localClaim() {
  const rec = getLocalRecord(address);
  const now = Date.now();
  if (rec.last && now - rec.last < DAY_MS) {
    const remaining = DAY_MS - (now - rec.last);
    const nextAmt = nextAmountFor(rec);
    startCountdown(remaining, nextAmt);
    return;
  }
  const amount = nextAmountFor(rec);
  rec.streak = (rec.streak || 0) + 1;
  rec.total = (rec.total || 0) + amount;
  rec.last = now;
  saveLocalRecord(address, rec);
  totalClaimedEl.textContent = rec.total;
  statusText.textContent = `Claimed +${amount} — next claim in 24:00:00`;
  startNextCountdownForAddress(address);
}

function startNextCountdownForAddress(addr) {
  const rec = getLocalRecord(addr);
  if (!rec || !rec.last) return;
  const elapsed = Date.now() - rec.last;
  if (elapsed >= DAY_MS) {
    statusText.textContent = `You can claim now — Next +${nextAmountFor(rec)} pts`;
    if (address) claimBtn.style.color = "#000";
    return;
  }
  const remaining = DAY_MS - elapsed;
  const nextAmt = nextAmountFor(rec);
  startCountdown(remaining, nextAmt);
}

function getLocalTotal(addr) {
  const rec = getLocalRecord(addr);
  return rec.total || 0;
}

function loadTotals() {
  if (!address) return;
  const rec = getLocalRecord(address);
  totalClaimedEl.textContent = rec.total || 0;
  if (rec.last && Date.now() - rec.last < DAY_MS) {
    startCountdown(DAY_MS - (Date.now() - rec.last), nextAmountFor(rec));
  } else {
    stopCountdown();
    statusText.textContent = `You can claim now — Next +${nextAmountFor(rec)} pts`;
    if (address) claimBtn.style.color = "#000";
  }
}

/* ---------- Mint button handler ---------- */
function handleMintClick() {
  // first open site (we already are on site), but per flow open opensea after confirmation
  const go = confirm("Open OpenSea collection? OK = open, Cancel = stay");
  if (go) {
    window.open("https://opensea.io/collection/based-vice-toads/overview", "_blank");
  }
}

/* ---------- Wire UI events ---------- */
function bindUI() {
  if (connectInline) connectInline.addEventListener("click", doConnect);
  if (claimBtn) claimBtn.addEventListener("click", claimPoints);
  if (mintBtn) mintBtn.addEventListener("click", handleMintClick);
}

/* ---------- Init ---------- */
async function init() {
  try {
    await initFarcasterReady();
  } catch (e) {
    console.warn("farcaster ready failed", e);
  }
  bindUI();
  // try lightweight auto connect (no popup if already connected)
  await tryAutoConnect();
  // If body loaded and not connected, keep UI as not connected (user will click)
}

document.addEventListener("DOMContentLoaded", init);
