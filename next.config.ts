import type { NextConfig } from "next";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  serverExternalPackages: ["argon2-browser"],
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };

      // argon2-browser loads WASM via one of these paths:
      // 1. global.loadArgon2WasmBinary (custom function)
      // 2. require('../dist/argon2.wasm') → base64 string → atob()
      // 3. fetch(global.argon2WasmPath) → ArrayBuffer
      //
      // We use path 3: copy the WASM to public/ and set the path at runtime.
      // Tell webpack to ignore the .wasm require (we'll handle it via fetch).
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /argon2\.wasm$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/wasm/[name][ext]',
        },
      });
    }
    return config;
  },
};

export default nextConfig;
