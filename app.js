// app.js (replace existing)
// Uses window.ethereum first, then Web3Modal+WalletConnect as fallback.
// Requires the CDN scripts above OR bundled equivalents.

const LS_KEY = "vct_claims_v1";
const DAY_MS = 24 * 60 * 60 * 1000;

const connectInline = document.getElementById("connectInline");
const claimBtn = document.getElementById("claimBtn");
const profileName = document.getElementById("profileName");
const profileSub = document.getElementById("profileSub");
const avatarImg = document.getElementById("avatarImg");
const statusText = document.getElementById("statusText");
const totalClaimedEl = document.getElementById("totalClaimed");
const mintBtn = document.getElementById("mintBtn");

let provider = null;        // raw provider (window.ethereum or wc provider)
let web3 = null;            // Web3 instance (optional)
let ethersProvider = null;  // ethers provider
let address = null;
let wcProvider = null;
let web3Modal = null;
let countdownInterval = null;

function short(a){ return a ? (a.slice(0,6) + "..." + a.slice(-4)) : ""; }
function setStatus(t){ statusText.textContent = t; console.debug("[status]", t); }

// INIT Web3Modal (WalletConnect fallback)
function initWeb3Modal(){
  try {
    const WalletConnectProvider = window.WalletConnectProvider.default;
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          // Use Base mainnet RPC so WalletConnect works without Infura
          rpc: {
            8453: "https://mainnet.base.org",
            1: "https://cloudflare-eth.com"
          },
          network: "mainnet",
          qrcode: true
        }
      }
    };
    web3Modal = new window.Web3Modal.default({
      cacheProvider: false,
      providerOptions
    });
    console.debug("Web3Modal init OK");
  } catch(e){
    console.warn("Web3Modal init failed", e);
  }
}

// --- Local claim helpers (same as before) ---
function readLocalDB(){ try { return JSON.parse(localStorage.getItem(LS_KEY)||"{}"); } catch(e){ return {}; } }
function writeLocalDB(db){ try { localStorage.setItem(LS_KEY, JSON.stringify(db)); return true; } catch(e){ return false; } }
function getLocalRecord(addr){ const db = readLocalDB(); return db[addr] || { total:0, last:0, streak:0 }; }
function saveLocalRecord(addr, rec){ const db = readLocalDB(); db[addr] = rec; writeLocalDB(db); }
function nextAmountFor(rec){ return ((rec?.streak||0)+1)*100; }

// Countdown
function startCountdown(msRemaining, nextAmount){
  clearInterval(countdownInterval);
  const startT = Date.now();
  function tick(){
    const left = Math.max(0, msRemaining - (Date.now() - startT));
    if (left <= 0){ clearInterval(countdownInterval); setStatus(`You can claim now — Next +${nextAmount} pts`); claimBtn.style.color = '#000'; return; }
    const h = Math.floor(left/(3600*1000));
    const m = Math.floor((left%(3600*1000))/(60*1000));
    const s = Math.floor((left%(60*1000))/1000);
    setStatus(`Next claim in ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} — Next +${nextAmount} pts`);
  }
  tick(); countdownInterval = setInterval(tick,1000);
}
function stopCountdown(){ if(countdownInterval) clearInterval(countdownInterval); countdownInterval = null; }

// UI updates
function setConnectedUI(addr){
  address = addr.toLowerCase();
  profileName.textContent = short(address);
  profileSub.textContent = "Connected";
  avatarImg.src = "/images/icon.png";
  claimBtn.disabled = false; claimBtn.classList.remove("disabled");
  claimBtn.style.color = '#000';
  connectInline.textContent = "Disconnect";
  connectInline.classList.remove("disconnected"); connectInline.classList.add("connected");
  setStatus("Ready to claim your points");
  loadTotals();
}
function setDisconnectedUI(){
  address = null;
  profileName.textContent = "Not connected"; profileSub.textContent = "Connect wallet";
  avatarImg.src = "/images/icon.png";
  claimBtn.disabled = true; claimBtn.classList.add("disabled");
  totalClaimedEl.textContent = "0";
  setStatus("Connect wallet to claim");
  connectInline.textContent = "Connect Wallet";
  connectInline.classList.remove("connected"); connectInline.classList.add("disconnected");
  stopCountdown();
  claimBtn.style.color = '#fff';
}

