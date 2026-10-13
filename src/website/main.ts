import "./style.css";

const form = document.querySelector<HTMLFormElement>("#url-form"); const input = document.querySelector<HTMLInputElement>("#url-input"); const result = document.querySelector<HTMLDivElement>("#url-result");

if (!form || !input || !result) { throw new Error("Sentinel website elements are missing."); }

function showResult(message: string, kind: "info" | "warning"): void { result.hidden = false; result.textContent = message; result.className = url-result ${kind}; }

function normalizeUrl(value: string): URL | null { try { const url = new URL(value.trim());

if (url.protocol !== "https:" && url.protocol !== "http:") { return null; }

if (!url.hostname || !url.hostname.includes(".")) { return null; }

return url; } catch { return null; } }

form.addEventListener("submit", (event: SubmitEvent) => { event.preventDefault();

const submittedValue = input.value.trim(); const url = normalizeUrl(submittedValue);

if (!url) { showResult( "Enter a valid HTTP or HTTPS website URL.", "warning" ); return; }

showResult( URL format accepted: ${url.hostname}. Reputation checking is not connected yet, so Sentinel cannot determine whether this link is malicious., "info" ); });

const extensionLink = document.querySelector<HTMLAnchorElement>("#extension-link");

if (extensionLink) { extensionLink.addEventListener("click", (event: MouseEvent) => { if (extensionLink.getAttribute("aria-disabled") === "true") { event.preventDefault(); } }); }