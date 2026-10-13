mport "./popup.css";

const toggle = document.querySelector<HTMLInputElement>( "#protection-toggle" ); const statusText = document.querySelector<HTMLHeadingElement>( "#status-text" ); const statusDescription = document.querySelector<HTMLParagraphElement>( "#status-description" ); const indicator = document.querySelector<HTMLSpanElement>( "#status-indicator" ); const message = document.querySelector<HTMLParagraphElement>( "#message" );

if ( !toggle || !statusText || !statusDescription || !indicator || !message ) { throw new Error("Sentinel popup UI elements are missing."); }

function renderStatus(enabled: boolean): void { toggle.checked = enabled;

statusText.textContent = enabled ? "Protection is enabled" : "Protection is disabled";

statusDescription.textContent = enabled ? "Your protection preference is active." : "Protection features are switched off.";

indicator.classList.toggle("enabled", enabled); indicator.classList.toggle("disabled", !enabled); }

async function loadSettings(): Promise<void> { toggle.disabled = true; message.textContent = "";

try { const result = await chrome.storage.local.get( "protectionEnabled" );

const enabled = result.protectionEnabled !== false;

renderStatus(enabled); toggle.disabled = false; } catch (error: unknown) { console.error("Unable to load Sentinel settings:", error);

statusText.textContent = "Settings unavailable"; statusDescription.textContent = "Could not read your saved preferences."; message.textContent = "Please reload the extension.";

toggle.disabled = true; } }

toggle.addEventListener("change", async () => { const enabled = toggle.checked;

toggle.disabled = true; message.textContent = "Saving settings...";

try { await chrome.storage.local.set({ protectionEnabled: enabled });

renderStatus(enabled); message.textContent = "Settings saved."; } catch (error: unknown) { console.error("Unable to save Sentinel settings:", error);

message.textContent = "Could not save settings."; await loadSettings(); } finally { toggle.disabled = false; } });

void loadSettings();