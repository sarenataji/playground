import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5177,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 5177,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Cache the unchanged engines independently of application edits.
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          if (!id.includes("node_modules/")) return;
          if (id.includes("/@rive-app/")) return "rive";
          if (id.includes("/gsap/") || id.includes("/@gsap/")) return "motion";
          if (/\/(react|react-dom|scheduler)\//.test(id)) return "react";
          // Preserve the Three.js module boundary; both chunks stay Witness-only.
          if (id.includes("/three/build/three.core.js")) return "three-core";
          if (id.includes("/three/")) return "three-renderer";
        },
      },
    },
  },
  appType: "spa",
});
