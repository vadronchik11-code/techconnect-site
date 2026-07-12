/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    return {
      // `beforeFiles` so every /uploads/* request hits the dynamic route handler
      // instead of Next's static /public serving (which caches the file list at
      // boot and 404s on anything uploaded after the server started).
      beforeFiles: [
        { source: '/uploads/:path*', destination: '/api/uploads/:path*' },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
