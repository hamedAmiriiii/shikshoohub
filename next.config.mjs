/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 15+: serverActions دیگر زیر experimental نیست
  serverActions: {
    bodySizeLimit: "10mb",
  },
  transpilePackages: [
    "framer-motion",
    "lucide-react",
    "@mui/material",
    "@mui/icons-material",
    "@nextui-org/react",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // AVIF را خاموش نگه‌دار تا ریسک بهینه‌سازی تصویر (GHSA-2xp9-vwfh-vxw4) کمتر شود
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.webinoplus.ir",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "api.webinoo-plus.ir",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "webinoplus.ir",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/landing/products/class",
        destination: "/landing/products/yadino",
        permanent: true,
      },
    ];
  },
  // PWA configuration
  async rewrites() {
    const api = (
      process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoo-plus.ir"
    ).replace(/\/$/, "");
    return [
      {
        source: "/api/oil/public/history/:phone",
        destination: `${api}/api/oil/public/history/:phone`,
      },
      {
        source: "/api/payments/zarinpal/callback",
        destination: `${api}/api/payments/zarinpal/callback`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/manifest-admin.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/manifest-oil.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/sw-oil.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/oil',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
