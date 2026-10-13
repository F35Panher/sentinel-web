import type { ThreatIndicator } from "../shared/types";

/**
 * Synthetic indicators for automated tests and development only.
 *
 * These are not real threat intelligence. Never use these entries
 * to claim that a real public website is malicious.
 */
export const LOCAL_THREAT_INDICATORS: readonly ThreatIndicator[] = [
  {
    id: "test-malware-domain-001",
    value: "malware-test.invalid",
    indicatorType: "domain",
    classification: "malware",
    sourceId: "sentinel-synthetic-test-data",
    sourceType: "synthetic",
    confidence: 100,
    description: "Synthetic malware-domain indicator for testing.",
  },
  {
    id: "test-phishing-domain-001",
    value: "phishing-test.invalid",
    indicatorType: "domain",
    classification: "phishing",
    sourceId: "sentinel-synthetic-test-data",
    sourceType: "synthetic",
    confidence: 100,
    description: "Synthetic phishing-domain indicator for testing.",
  },
  {
    id: "test-suspicious-domain-001",
    value: "suspicious-test.invalid",
    indicatorType: "domain",
    classification: "suspicious",
    sourceId: "sentinel-synthetic-test-data",
    sourceType: "synthetic",
    confidence: 75,
    description: "Synthetic suspicious-domain indicator for testing.",
  },
  {
    id: "test-tracker-domain-001",
    value: "tracker-test.invalid",
    indicatorType: "domain",
    classification: "tracker",
    sourceId: "sentinel-synthetic-test-data",
    sourceType: "synthetic",
    confidence: 90,
    description: "Synthetic tracker-domain indicator for testing.",
  },
  {
    id: "test-exact-url-001",
    value: "https://malware-test.invalid/payload",
    indicatorType: "url",
    classification: "malware",
    sourceId: "sentinel-synthetic-test-data",
    sourceType: "synthetic",
    confidence: 100,
    description: "Synthetic exact-URL indicator for testing URL matching.",
  },
];