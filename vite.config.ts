import { defineConfig, loadEnv } from "vite";
import notesHandler from "./api/notes.js";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
  plugins: [react(), {
    name: "notes-local-api",
    configureServer(server) {
      server.middlewares.use("/api/notes", async (req, res) => {
        let raw = "";
        try {
          for await (const chunk of req) {
            raw += chunk;
            if (raw.length > 8192) { res.statusCode = 413; res.end(); return; }
          }
          req.body = raw;
          res.status = (code) => { res.statusCode = code; return res; };
          res.json = (value) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(value)); };
          await notesHandler(req, res);
        } catch { res.statusCode = 500; res.end(); }
      });
    },
  }],
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
};
});
