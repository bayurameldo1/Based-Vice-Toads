// --- AUTO OPEN WALLET CONNECT ON PAGE LOAD (add to app.js) ---
(async function autoOpenWalletOnLoad() {
  // only run once per session (so users aren't spammed if they reload)
  try {
    const KEY = "vct_auto_open_shown_v1";
    if (sessionStorage.getItem(KEY) === "1") {
      console.debug("auto-open skipped (already shown this session)");
      return;
    }

    // small delay so UI renders first (and Base dev preview doesn't block)
    await new Promise(r => setTimeout(r, 700));

    // if already connected, do nothing
    if (typeof address !== "undefined" && address) {
      console.debug("already connected, skip auto-open");
      return;
    }

    // prefer injected wallets first (try silent check; if none, open modal)
    const hasInjected = !!window.ethereum;
    if (hasInjected) {
      // try to request accounts (this triggers the browser wallet popup)
      try {
        console.debug("Attempting auto window.ethereum requestAccounts...");
        // note: some browsers require a user gesture for eth_requestAccounts to show popup.
        // we still try; if it fails we fall back to Web3Modal.
        await window.ethereum.request({ method: "eth_requestAccounts" });
        // if success, the provider event handlers should pick up and set connected UI
        sessionStorage.setItem(KEY, "1");
        return;
      } catch (e) {
        console.warn("Auto injected connect failed or blocked:", e);
        // continue to fallback to Web3Modal modal
      }
    }

    // ensure web3Modal initialized
    if (!web3Modal) initWeb3Modal();

    // open Web3Modal (WalletConnect QR or in-app modal)
    try {
      console.debug("Auto-opening Web3Modal...");
      await web3Modal.connect(); // resolves to provider if user connects
      sessionStorage.setItem(KEY, "1");
      // web3Modal.connect returns provider; our earlier connectWithWeb3Modal() sets up web3/ethers and UI.
      // But to reuse our existing logic, call the helper we already have:
      await connectWithWeb3Modal(); // this will set provider/web3 and UI
    } catch (err) {
      console.warn("Auto Web3Modal connect aborted or failed:", err);
      // show minimal status to user
      setStatus("Connect Wallet");
    }
  } catch (err) {
    console.error("autoOpenWalletOnLoad error:", err);
  }
})();
