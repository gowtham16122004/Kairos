import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    tsconfigPaths(),
    TanStackRouterVite(),
    react(),
  ],
});
