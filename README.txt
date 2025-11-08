Vice Toads Mini App
====================

Files:
- index.html         -> main page with Farcaster meta embed and SDK include
- app.js             -> MiniApp entry script (uses @farcaster/miniapp-sdk)
- src/minikit.config.ts -> minikit config for MiniKit/manifest
- .well-known/farcaster.json -> Mini App manifest for Farcaster

Deployment:
1. Put files in your project root or public folder.
   For Vercel:
   - index.html and app.js at /public or root
   - src/minikit.config.ts in /src
   - .well-known/farcaster.json in /public/.well-known/farcaster.json

2. Replace placeholders:
   - In minikit.config.ts and farcaster.json set ownerAddress and homeUrl to your domain and base wallet address.
   - Update OPENSEA_LINK or mint URL in app.js if needed.

3. Deploy to Vercel/Netlify/GitHub Pages.

4. Verify manifest:
   - Visit https://<your-domain>/.well-known/farcaster.json to ensure reachable.
   - Use Warpcast Developer Panel to register/verify your Mini App.

