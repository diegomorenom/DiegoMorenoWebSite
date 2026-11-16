import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false, // no exponer código fuente en producción
    cssMinify: true,
    assetsInlineLimit: 0, // compatible con CSP estricta (sin data: para fuentes/imagenes)
  },
  server: { port: 5173 },
});
