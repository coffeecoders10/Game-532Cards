import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  basePath: "/card-games",
  images: { unoptimized: true },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
