import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [
      { source: "/poster", destination: "/poster_en.html" },
      { source: "/poster-chile", destination: "/poster_chile.html" },
    ];
  },
};

export default nextConfig;
