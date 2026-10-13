import type { ProtectionSettings } from "../shared/types";

const DEFAULT_SETTINGS: ProtectionSettings = { protectionEnabled: true };

/*

Initialize default settings when Sentinel is installed or upgraded.
Existing user settings are preserved.
*/ 
async function initializeSettings(): Promise<void> { const current = await chrome.storage.local.get("protectionEnabled");

if (typeof current.protectionEnabled !== "boolean") { await chrome.storage.local.set(DEFAULT_SETTINGS); }

console.info("Sentinel Web Protection initialized."); }

/*

Handle first installation and extension upgrades.
*/
 chrome.runtime.onInstalled.addListener((details) => { console.info( Sentinel Web Protection event: ${details.reason} );

void initializeSettings().catch((error: unknown) => { console.error( "Failed to initialize Sentinel settings:", error ); }); });

/*

Handle extension startup.
Manifest V3 service workers may stop and restart, so do not
rely on in-memory state persisting between executions.
*/ 
chrome.runtime.onStartup.addListener(() => { void initializeSettings().catch((error: unknown) => { console.error( "Failed to initialize settings on startup:", error ); }); });