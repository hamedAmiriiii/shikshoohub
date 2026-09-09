/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // 👈 افزایش حجم مجاز تا 10 مگابایت
    },
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
    domains: ['https://api.webinoo-plus.ir' , 'webinoplus.ir', 'api.webinoplus.ir'], // اضافه کردن هاست به لیست مجاز
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.webinoplus.ir',
        pathname: '/storage/**',
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
