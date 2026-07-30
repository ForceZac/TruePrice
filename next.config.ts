import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set project root to avoid workspace-level lockfile detection
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
