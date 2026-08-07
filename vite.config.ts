import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "We Out Here 2026 — Field Notes",
        short_name: "Field Notes",
        start_url: "/",
        display: "standalone",
        background_color: "#f4f0e6",
        theme_color: "#1d201c",
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
  },
});
