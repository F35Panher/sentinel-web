import type {
  ThreatIndicator,
  ThreatIntelDataset,
} from "../shared/types";

const INTEL_URL = "/intel/threat-intel.json";

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

function isIndicator(value: unknown): value is ThreatIndicator {
  if (!isRecord(value)) {
    return false;
  }

  const validClassifications = [
    "malware",
    "phishing",
    "tracker",
    "suspicious",
    "unknown",
  ];

  const validTypes = ["domain", "url"];

  const validSourceTypes = [
    "synthetic",
    "public_feed",
    "commercial_provider",
    "community",
  ];

  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.value === "string" &&
    value.value.length > 0 &&
    validTypes.includes(String(value.indicatorType)) &&
    validClassifications.includes(String(value.classification)) &&
    typeof value.sourceId === "string" &&
    value.sourceId.length > 0 &&
    validSourceTypes.includes(String(value.sourceType)) &&
    typeof value.description === "string" &&
    (value.confidence === undefined ||
      (typeof value.confidence === "number" &&
        Number.isFinite(value.confidence) &&
        value.confidence >= 0 &&
        value.confidence <= 100)) &&
    (value.firstSeenAt === undefined ||
      (typeof value.firstSeenAt === "string" &&
        Number.isFinite(Date.parse(value.firstSeenAt)))) &&
    (value.expiresAt === undefined ||
      (typeof value.expiresAt === "string" &&
        Number.isFinite(Date.parse(value.expiresAt))))
  );
}

function validateDataset(
  value: unknown,
): ThreatIntelDataset {
  if (!isRecord(value)) {
    throw new ThreatIntelError(
      "The threat-intelligence dataset is not a JSON object.",
    );
  }

  if (
    value.schemaVersion !== 1 ||
    typeof value.version !== "string" ||
    !value.version ||
    !["ready", "not_initialized"].includes(
      String(value.status),
    ) ||
    !Array.isArray(value.sources) ||
    !Array.isArray(value.indicators)
  ) {
    throw new ThreatIntelError(
      "The threat-intelligence dataset has an unsupported schema.",
    );
  }

  if (
    value.generatedAt !== null &&
    (typeof value.generatedAt !== "string" ||
      !Number.isFinite(Date.parse(value.generatedAt)))
  ) {
    throw new ThreatIntelError(
      "The dataset generation timestamp is invalid.",
    );
  }

  if (
    value.expiresAt !== null &&
    (typeof value.expiresAt !== "string" ||
      !Number.isFinite(Date.parse(value.expiresAt)))
  ) {
    throw new ThreatIntelError(
      "The dataset expiration timestamp is invalid.",
    );
  }

  if (!value.indicators.every(isIndicator)) {
    throw new ThreatIntelError(
      "The dataset contains an invalid threat indicator.",
    );
  }

  const ids = value.indicators.map(
    (indicator) => (indicator as ThreatIndicator).id,
  );

  if (new Set(ids).size !== ids.length) {
    throw new ThreatIntelError(
      "The dataset contains duplicate indicator IDs.",
    );
  }

  if (
    value.status === "ready" &&
    (value.generatedAt === null ||
      !value.sources.length ||
      !value.indicators.length)
  ) {
    throw new ThreatIntelError(
      "A ready dataset must contain generation metadata, sources, and indicators.",
    );
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
      "Threat intelligence could not be downloaded.",
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
      "Threat intelligence has not been initialized. A reputation verdict cannot be produced.",
    );
  }

  if (
    !dataset.generatedAt ||
    Date.parse(dataset.generatedAt) > Date.now() + 5 * 60 * 1000
  ) {
    throw new ThreatIntelError(
      "The dataset generation timestamp is missing or invalid.",
    );
  }

  if (
    dataset.expiresAt &&
    Date.parse(dataset.expiresAt) <= Date.now()
  ) {
    throw new ThreatIntelError(
      "Threat intelligence has expired and must be refreshed.",
    );
  }

  return dataset;
}