// Try window.ethereum (MetaMask / Base wallet)
async function tryWindowEthereumConnect(allowRequest=false){
  try {
    if (!window.ethereum) return false;
    // check existing accounts without popup
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts && accounts.length){
      provider = window.ethereum;
      web3 = new Web3(provider);
      ethersProvider = new ethers.providers.Web3Provider(provider);
      setConnectedUI(accounts[0]);
      bindProviderEvents(provider);
      return true;
    }
    if (allowRequest){
      // ask user to connect (popup)
      const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accs && accs.length){
        provider = window.ethereum;
        web3 = new Web3(provider);
        ethersProvider = new ethers.providers.Web3Provider(provider);
        setConnectedUI(accs[0]);
        bindProviderEvents(provider);
        return true;
      }
    }
    return false;
  } catch(err){
    console.warn("window.ethereum connect error", err);
    return false;
  }
}

// Bind provider events
function bindProviderEvents(p){
  try {
    if (!p.on) return;
    p.on('accountsChanged', (accs)=> {
      if (!accs || accs.length===0) { handleDisconnect(); }
      else { setConnectedUI(accs[0]); }
    });
    p.on('disconnect', (code,reason)=> { console.debug('provider disconnect',code,reason); handleDisconnect(); });
  } catch(e){ console.warn("bindProviderEvents failed", e); }
}

// WalletConnect / Web3Modal connect
async function connectWithWeb3Modal(){
  try {
    if (!web3Modal) initWeb3Modal();
    const p = await web3Modal.connect();
    if (!p) throw new Error("No provider from Web3Modal");
    // Save provider for disconnect
    wcProvider = p;
    provider = p;
    web3 = new Web3(provider);
    ethersProvider = new ethers.providers.Web3Provider(provider);
    // get accounts
    let accounts = [];
    try { accounts = await provider.request({ method: 'eth_accounts' }); } catch(e){
      try { accounts = await web3.eth.getAccounts(); } catch(e2){ accounts = []; }
    }
    if (!accounts || accounts.length===0){
      // try ethers listAccounts
      try { const signer = ethersProvider.getSigner(); const addr = await signer.getAddress(); accounts = [addr]; } catch(e){}
    }
    if (!accounts || accounts.length===0) throw new Error("No accounts returned");
    setConnectedUI(accounts[0]);
    bindProviderEvents(provider);
    return true;
  } catch(e){
    console.warn("Web3Modal connect error", e);
    setStatus("Connect wallet");
    return false;
  }
}

// Handle disconnect (clear provider)
async function handleDisconnect(){
  try {
    if (wcProvider && wcProvider.disconnect) await wcProvider.disconnect();
  } catch(e){}
  try { if (provider && provider.close) await provider.close(); } catch(e){}
  provider = null; web3 = null; ethersProvider = null; wcProvider = null;
  setDisconnectedUI();
}

// Public connect: try window.ethereum request first (popup), else open web3modal
async function connectPublic(){
  setStatus("Connect wallet");
  // prefer wallet injected popup first
  const ok = await tryWindowEthereumConnect(true);
  if (ok) return;
  // fallback to Web3Modal / WalletConnect
  await connectWithWeb3Modal();
}

