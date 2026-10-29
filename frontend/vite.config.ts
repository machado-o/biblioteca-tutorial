import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // em desenvolvimento, o Vite (porta 5173) repassa /api para o backend (porta 3000)
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
