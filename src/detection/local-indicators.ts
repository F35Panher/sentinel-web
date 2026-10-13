import type { ThreatIndicator } from "../shared/types";

/**
 * Synthetic indicators for development and unit testing only.
 *
 * These are NOT real threat intelligence and must never be
 * presented as evidence of actual malicious activity.
 *
 * The .invalid TLD is reserved for names that should not
 * resolve as public internet destinations.
 */
export const LOCAL_THREAT_INDICATORS: readonly ThreatIndicator[] = [
  {
    id: "test-malware-domain-001",
    value: "malware-test.invalid",
    type: "domain",
    classification: "malware",
    sourceId: "sentinel-synthetic-test-data",
    sourceType: "local",
    confidence: 100,
    description: "Synthetic malware-domain indicator for testing.",
  },
  {
    id: "test-phishing-domain-001",
    value: "phishing-test.invalid",
    type: "domain",
    classification: "phishing",
    sourceId: "sentinel-synthetic-test-data",
    sourceType: "local",
    confidence: 100,
    description: "Synthetic phishing-domain indicator for testing.",
  },
  {
    id: "test-suspicious-domain-001",
    value: "suspicious-test.invalid",
    type: "domain",
    classification: "suspicious",
    sourceId: "sentinel-synthetic-test-data",
    sourceType: "local",
    confidence: 75,
    description: "Synthetic suspicious-domain indicator for testing.",
  },
  {
    id: "test-tracker-domain-001",
    value: "tracker-test.invalid",
    type: "domain",
    classification: "tracker",
    sourceId: "sentinel-synthetic-test-data",
    sourceType: "local",
    confidence: 90,
    description: "Synthetic tracker-domain indicator for testing.",
  },
  {
    id: "test-exact-url-001",
    value: "https://malware-test.invalid/payload",
    type: "url",
    classification: "malware",
    sourceId: "sentinel-synthetic-test-data",
    sourceType: "local",
    confidence: 100,
    description: "Synthetic exact-URL indicator for testing URL matching.",
  },
];