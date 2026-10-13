import { copyFileSync, mkdirSync } from "node:fs"; import { dirname, resolve } from "node:path"; import { fileURLToPath } from "node:url"; import { defineConfig } from "vite";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({ root: projectRoot, publicDir: resolve(projectRoot, "public"),

plugins: [ { name: "sentinel-extension-manifest", closeBundle() { const distDir = resolve(projectRoot, "dist"); const backgroundDir = resolve(distDir, "background");

mkdirSync(backgroundDir, { recursive: true });

copyFileSync( resolve(projectRoot, "manifest.json"), resolve(distDir, "manifest.json") ); } } ],

build: { outDir: resolve(projectRoot, "dist"), emptyOutDir: true,

rollupOptions: { input: { website: resolve(projectRoot, "index.html"), popup: resolve(projectRoot, "src/popup/popup.html"), background: resolve( projectRoot, "src/background/service-worker.ts" ) },

output: { entryFileNames: (chunk) => { if (chunk.name === "background") { return "background/service-worker.js"; }

return "assets/[name]-[hash].js"; },

chunkFileNames: "assets/[name]-[hash].js", assetFileNames: "assets/[name]-[hash][extname]" } } } });