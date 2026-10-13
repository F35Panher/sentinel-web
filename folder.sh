#!/usr/bin/env bash set -euo pipefail
PROJECT="sentinel-web"
echo "Creating Chrome extension project: ${PROJECT}"
PROJECT="sentinel-web"
echo "Creating Chrome extension project: ${PROJECT}"
cat > "${PROJECT}/package.json" <<'EOF' { "name": "sentinel-web", "version": "0.1.0", "private": true, "description": "Privacy-first Chrome web protection extension", "type": "module", "scripts": { "dev": "vite", "build": "tsc --noEmit && vite build", "typecheck": "tsc --noEmit", "test": "vitest run" }, "devDependencies": { "@types/chrome": "^0.1.0", "typescript": "^5.0.0", "vite": "^6.0.0", "vitest": "^3.0.0" } } EOF
cat > "${PROJECT}/package.json" <<'EOF' { "name": "sentinel-web", "version": "0.1.0", "private": true, "description": "Privacy-first Chrome web protection extension", "type": "module", "scripts": { "dev": "vite", "build": "tsc --noEmit && vite build", "typecheck": "tsc --noEmit", "test": "vitest run" }, "devDependencies": { "@types/chrome": "^0.1.0", "typescript": "^5.0.0", "vite": "^6.0.0", "vitest": "^3.0.0" } } EOF
cat > "${PROJECT}/manifest.json" <<'EOF' { "manifestversion": 3, "name": "Sentinel Web Protection", "version": "0.1.0", "description": "Local-first tracker and malicious URL protection.", "permissions": ["storage"], "background": { "serviceworker": "src/background/service-worker.ts", "type": "module" }, "action": { "defaultpopup": "src/popup/popup.html", "defaulttitle": "Sentinel Web Protection" } } EOF
cat > "${PROJECT}/src/background/service-worker.ts" <<'EOF' chrome.runtime.onInstalled.addListener(() => { console.info("Sentinel Web Protection installed.");

void chrome.storage.local.get("protectionEnabled").then((result) => { if (typeof result.protectionEnabled !== "boolean") { return chrome.storage.local.set({ protectionEnabled: true }); } }); }); EOF
cat > "${PROJECT}/src/shared/types.ts" <<'EOF' export interface ProtectionSettings { protectionEnabled: boolean; }

export type ThreatClassification = | "malware" | "phishing" | "tracker" | "suspicious" | "unknown";

export interface ThreatLookupResult { classification: ThreatClassification; matched: boolean; sourceId?: string; expiresAt?: string; } EOF
cat > "${PROJECT}/src/popup/popup.html" <<'EOF' <!doctype html> <html lang="en"> <head> <meta charset="UTF-8" /> <meta name="viewport" content="width=device-width, initial-scale=1.0" /> <title>Sentinel Web Protection</title> </head> <body> <main class="container"> <h1>Sentinel</h1> <p class="subtitle">Web Protection</p>

<section class="status-card"> <span id="status-indicator" class="indicator"></span> <span id="status-text">Loading protection status...</span> </section>

<label class="toggle-row" for="protection-toggle"> <span>Protection enabled</span> <input id="protection-toggle" type="checkbox" /> </label>

<p id="message" role="status" aria-live="polite"></p> <p class="footer">Local-first protection</p> </main>

<script type="module" src="./popup.ts"></script> </body> </html> EOF
cat > "${PROJECT}/src/popup/popup.ts" <<'EOF' import "./popup.css";

const toggle = document.querySelector<HTMLInputElement>("#protection-toggle"); const statusText = document.querySelector<HTMLSpanElement>("#status-text"); const indicator = document.querySelector<HTMLSpanElement>("#status-indicator"); const message = document.querySelector<HTMLParagraphElement>("#message");

if (!toggle || !statusText || !indicator || !message) { throw new Error("Popup UI elements are missing."); }

function renderStatus(enabled: boolean): void { toggle.checked = enabled; statusText.textContent = enabled ? "Protection is enabled" : "Protection is disabled";

indicator.classList.toggle("enabled", enabled); indicator.classList.toggle("disabled", !enabled); }

async function loadSettings(): Promise<void> { const result = await chrome.storage.local.get("protectionEnabled"); const enabled = result.protectionEnabled !== false;

renderStatus(enabled); }

toggle.addEventListener("change", () => { void chrome.storage.local .set({ protectionEnabled: toggle.checked }) .then(() => { renderStatus(toggle.checked); message.textContent = "Settings saved."; }) .catch(() => { message.textContent = "Could not save settings."; void loadSettings(); }); });

void loadSettings().catch(() => { statusText.textContent = "Unable to load settings"; message.textContent = "Check the extension's permissions."; }); EOF
cat > "${PROJECT}/src/popup/popup.css" <<'EOF' :root { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; background: #f7f9fc; }

{
box-sizing: border-box; }

body { width: 320px; margin: 0; }

.container { padding: 20px; }

h1 { margin: 0; font-size: 24px; }

.subtitle { margin: 4px 0 20px; color: #667085; }

.status-card { display: flex; align-items: center; gap: 10px; padding: 14px; background: white; border: 1px solid #e3e8ef; border-radius: 10px; }

.indicator { width: 10px; height: 10px; flex: 0 0 10px; border-radius: 50%; }

.indicator.enabled { background: #16a34a; }

.indicator.disabled { background: #dc2626; }

.toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 18px; font-size: 14px; }

input[type="checkbox"] { width: 18px; height: 18px; accent-color: #2563eb; }

#message { min-height: 18px; color: #475467; font-size: 12px; }

.footer { margin-top: 20px; color: #667085; font-size: 11px; text-align: center; } EOF
cat > "${PROJECT}/vite.config.ts" <<'EOF' import { resolve } from "node:path"; import { defineConfig } from "vite";

export default defineConfig({ build: { outDir: "dist", emptyOutDir: true, rollupOptions: { input: { popup: resolve(dirname, "src/popup/popup.html"), background: resolve(dirname, "src/background/service-worker.ts") }, output: { entryFileNames: (chunk) => chunk.name === "background" ? "background/service-worker.js" : "assets/[name]-[hash].js", chunkFileNames: "assets/[name]-[hash].js", assetFileNames: "assets/[name]-[hash][extname]" } } } }); EOF
cat > "${PROJECT}/README.md" <<'EOF'
