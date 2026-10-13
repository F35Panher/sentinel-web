/**
 * Sentinel URL normalization utilities.
 *
 * Security notes:
 * - Accepts only HTTP and HTTPS URLs.
 * - Does not fetch or visit submitted URLs.
 * - Removes fragments because they are not sent to web servers.
 * - Preserves paths and query parameters for exact URL matching.
 * - Does not treat arbitrary suffix matches as domain matches.
 */

/**
 * Result of normalizing a URL.
 */
export interface NormalizedUrl {
  /** Canonical URL suitable for exact URL indicator matching. */
  url: string;

  /** Canonical hostname, without a trailing dot. */
  hostname: string;

  /** Allowed URL protocol. */
  protocol: "http:" | "https:";
}

export type UrlNormalizationError =
  | "empty_input"
  | "invalid_url"
  | "unsupported_protocol"
  | "invalid_hostname";

export type UrlNormalizationResult =
  | {
      success: true;
      value: NormalizedUrl;
    }
  | {
      success: false;
      error: UrlNormalizationError;
      message: string;
    };

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Normalize an HTTP(S) URL for reputation matching.
 *
 * The input must include a scheme, e.g. https://example.com.
 * This function performs no network requests.
 */
export function normalizeUrl(input: string): UrlNormalizationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      success: false,
      error: "empty_input",
      message: "Enter a URL to check.",
    };
  }

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      success: false,
      error: "invalid_url",
      message: "Enter a valid URL including http:// or https://.",
    };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return {
      success: false,
      error: "unsupported_protocol",
      message: "Only HTTP and HTTPS URLs can be checked.",
    };
  }

  if (parsed.username || parsed.password) {
    return {
      success: false,
      error: "invalid_url",
      message:
        "URLs containing embedded usernames or passwords are not accepted.",
    };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");

  if (!hostname || hostname.includes("..")) {
    return {
      success: false,
      error: "invalid_hostname",
      message: "The URL contains an invalid hostname.",
    };
  }

  // Remove a trailing dot from the canonical URL as well.
  parsed.hostname = hostname;

  // Fragments are not sent to the web server.
  parsed.hash = "";

  return {
    success: true,
    value: {
      url: parsed.href,
      hostname,
      protocol: parsed.protocol as "http:" | "https:",
    },
  };
}

/**
 * Determine whether a hostname matches a domain indicator.
 *
 * Matches the domain itself and its subdomains:
 * example.com       -> true
 * login.example.com -> true
 * notexample.com    -> false
 * example.com.evil  -> false
 */
export function hostnameMatchesDomain(
  hostname: string,
  indicatorDomain: string,
): boolean {
  const normalizedHostname = normalizeHostname(hostname);
  const normalizedDomain = normalizeHostname(indicatorDomain);

  if (!normalizedHostname || !normalizedDomain) {
    return false;
  }

  return (
    normalizedHostname === normalizedDomain ||
    normalizedHostname.endsWith(`.${normalizedDomain}`)
  );
}

/**
 * Normalize a hostname or domain indicator.
 *
 * Indicator values must be hostnames, not full URLs or wildcard patterns.
 */
export function normalizeHostname(input: string): string | null {
  const value = input.trim().toLowerCase().replace(/\.$/, "");

  if (
    !value ||
    value.includes("/") ||
    value.includes("@") ||
    value.includes("*") ||
    value.includes(":") ||
    /\s/.test(value)
  ) {
    return null;
  }

  try {
    // URL parsing canonicalizes internationalized domain names.
    const parsed = new URL(`https://${value}/`);
    const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");

    if (!hostname || hostname.includes("..")) {
      return null;
    }

    return hostname;
  } catch {
    return null;
  }
}