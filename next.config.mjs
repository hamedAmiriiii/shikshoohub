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
    domains: ['https://webinoplus.ir' , 'webinoplus.ir', 'api.webinoplus.ir'], // اضافه کردن هاست به لیست مجاز
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.webinoplus.ir',
        pathname: '/storage/**',
      },
    ],
  },
  // PWA configuration
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};

export default nextConfig;


