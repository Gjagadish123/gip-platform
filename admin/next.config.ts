import type { NextConfig } from "next";

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
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
