// @ts-check
import { serwist } from "@serwist/next/config";

export default serwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // Precache all static export routes automatically
  // No additional entries needed — Serwist detects them from the build output
});
