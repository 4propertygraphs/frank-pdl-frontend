// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/acquaint": {
        target: "https://www.acquaintcrm.co.uk",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/acquaint/, ""),
      },
    },
  },
});
