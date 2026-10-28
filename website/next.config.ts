import type { NextConfig } from "next";

// GITHUB_PAGES=true builds the static preview for GitHub Pages (same switch as admin/next.config.ts).
// PAGES_BASE_PATH lets the website and the admin preview share one Pages site under different sub-paths.
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? (process.env.PAGES_BASE_PATH ?? "/gip-platform") : "";
const backend = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

const nextConfig: NextConfig = {
  cacheComponents: !pages, // PPR cannot run in export mode
  partialPrefetching: !pages,
  ...(pages && { output: "export", basePath, trailingSlash: true }),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  images: {
    // Project photos and PDFs live in the client's Supabase storage; the old site hosts the location graphic.
    remotePatterns: [
      { protocol: "https", hostname: "jjskgxbshmjsfrowlzsj.supabase.co" },
      { protocol: "https", hostname: "www.greaterinfraprojects.in" },
    ],
    formats: ["image/avif", "image/webp"],
    ...(pages && { unoptimized: true }),
  },
  turbopack: {
    // The export can't run "use cache" (cacheComponents is off there): with the Supabase variables it reads the live
    // project at build time, uncached; without them it keeps the bundled data.
    ...(pages && {
      resolveAlias: {
        "@/lib/projects-backend": backend ? "./src/lib/projects-backend.reads.ts" : "./src/lib/projects-backend.static.ts",
      },
    }),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
