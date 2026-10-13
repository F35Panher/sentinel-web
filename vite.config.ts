import { copyFileSync } from "node:fs"; import { dirname, resolve } from "node:path"; import { fileURLToPath } from "node:url"; import { defineConfig } from "vite";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({ root: projectRoot, publicDir: resolve(projectRoot, "public"),

plugins: [ { name: "copy-extension-manifest", closeBundle() { copyFileSync( resolve(projectRoot, "manifest.json"), resolve(projectRoot, "dist/manifest.json") ); } } ],

build: { outDir: resolve(projectRoot, "dist"), emptyOutDir: true,

rollupOptions: { input: { popup: resolve(projectRoot, "src/popup/popup.html"), background: resolve( projectRoot, "src/background/service-worker.ts" ) },

output: { entryFileNames: (chunk) => { if (chunk.name === "background") { return "background/service-worker.js"; }

return "assets/[name]-[hash].js"; },

chunkFileNames: "assets/[name]-[hash].js", assetFileNames: "assets/[name]-[hash][extname]" } } } });