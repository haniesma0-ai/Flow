import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./", // pour que les chemins fonctionnent si tu déploies dans un sous-dossier
  plugins: [react()], // juste le plugin officiel React
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // permet d'importer avec @
    },
  },
});