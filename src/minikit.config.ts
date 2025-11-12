// src/minikit.config.ts
export const ROOT_URL = "https://vice-toads.vercel.app";

export const minikitConfig = {
  accountAssociation: {
    // header / payload / signature sudah Anda miliki — biarkan seperti ini
    header: "eyJmaWQiOjM0NjA3NSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDEwQjUzYTlGNDFBNzhlNENDQ0FhZUEyQzUxZGZiNUY2RmYwMjIzMTgifQ",
    payload: "eyJkb21haW4iOiJ2aWNlLXRvYWRzLnZlcmNlbC5hcHAifQ",
    signature: "VuapZP02zGv/2Ho4HslcWbd9GKNA9BcxOc7qh9ND/OtUfuMfVGvaS9Z8gWyG8JEB1H6ZZpND7r/vpwPxjwpJ2Rs="
  },
  miniapp: {
    version: "1",
    name: "Vice Toads",
    subtitle: "Mint Based Vice Toads NFT",
    description: "On-chain art collectibles on Base. Mint your Vice Toad and join the swamp.",
    // screenshotUrls: gunakan gambar yang sudah diupload ke /public/images (webp/png)
    screenshotUrls: [
      `${ROOT_URL}/images/bg2.webp`,
      `${ROOT_URL}/images/bg3.webp`,
      `${ROOT_URL}/images/bg4.webp`
    ],
    // Icon must be PNG 1024x1024 (no alpha). Jika saat deploy base menolak, ganti file ini ke icon 1024x1024.
    iconUrl: `${ROOT_URL}/images/icon.png`,
    splashImageUrl: `${ROOT_URL}/images/splash.webp`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "art-creativity",
    tags: ["vice", "toads", "base", "nft", "mint"],
    heroImageUrl: `${ROOT_URL}/images/bg1.webp`,
    tagline: "Mint Based Vice Toads",
    ogTitle: "Vice Toads — Mint on Base",
    ogDescription: "Collect and mint your Vice Toad NFTs directly on Base. Limited supply.",
    ogImageUrl: `${ROOT_URL}/images/bg1.webp`
  }
} as const;
