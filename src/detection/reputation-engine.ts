import type {
  ReputationResult,
  ReputationVerdict,
  ThreatEvidence,
  ThreatIndicator,
} from "../shared/types";

import {
  hostnameMatchesDomain,
  normalizeUrl,
} from "../shared/url-normalizer";

import { LOCAL_THREAT_INDICATORS } from "./local-indicators";

export interface ReputationEngineOptions {
  indicators?: readonly ThreatIndicator[];
  now?: () => number;
  datasetVersion?: string;
}

const VERDICT_PRIORITY: Record<ReputationVerdict, number> = {
  malicious: 4,
  suspicious: 3,
  tracker: 2,
  no_known_threat_found: 1,
  unable_to_determine: 0,
};

/**
 * Determine whether an indicator has expired.
 *
 * Indicators with invalid expiration metadata are ignored.
 * Indicators without an expiration date remain active.
 */
function isExpired(
  indicator: ThreatIndicator,
  now: number,
): boolean {
  if (!indicator.expiresAt) {
    return false;
  }

  const expiry = Date.parse(indicator.expiresAt);

  if (!Number.isFinite(expiry)) {
    return true;
  }

  return expiry <= now;
}

/**
 * Match a normalized URL against a domain or exact URL indicator.
 *
 * Domain matching respects hostname label boundaries.
 * Exact URL matching uses the shared URL normalizer.
 */
function indicatorMatches(
  normalizedUrl: string,
  hostname: string,
  indicator: ThreatIndicator,
): boolean {
  if (indicator.indicatorType === "url") {
    const normalizedIndicator = normalizeUrl(indicator.value);

    return (
      normalizedIndicator.success &&
      normalizedIndicator.value.url === normalizedUrl
    );
  }

  if (indicator.indicatorType === "domain") {
    return hostnameMatchesDomain(hostname, indicator.value);
  }

  return false;
}

/**
 * Convert an indicator classification into a user-facing verdict.
 */
function classificationToVerdict(
  classification: ThreatIndicator["classification"],
): ReputationVerdict {
  switch (classification) {
    case "malware":
    case "phishing":
      return "malicious";

    case "suspicious":
      return "suspicious";

    case "tracker":
      return "tracker";

    case "unknown":
    default:
      return "unable_to_determine";
  }
}

/**
 * Select the highest-priority verdict among matching indicators.
 *
 * Evidence from all matching indicators is preserved separately.
 */
function selectVerdict(
  indicators: readonly ThreatIndicator[],
): ReputationVerdict {
  let selected: ReputationVerdict = "unable_to_determine";
  let selectedPriority = -1;

  for (const indicator of indicators) {
    const verdict = classificationToVerdict(
      indicator.classification,
    );

    const priority = VERDICT_PRIORITY[verdict];

    if (priority > selectedPriority) {
      selected = verdict;
      selectedPriority = priority;
    }
  }

  return selected;
}

/**
 * Check a URL against locally available threat indicators.
 *
 * This function performs no network requests and never visits
 * the submitted destination.
 */
export function checkUrlReputation(
  input: string,
  options: ReputationEngineOptions = {},
): ReputationResult {
  const indicators =
    options.indicators ?? LOCAL_THREAT_INDICATORS;

  const now = (options.now ?? Date.now)();
  const checkedAt = new Date(now).toISOString();

  const datasetMetadata = options.datasetVersion
    ? { datasetVersion: options.datasetVersion }
    : {};

  const normalized = normalizeUrl(input);

  if (!normalized.success) {
    return {
      verdict: "unable_to_determine",
      normalizedUrl: null,
      matched: false,
      checkedAt,
      evidence: [],
      explanation: normalized.message,
      ...datasetMetadata,
    };
  }

  const normalizedUrl = normalized.value.url;
  const hostname = normalized.value.hostname;

  const matchedIndicators = indicators.filter((indicator) => {
    if (isExpired(indicator, now)) {
      return false;
    }

    return indicatorMatches(
      normalizedUrl,
      hostname,
      indicator,
    );
  });

  if (matchedIndicators.length === 0) {
    return {
      verdict: "no_known_threat_found",
      normalizedUrl,
      hostname,
      matched: false,
      checkedAt,
      evidence: [],
      explanation:
        "No known threat found in the available local indicators. " +
        "This is not a guarantee that the URL is safe.",
      ...datasetMetadata,
    };
  }

  const evidence: ThreatEvidence[] = matchedIndicators.map(
    (indicator) => ({
      indicatorId: indicator.id,
      sourceId: indicator.sourceId,
      sourceType: indicator.sourceType,
      classification: indicator.classification,
      matchedValue: indicator.value,
      matchType:
        indicator.indicatorType === "url"
          ? "exact_url"
          : "domain",
      description: indicator.description,
      confidence: indicator.confidence,
      firstSeenAt: indicator.firstSeenAt,
      expiresAt: indicator.expiresAt,
    }),
  );

  const verdict = selectVerdict(matchedIndicators);

  return {
    verdict,
    normalizedUrl,
    hostname,
    matched: true,
    checkedAt,
    evidence,
    explanation:
      verdict === "unable_to_determine"
        ? "A local indicator matched, but its classification is insufficient to determine the URL's reputation."
        : `The URL matched ${matchedIndicators.length} active local threat indicator(s).`,
    ...datasetMetadata,
  };
}