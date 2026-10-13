import { copyFileSync } from "node:fs"; import { resolve } from "node:path"; import { defineConfig } from "vite";

export default defineConfig({ publicDir: "public",

plugins: [ { name: "copy-extension-manifest", closeBundle() { copyFileSync( resolve(dirname, "manifest.json"), resolve(dirname, "dist/manifest.json") ); } } ],

build: { outDir: "dist", emptyOutDir: true,

rollupOptions: { input: { popup: resolve(dirname, "src/popup/popup.html"), background: resolve( dirname, "src/background/service-worker.ts" ) },

output: { entryFileNames: (chunk) => { if (chunk.name === "background") { return "background/service-worker.js"; }

return "assets/[name]-[hash].js"; },

chunkFileNames: "assets/[name]-[hash].js",

assetFileNames: "assets/[name]-[hash][extname]" } } } });