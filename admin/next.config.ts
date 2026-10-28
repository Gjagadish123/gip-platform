import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

// GITHUB_PAGES=true builds the static client preview served at https://gjagadish123.github.io/gip-platform/
// (see .github/workflows/deploy-admin-pages.yml). Normal builds keep the server features.
const pages = process.env.GITHUB_PAGES === "true";
const basePath = pages ? "/gip-platform" : "";

const nextConfig: NextConfig = {
  cacheComponents: !pages, // PPR cannot run in export mode
  partialPrefetching: !pages,
  ...(pages && { output: "export", basePath, trailingSlash: true, images: { unoptimized: true } }),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  turbopack: {
    // The repo root now has its own package-lock.json (Supabase CLI); without this Next takes it as the workspace root.
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// A real deploy missing either Supabase variable would quietly ship the localStorage demo: fail the build instead.
// The Pages preview (GITHUB_PAGES=true) is the only build that may be the demo.
export default function config(phase: string): NextConfig {
  const backend = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (phase === PHASE_PRODUCTION_BUILD && !pages && !backend) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or GITHUB_PAGES=true for the demo).");
  }
  return nextConfig;
}
