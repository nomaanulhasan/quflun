import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["argon2-browser"],
  // Empty turbopack config silences the warning about webpack config.
  // Production builds use --webpack flag; Turbopack still works for dev.
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
      // Exclude argon2-browser from client bundle — it uses Emscripten WASM
      // loading that is incompatible with webpack's native WASM handling.
      // argon2-browser is loaded dynamically at runtime in the browser.
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : []),
        'argon2-browser',
      ];
    }
    return config;
  },
};

export default nextConfig;
