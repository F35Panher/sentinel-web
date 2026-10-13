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
}

const VERDICT_PRIORITY: Record<ReputationVerdict, number> = {
  malicious: 4,
  suspicious: 3,
  tracker: 2,
  no_known_threat_found: 1,
  unable_to_determine: 0,
};

function isExpired(
  indicator: ThreatIndicator,
  now: number,
): boolean {
  if (!indicator.expiresAt) {
    return false;
  }

  const expiry = Date.parse(indicator.expiresAt);

  // Invalid expiration metadata must not silently make an
  // indicator permanent or cause an unreliable detection.
  if (!Number.isFinite(expiry)) {
    return true;
  }

  return expiry <= now;
}

function indicatorMatches(
  normalizedUrl: string,
  hostname: string,
  indicator: ThreatIndicator,
): boolean {
  if (indicator.type === "url") {
    const normalizedIndicator = normalizeUrl(indicator.value);

    return (
      normalizedIndicator.valid &&
      normalizedIndicator.normalizedUrl === normalizedUrl
    );
  }

  if (indicator.type === "domain") {
    return hostnameMatchesDomain(hostname, indicator.value);
  }

  return false;
}

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

function selectVerdict(
  indicators: readonly ThreatIndicator[],
): ReputationVerdict {
  let selected: ReputationVerdict = "unable_to_determine";
  let selectedPriority = -1;

  for (const indicator of indicators) {
    const verdict = classificationToVerdict(indicator.classification);
    const priority = VERDICT_PRIORITY[verdict];

    if (priority > selectedPriority) {
      selected = verdict;
      selectedPriority = priority;
    }
  }

  return selected;
}

export function checkUrlReputation(
  input: string,
  options: ReputationEngineOptions = {},
): ReputationResult {
  const indicators =
    options.indicators ?? LOCAL_THREAT_INDICATORS;

  const now = (options.now ?? Date.now)();

  const normalized = normalizeUrl(input);

  if (!normalized.valid || !normalized.normalizedUrl) {
    return {
      verdict: "unable_to_determine",
      normalizedUrl: null,
      matched: false,
      evidence: [],
      explanation:
        "The URL is invalid or uses an unsupported protocol. Sentinel could not determine its reputation.",
    };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalized.normalizedUrl);
  } catch {
    return {
      verdict: "unable_to_determine",
      normalizedUrl: null,
      matched: false,
      evidence: [],
      explanation:
        "Sentinel could not parse the normalized URL.",
    };
  }

  // Fail closed on malformed expiration metadata for matching
  // indicators rather than allowing stale data to produce a verdict.
  const matchedIndicators = indicators.filter((indicator) => {
    if (isExpired(indicator, now)) {
      return false;
    }

    return indicatorMatches(
      normalized.normalizedUrl,
      parsedUrl.hostname,
      indicator,
    );
  });

  if (matchedIndicators.length === 0) {
    return {
      verdict: "no_known_threat_found",
      normalizedUrl: normalized.normalizedUrl,
      matched: false,
      evidence: [],
      explanation:
        "No known threat found in the available local indicators. This is not a guarantee that the URL is safe.",
    };
  }

  const evidence: ThreatEvidence[] = matchedIndicators.map(
    (indicator) => ({
      indicatorId: indicator.id,
      classification: indicator.classification,
      sourceId: indicator.sourceId,
      description: indicator.description,
      matchedValue: indicator.value,
    }),
  );

  const verdict = selectVerdict(matchedIndicators);

  return {
    verdict,
    normalizedUrl: normalized.normalizedUrl,
    matched: true,
    evidence,
    explanation:
      verdict === "unable_to_determine"
        ? "A local indicator matched, but its classification is insufficient to determine the URL's reputation."
        : `The URL matched ${matchedIndicators.length} active local threat indicator(s).`,
  };
}