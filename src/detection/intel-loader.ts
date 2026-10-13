import type {
  ThreatIndicator,
  ThreatIntelDataset,
} from "../shared/types";

const INTEL_URL = "/intel/threat-intel.json";

const VALID_CLASSIFICATIONS = new Set([
  "malware",
  "phishing",
  "tracker",
  "suspicious",
  "unknown",
]);

const VALID_INDICATOR_TYPES = new Set(["domain", "url"]);

const VALID_SOURCE_TYPES = new Set([
  "synthetic",
  "public_feed",
  "commercial_provider",
  "community",
]);

export class ThreatIntelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ThreatIntelError";
  }
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isValidDate(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function isIndicator(value: unknown): value is ThreatIndicator {
  if (!isRecord(value)) return false;

  if (
    typeof value.id !== "string" ||
    !value.id.trim() ||
    typeof value.value !== "string" ||
    !value.value.trim() ||
    typeof value.sourceId !== "string" ||
    !value.sourceId.trim() ||
    typeof value.description !== "string" ||
    !VALID_INDICATOR_TYPES.has(String(value.indicatorType)) ||
    !VALID_CLASSIFICATIONS.has(String(value.classification)) ||
    !VALID_SOURCE_TYPES.has(String(value.sourceType))
  ) {
    return false;
  }

  if (
    value.confidence !== undefined &&
    (
      typeof value.confidence !== "number" ||
      !Number.isFinite(value.confidence) ||
      value.confidence < 0 ||
      value.confidence > 100
    )
  ) {
    return false;
  }

  if (
    value.firstSeenAt !== undefined &&
    !isValidDate(value.firstSeenAt)
  ) {
    return false;
  }

  if (
    value.expiresAt !== undefined &&
    !isValidDate(value.expiresAt)
  ) {
    return false;
  }

  return true;
}

function validateDataset(
  value: unknown,
): ThreatIntelDataset {
  if (!isRecord(value)) {
    throw new ThreatIntelError(
      "The threat-intelligence response must be a JSON object.",
    );
  }

  if (value.schemaVersion !== 1) {
    throw new ThreatIntelError(
      `Unsupported schemaVersion: ${String(value.schemaVersion)}. Expected 1.`,
    );
  }

  if (
    typeof value.version !== "string" ||
    !value.version.trim()
  ) {
    throw new ThreatIntelError(
      "The dataset is missing a valid version string.",
    );
  }

  if (
    value.status !== "ready" &&
    value.status !== "not_initialized"
  ) {
    throw new ThreatIntelError(
      `Invalid dataset status: ${String(value.status)}.`,
    );
  }

  if (!Array.isArray(value.sources)) {
    throw new ThreatIntelError(
      'The dataset field "sources" must be an array.',
    );
  }

  if (!Array.isArray(value.indicators)) {
    throw new ThreatIntelError(
      'The dataset field "indicators" must be an array.',
    );
  }

  if (!isValidDate(value.generatedAt)) {
    throw new ThreatIntelError(
      "The dataset must contain a valid generatedAt timestamp.",
    );
  }

  if (
    value.expiresAt !== null &&
    !isValidDate(value.expiresAt)
  ) {
    throw new ThreatIntelError(
      "The dataset expiresAt must be a valid timestamp or null.",
    );
  }

  if (!value.indicators.every(isIndicator)) {
    throw new ThreatIntelError(
      "The dataset contains an invalid indicator. Check indicatorType, sourceType, classification, and required fields.",
    );
  }

  const indicators = value.indicators as ThreatIndicator[];
  const ids = indicators.map((indicator) => indicator.id);

  if (new Set(ids).size !== ids.length) {
    throw new ThreatIntelError(
      "The dataset contains duplicate indicator IDs.",
    );
  }

  if (value.status === "ready") {
    if (value.sources.length === 0 || indicators.length === 0) {
      throw new ThreatIntelError(
        "A ready dataset must contain at least one source and one indicator.",
      );
    }

    if (
      value.expiresAt !== null &&
      Date.parse(value.expiresAt as string) <=
        Date.parse(value.generatedAt as string)
    ) {
      throw new ThreatIntelError(
        "A ready dataset must expire after its generation time.",
      );
    }
  }

  return value as unknown as ThreatIntelDataset;
}

export async function loadThreatIntel(): Promise<ThreatIntelDataset> {
  let response: Response;

  try {
    response = await fetch(INTEL_URL, {
      cache: "no-cache",
    });
  } catch {
    throw new ThreatIntelError(
      "Threat intelligence could not be downloaded. Check your network connection.",
    );
  }

  if (!response.ok) {
    throw new ThreatIntelError(
      `Threat intelligence request failed (${response.status}).`,
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new ThreatIntelError(
      "The threat-intelligence file contains invalid JSON.",
    );
  }

  const dataset = validateDataset(data);

  if (dataset.status !== "ready") {
    throw new ThreatIntelError(
      "Threat intelligence has not been initialized. No reputation verdict is available.",
    );
  }

  const now = Date.now();
  const generatedAt = Date.parse(dataset.generatedAt);

  if (generatedAt > now + 5 * 60 * 1000) {
    throw new ThreatIntelError(
      "The dataset generation timestamp is in the future.",
    );
  }

  if (
    dataset.expiresAt !== null &&
    Date.parse(dataset.expiresAt) <= now
  ) {
    throw new ThreatIntelError(
      "Threat intelligence has expired. Refresh the dataset before checking URLs.",
    );
  }

  return dataset;
}