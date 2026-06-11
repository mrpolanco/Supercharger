import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { API_PORT, listenerHostForEnabled, resolveLocalAccessEnabled, WEB_PORT } from "../local-access-config.js";

const localAccessEnabled = resolveLocalAccessEnabled();
const host = process.env.HOST || listenerHostForEnabled(localAccessEnabled);

export default defineConfig({
  plugins: [react()],
  server: {
    host,
    port: WEB_PORT,
    proxy: {
      "/api": `http://localhost:${API_PORT}`,
      "/term": { target: `ws://localhost:${API_PORT}`, ws: true },
    },
  },
});