// Claim logic (server then fallback local)
async function claimPoints(){
  if (!address){ alert("Connect wallet first"); return; }
  claimBtn.disabled = true; setStatus("Claim in progress...");
  try {
    const resp = await fetch('/api/claim', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ address, amount: 100 })
    });
    const j = await resp.json().catch(()=>null);
    if (j && j.ok){
      applyLocalAfterClaim(j.claimedAmount || 100);
      totalClaimedEl.textContent = j.total || getLocalTotal(address);
      setStatus(`Claimed +${j.claimedAmount||100} — next claim in 24:00:00`);
      startNextCountdownForAddress(address);
    } else if (j && j.error === 'cooldown'){
      // server says cooldown; use server provided remaining
      startCountdown(j.remaining, nextAmountFor(getLocalRecord(address)));
    } else {
      localClaim();
    }
  } catch(e){
    console.warn("claim error", e);
    localClaim();
  } finally {
    claimBtn.disabled = false;
    claimBtn.style.color = '#fff';
  }
}

function getLocalRecord(addr){ return readLocalDB()[addr] || { total:0, last:0, streak:0 }; }
function applyLocalAfterClaim(claimAmount){
  const rec = getLocalRecord(address);
  const now = Date.now();
  if (!rec.last || now - rec.last >= DAY_MS) rec.streak = (rec.streak || 0) + 1;
  rec.total = (rec.total || 0) + claimAmount;
  rec.last = now;
  const db = readLocalDB(); db[address] = rec; writeLocalDB(db);
}
function localClaim(){
  const rec = getLocalRecord(address);
  const now = Date.now();
  if (rec.last && now - rec.last < DAY_MS){
    const remaining = DAY_MS - (now - rec.last);
    startCountdown(remaining, nextAmountFor(rec));
    return;
  }
  const amount = nextAmountFor(rec);
  rec.streak = (rec.streak || 0) + 1;
  rec.total = (rec.total || 0) + amount;
  rec.last = now;
  const db = readLocalDB(); db[address] = rec; writeLocalDB(db);
  totalClaimedEl.textContent = rec.total;
  setStatus(`Claimed +${amount} — next claim in 24:00:00`);
  startNextCountdownForAddress(address);
}
function startNextCountdownForAddress(addr){
  const rec = getLocalRecord(addr);
  if (!rec || !rec.last) return;
  const elapsed = Date.now() - rec.last;
  if (elapsed >= DAY_MS){ setStatus(`You can claim now — Next +${nextAmountFor(rec)} pts`); claimBtn.style.color = '#000'; return; }
  const remaining = DAY_MS - elapsed;
  startCountdown(remaining, nextAmountFor(rec));
}
function getLocalTotal(addr){ const r = getLocalRecord(addr); return r.total || 0; }

function loadTotals(){
  if (!address) return;
  const rec = getLocalRecord(address);
  totalClaimedEl.textContent = rec.total || 0;
  if (rec.last && Date.now() - rec.last < DAY_MS){
    startCountdown(DAY_MS - (Date.now() - rec.last), nextAmountFor(rec));
  } else {
    stopCountdown();
    setStatus(`You can claim now — Next +${nextAmountFor(rec)} pts`);
    claimBtn.style.color = '#000';
  }
}

// Bind UI
function bindUI(){
  if (connectInline) connectInline.addEventListener('click', async ()=>{
    if (!address) await connectPublic();
    else await handleDisconnect();
  });
  if (claimBtn) claimBtn.addEventListener('click', claimPoints);
  if (mintBtn) mintBtn.addEventListener('click', ()=> window.open('https://opensea.io/collection/based-vice-toads/overview','_blank'));
}

// Auto-connect attempt on load
async function autoConnect(){
  // try to connect silently (no popup) to injected wallets
  const ok = await tryWindowEthereumConnect(false);
  if (ok) return;
  // try cached web3Modal (if enabled in future)
  // currently we don't auto open walletconnect qrcode
}

// Init
(async function init(){
  initWeb3Modal();
  bindUI();
  await autoConnect();
  setDisconnectedUI();
  console.debug("app.js initialized");
})();
