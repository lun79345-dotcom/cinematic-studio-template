/** @type {import('next').NextConfig} */
const rawBasePath = process.env.BASE_PATH || "";
const basePath = rawBasePath
  ? `/${rawBasePath.replace(/^\/+|\/+$/g, "")}`
  : "";
const developmentDistDir = process.env.NODE_ENV === "development" && basePath
  ? `.next-${basePath.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "")}`
  : ".next";

const nextConfig = {
  ...(process.env.NEXT_STANDALONE === "true" ? { output: "standalone" } : {}),
  // Keep concurrent root-path and BASE_PATH dev servers from sharing manifests.
  // Production always uses .next so the standalone Docker copy paths stay stable.
  distDir: developmentDistDir,
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/uploads/:path*",
          destination: "/api/public-files/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
