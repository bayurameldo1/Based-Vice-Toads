export const minikitConfig = {
  accountAssociation: {
    // tambahkan header, payload, signature nanti (setelah domain diverifikasi)
    header: "eyJmaWQiOjM0NjA3NSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDEwQjUzYTlGNDFBNzhlNENDQ0FhZUEyQzUxZGZiNUY2RmYwMjIzMTgifQ",
    payload: "eyJkb21haW4iOiJ2aWNlLXRvYWRzLnZlcmNlbC5hcHAifQ",
    signature: "VuapZP02zGv/2Ho4HslcWbd9GKNA9BcxOc7qh9ND/OtUfuMfVGvaS9Z8gWyG8JEB1H6ZZpND7r/vpwPxjwpJ2Rs="
  },
  miniapp: {
    version: "1",
    name: "Vice Toads",
    subtitle: "Mint Based Vice Toads NFT",
    description: "On-chain art collectibles on Base. Mint your Vice Toad and join the swamp.",
    screenshotUrls: [
      "https://chocolate-major-guan-717.mypinata.cloud/ipfs/bafybeiafgcmsftjvx3ty4yivk7v7q5vb7n5s7gcyr3fsoi2oi5yxviobci",
      "https://chocolate-major-guan-717.mypinata.cloud/ipfs/bafybeihpbx5ufw5nazypve5v56fy7p7hqh7qldoqqdbqe3nruartqg7rai",
      "https://chocolate-major-guan-717.mypinata.cloud/ipfs/bafybeifrhinb4fkqzgqkpx6bv2234j7jblwobmqzqycje7oeybsd7adwku"
    ],
    iconUrl: "https://chocolate-major-guan-717.mypinata.cloud/ipfs/bafybeiauztb35v3h4bnj4yffviv4v2iwgk4wholxs2lghrt72i3lasuezm",
    splashImageUrl: "https://chocolate-major-guan-717.mypinata.cloud/ipfs/bafybeieguywbhmer7aw4dpjw255bwfwnpnpbgxc7yqaemwpe7toef7zz7i",
    splashBackgroundColor: "#000000",
    homeUrl: "https://vice-toads.vercel.app",
    webhookUrl: "https://vice-toads.vercel.app/api/webhook",
    primaryCategory: "art-creativity",
    tags: ["vice", "toads", "base", "nft", "mint"],
    heroImageUrl: "https://chocolate-major-guan-717.mypinata.cloud/ipfs/bafybeieguywbhmer7aw4dpjw255bwfwnpnpbgxc7yqaemwpe7toef7zz7i",
    tagline: "Mint Based Vice Toads",
    ogTitle: "Vice Toads — Mint on Base",
    ogDescription: "Collect and mint your Vice Toad NFTs directly on Base. Limited supply.",
    ogImageUrl: "https://chocolate-major-guan-717.mypinata.cloud/ipfs/bafybeiauztb35v3h4bnj4yffviv4v2iwgk4wholxs2lghrt72i3lasuezm"
  },
} as const;
