import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      srcDir: "src",
      filename: "sw.js",
      strategies: "injectManifest",

      devOptions: {
        enabled: true,
      },

      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
      },
      manifest: {
        name: "Baltic Breeze",
        short_name: "BBH",
        description: "Hotel booking application for Baltic Breeze",
        theme_color: "#173a70ff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
