import type { NextConfig } from "next";

// Inside Docker, Next.js talks to the Spring Boot container over the internal
// bridge network. For local dev, fall back to the public-facing URL.
const BACKEND = process.env.INTERNAL_API_URL
  || process.env.NEXT_PUBLIC_API_URL
  || 'http://localhost:8080';

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  images: {
    remotePatterns: [
      { hostname: 'images.unsplash.com' },
      { hostname: 'i.pravatar.cc' },
      { hostname: 'avatars.githubusercontent.com' },
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: 'res.cloudinary.com' },
    ],
  },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/profile', permanent: false },
      { source: '/dashboard/posts', destination: '/profile', permanent: false },
    ];
  },
  async rewrites() {
    return [
      // Proxy the RSS feed and XML sitemap through Next.js so the raw
      // backend origin is never exposed to clients and the links work as
      // clean relative paths (/feed.xml, /sitemap.xml).
      {
        source: '/feed.xml',
        destination: `${BACKEND}/feed.xml`,
      },
      {
        source: '/sitemap.xml',
        destination: `${BACKEND}/sitemap.xml`,
      },
    ];
  },
};

export default nextConfig;

