import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
const inDocker =
  process.env.VITE_DOCKER === "true" || fs.existsSync("/.dockerenv");

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["federico-system-inventary.space", "localhost"],
    watch: {
      ignored: ["**/.git/**"],
    },
    fs: {
      deny: [".git"],
    },
  },
  plugins: [
    react(),
    mode === "development" && !inDocker && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
