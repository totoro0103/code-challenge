/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build:demo` produces one self-contained HTML file (fonts, icons
// and code inlined) that runs by double-clicking it, even offline.
export default defineConfig(({ mode }) => ({
  plugins: mode === "demo" ? [react(), viteSingleFile()] : [react()],
  build: mode === "demo" ? { outDir: "demo", assetsInlineLimit: 1e9 } : {},
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
}));
