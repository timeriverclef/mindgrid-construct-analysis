import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { mindGridPwa } from "./scripts/pwa-build";
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), mindGridPwa()],
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  server: { host: "127.0.0.1", port: 3000 },
});
