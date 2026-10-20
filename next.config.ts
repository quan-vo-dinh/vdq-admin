import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel's Next 16.3 adapter owns packaging; standalone is for self-hosting.
  output: process.env.VERCEL ? undefined : "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Instant Navigations (Next.js 16.3): App Shells, Partial Prefetching, Instant Insights
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Retry soft navigations / fetches / Server Actions when connectivity returns
    useOffline: true,
    // Faster React Compiler path inside Turbopack (experimental)
    turbopackRustReactCompiler: true,
  },
  // Build-time React Compiler (pairs with turbopackRustReactCompiler)
  reactCompiler: true,
};

export default nextConfig;
