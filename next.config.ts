import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { hostname: 'images.unsplash.com' },
      { hostname: 'i.pravatar.cc' },
      { hostname: 'avatars.githubusercontent.com' },
      { hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/profile', permanent: false },
      { source: '/dashboard/posts', destination: '/profile', permanent: false },
    ];
  },
};

export default nextConfig;
