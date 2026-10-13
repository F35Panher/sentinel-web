import type { ProtectionSettings } from "../shared/types";

const DEFAULT_SETTINGS: ProtectionSettings = { protectionEnabled: true };

async function initializeSettings(): Promise<void> { const current = await chrome.storage.local.get("protectionEnabled");

if (typeof current.protectionEnabled !== "boolean") { await chrome.storage.local.set(DEFAULT_SETTINGS); }

console.info("Sentinel Web Protection initialized."); }

chrome.runtime.onInstalled.addListener((details) => { console.info( Sentinel Web Protection event: ${details.reason} );

void initializeSettings().catch((error: unknown) => { console.error( "Failed to initialize Sentinel settings:", error ); }); });

chrome.runtime.onStartup.addListener(() => { void initializeSettings().catch((error: unknown) => { console.error( "Failed to initialize settings on startup:", error ); }); });