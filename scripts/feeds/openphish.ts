export interface OpenPhishRecord {
  url: string;
}

const OPENPHISH_FEED_URL =
  "https://raw.githubusercontent.com/openphish/public_feed/refs/heads/main/feed.txt";

export async function fetchOpenPhishRecords(): Promise<OpenPhishRecord[]> {
  const response = await fetch(OPENPHISH_FEED_URL, {
    headers: {
      Accept: "text/plain",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `OpenPhish request failed with HTTP ${response.status}.`,
    );
  }

  const body = await response.text();

  if (!body.trim()) {
    throw new Error("OpenPhish returned an empty feed.");
  }

  const records: OpenPhishRecord[] = [];
  const seen = new Set<string>();

  for (const line of body.split(/\r?\n/)) {
    const value = line.trim();

    if (!value) continue;

    try {
      const url = new URL(value);

      if (
        (url.protocol !== "http:" && url.protocol !== "https:") ||
        url.username ||
        url.password ||
        !url.hostname.includes(".")
      ) {
        continue;
      }

      const normalizedUrl = url.href;

      if (seen.has(normalizedUrl)) continue;

      seen.add(normalizedUrl);
      records.push({ url: normalizedUrl });
    } catch {
      // Ignore malformed feed lines.
    }
  }

  if (records.length === 0) {
    throw new Error(
      "OpenPhish returned no valid phishing URLs.",
    );
  }

  return records;
}