import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In the cluster, nginx serves the built files and proxies /api to the api
// Service. This dev proxy only matters if you run `npm run dev` locally.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
