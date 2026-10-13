export interface UrlhausRecord {
  id: string;
  url: string;
  date_added: string;
  threat: string;
  tags: string[] | null;
  url_status: string;
}

const URLHAUS_API_URL =
  "https://urlhaus-api.abuse.ch/v1/urls/recent/";

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseRecord(value: unknown): UrlhausRecord | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.id !== "string" &&
    typeof value.id !== "number"
  ) {
    return null;
  }

  if (
    typeof value.url !== "string" ||
    typeof value.date_added !== "string" ||
    typeof value.threat !== "string" ||
    typeof value.url_status !== "string"
  ) {
    return null;
  }

  if (!Number.isFinite(Date.parse(value.date_added))) {
    return null;
  }

  if (
    value.tags != null &&
    (!Array.isArray(value.tags) ||
      !value.tags.every((tag) => typeof tag === "string"))
  ) {
    return null;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value.url);
  } catch {
    return null;
  }

  if (
    parsedUrl.protocol !== "http:" &&
    parsedUrl.protocol !== "https:"
  ) {
    return null;
  }

  if (parsedUrl.username || parsedUrl.password) {
    return null;
  }

  return {
    id: String(value.id),
    url: parsedUrl.href,
    date_added: value.date_added,
    threat: value.threat,
    tags: (value.tags as string[] | null | undefined) ?? null,
    url_status: value.url_status,
  };
}

export async function fetchUrlhausRecords(
  apiKey: string,
): Promise<UrlhausRecord[]> {
  if (!apiKey.trim()) {
    throw new Error("URLHAUS_AUTH_KEY is not configured.");
  }

  const response = await fetch(URLHAUS_API_URL, {
    method: "GET",
    headers: {
      "Auth-Key": apiKey,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
  const details = await response.text();

  throw new Error(
    `URLhaus request failed with HTTP ${response.status}: ${
      details.slice(0, 500)
    }`,
  );
}

  const payload: unknown = await response.json();

  if (!isRecord(payload)) {
    throw new Error("URLhaus returned an invalid response.");
  }

  if (payload.query_status !== "ok") {
    throw new Error(
      `URLhaus query was unsuccessful: ${String(payload.query_status)}`,
    );
  }

  if (!Array.isArray(payload.urls)) {
    throw new Error("URLhaus response is missing its URLs array.");
  }

  const records: UrlhausRecord[] = [];

  for (const item of payload.urls) {
    const record = parseRecord(item);
    if (record) records.push(record);
  }

  if (payload.urls.length > 0 && records.length === 0) {
    throw new Error(
      "URLhaus returned records, but none passed validation.",
    );
  }

  return records;
}