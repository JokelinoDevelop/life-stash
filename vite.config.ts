import { execSync } from "node:child_process";
import path from "node:path";

import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Baked into the client and the worker so Settings and /api/version show what is deployed.
// pnpm sets npm_package_version from package.json (scripts/release.ts bumps it before building).
const version = process.env.npm_package_version ?? "dev";

const commit = (() => {
  try {
    // oxlint-disable-next-line sonarjs/no-os-command-from-path -- build-time call to the local git
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
})();

// Chrome's per-scheme manifest colours (not in vite-plugin-pwa's types yet):
// the splash and title bar follow dark mode where supported.
const darkSchemeManifest = {
  user_preferences: {
    color_scheme_dark: { background_color: "#07080a", theme_color: "#07080a" },
  },
};

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "src/client/routes",
      generatedRouteTree: "src/client/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    cloudflare(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/client",
      filename: "sw.ts",
      registerType: "prompt",
      injectRegister: false,
      manifest: {
        name: "LifeStash",
        short_name: "LifeStash",
        description: "Records and reminders that make everyday life easier.",
        // The phone canvas (THEME_COLORS in src/client/app/theme-colors.ts), so the
        // splash and status bar match the app; Chrome reads the dark pair below.
        theme_color: "#f1f2f5",
        background_color: "#f1f2f5",
        ...darkSchemeManifest,
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // The invoice PDF renderer (~1.2 MB) and the preview's pdf.js (~0.4 MB, plus its
        // .mjs worker) load only when previewing or issuing an invoice; don't make every
        // install download them up front.
        globIgnores: ["**/render-invoice-pdf-*.js", "**/draw-pdf-pages-*.js"],
      },
      devOptions: { enabled: false, type: "module" },
    }),
  ],
  define: {
    __APP_COMMIT__: JSON.stringify(commit),
    __APP_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src/client"),
      "@shared": path.resolve(import.meta.dirname, "src/shared"),
    },
  },
});
