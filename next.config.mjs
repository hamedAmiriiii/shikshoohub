/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // 👈 افزایش حجم مجاز تا 10 مگابایت
    },
  },
    typescript: {
        ignoreBuildErrors: true,
  },
  images: {
    domains: ['https://api.webinoplus.ir' , 'webinoplus.ir', 'api.webinoplus.ir'], // اضافه کردن هاست به لیست مجاز
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.webinoplus.ir',
        pathname: '/storage/**',
      },
    ],
  },
  // PWA configuration
  async rewrites() {
    const api = (
      process.env.NEXT_PUBLIC_BASE_URL || "https://api.webinoplus.ir"
    ).replace(/\/$/, "");
    return [
      {
        source: "/api/oil/public/history/:phone",
        destination: `${api}/api/oil/public/history/:phone`,
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
