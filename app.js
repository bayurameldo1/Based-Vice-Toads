import { sdk } from "@farcaster/miniapp-sdk";

// Wait for MiniApp to be ready in the Farcaster frame
await sdk.actions.ready();

console.log("Vice Toads MiniApp is ready ✅");

// Optional: get user info
try {
  const user = await sdk.actions.user();
  console.log("User:", user);
} catch (e) {
  console.log("No user info available:", e?.message || e);
}

// Render simple UI
const app = document.getElementById("app");
app.innerHTML = `
  <div style="
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    min-height:100vh;
    background-color:black;
    color:white;
    font-family:Inter,system-ui,sans-serif;
    text-align:center;
    padding:24px;
  ">
    <img 
      src="https://chocolate-major-guan-717.mypinata.cloud/ipfs/bafybeiauztb35v3h4bnj4yffviv4v2iwgk4wholxs2lghrt72i3lasuezm"
      alt="Vice Toads"
      style="max-width:360px;border-radius:16px;margin-bottom:20px;"
    />
    <h1 style="font-size:28px;margin:0;">Mint Based Vice Toads</h1>
    <p style="opacity:0.85;margin:8px 0 24px;">
      On-chain art collectibles on Base Network.
    </p>
    <button
      id="mintBtn"
      style="
        background-color:#7afcff;
        border:none;
        padding:12px 22px;
        border-radius:12px;
        font-size:16px;
        font-weight:700;
        cursor:pointer;
        color:#02121a;
      "
    >
      Mint Now
    </button>
  </div>
`;

// Open OpenSea or any mint URL when clicking Mint
document.getElementById("mintBtn").addEventListener("click", async () => {
  await sdk.actions.openUrl("https://opensea.io/collection/vice-toads");
});
