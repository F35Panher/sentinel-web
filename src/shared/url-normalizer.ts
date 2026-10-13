/*

Sentinel URL normalization utilities.

*

Security notes:
- Accepts only HTTP and HTTPS URLs.
- Does not fetch or visit submitted URLs.
- Removes fragments because they are not sent to web servers.
- Preserves paths and query parameters for exact URL matching.
- Does not treat arbitrary suffix matches as domain matches.

*/

export interface NormalizedUrl { / Canonical URL suitable for exact URL indicator matching. */ url: string;

/* Canonical hostname, without a trailing dot. */ hostname: string;

/* HTTP or HTTPS protocol. */ protocol: "http:" | "https:"; }

export type UrlNormalizationError = | "emptyinput" | "invalidurl" | "unsupportedprotocol" | "invalidhostname";

export type UrlNormalizationResult = | { success: true; value: NormalizedUrl; } | { success: false; error: UrlNormalizationError; message: string; };

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/*

Normalize an HTTP(S) URL for reputation matching.

*

The input must include a scheme, e.g. https://example.com.
This function performs no network requests.

*/ export function normalizeUrl(input: string): UrlNormalizationResult { const trimmed = input.trim();

if (!trimmed) { return { success: false, error: "empty_input", message: "Enter a URL to check.", }; }

let parsed: URL;

try { parsed = new URL(trimmed); } catch { return { success: false, error: "invalid_url", message: "Enter a valid URL including http:// or https://.", }; }

if (!ALLOWEDPROTOCOLS.has(parsed.protocol)) { return { success: false, error: "unsupportedprotocol", message: "Only HTTP and HTTPS URLs can be checked.", }; }

const hostname = parsed.hostname.toLowerCase().replace(/.$/, "");

if (!hostname || hostname.includes("..")) { return { success: false, error: "invalid_hostname", message: "The URL contains an invalid hostname.", }; }

// URL.hostname is normally an ASCII hostname for internationalized // domains. Reject credentials to avoid misleading pasted URLs. if (parsed.username || parsed.password) { return { success: false, error: "invalid_url", message: "URLs containing embedded usernames or passwords are not accepted.", }; }

parsed.hash = "";

// URL parsing already canonicalizes many URL components. // Keep query parameters and paths because they may be security-relevant. return { success: true, value: { url: parsed.href, hostname, protocol: parsed.protocol as "http:" | "https:", }, }; }

/*

Determine whether a hostname matches a domain indicator.

*

Matches the domain itself and its subdomains:
example.com -> true
login.example.com -> true
notexample.com -> false
example.com.evil -> false

*/ 
export function hostnameMatchesDomain( hostname: string, indicatorDomain: string, ): boolean { const normalizedHostname = normalizeHostname(hostname); const normalizedDomain = normalizeHostname(indicatorDomain);

if (!normalizedHostname || !normalizedDomain) { return false; }

return ( normalizedHostname === normalizedDomain || normalizedHostname.endsWith(.${normalizedDomain}) ); }

/*

Normalize a hostname or domain indicator.

*

Indicator values must be hostnames, not full URLs or wildcard patterns.

*/ 
export function normalizeHostname(input: string): string | null { const value = input.trim().toLowerCase().replace(/.$/, "");

if ( !value || value.includes("/") || value.includes("@") || value.includes("*") || value.includes(":") || /\s/.test(value) ) { return null; }

try { // Parsing through URL handles internationalized domain names. const parsed = new URL(https://${value}/);

if ( parsed.hostname !== value && parsed.hostname.toLowerCase() !== value ) { // Permit URL's IDN conversion only if the parsed hostname is valid. return parsed.hostname.toLowerCase().replace(/.$/, ""); }

return parsed.hostname.toLowerCase().replace(/.$/, ""); } catch { return null; } }