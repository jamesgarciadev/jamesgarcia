import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages deployment (pure static site, no SSR)
  output: "export",
  allowedDevOrigins: ["frost-attribute-solid-rachel.trycloudflare.com"],
};

export default nextConfig;
