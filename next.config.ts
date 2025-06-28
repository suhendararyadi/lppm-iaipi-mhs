/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'iaipersis.ac.id',
      },
      {
        protocol: 'https',
        hostname: 'api-lppm-1.suhendararyadi.com',
      },
    ],
  },
};

export default nextConfig;
