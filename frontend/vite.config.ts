import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: { outDir: "../bookit/public", emptyOutDir: true },
  server: {
    host: "127.0.0.1",
    port: 3001,
    strictPort: true,
    proxy: { "/api": process.env.BOOKIT_URL ?? "http://127.0.0.1:8080" },
  },
});
