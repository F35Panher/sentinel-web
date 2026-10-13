import { describe, expect, it } from "vitest";

import { checkUrlReputation } from "../src/detection/reputation-engine";
import { LOCAL_THREAT_INDICATORS } from "../src/detection/local-indicators";

import type { ThreatIndicator } from "../src/shared/types";

const NOW = Date.parse("2026-10-13T12:00:00.000Z");

const check = (url: string, indicators?: readonly ThreatIndicator[]) =>
  checkUrlReputation(url, {
    ...(indicators ? { indicators } : {}),
    now: () => NOW,
  });

describe("checkUrlReputation", () => {
  it("identifies a synthetic malware domain", () => {
    const result = check("https://malware-test.invalid/");

    expect(result.verdict).toBe("malicious");
    expect(result.matched).toBe(true);
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it("identifies a synthetic phishing domain", () => {
    const result = check("https://phishing-test.invalid/login");

    expect(result.verdict).toBe("malicious");
    expect(result.matched).toBe(true);
  });

  it("matches subdomains of an indicator domain", () => {
    const result = check("https://login.malware-test.invalid/");

    expect(result.verdict).toBe("malicious");
  });

  it("does not match a lookalike hostname prefix", () => {
    const result = check("https://notmalware-test.invalid/");

    expect(result.verdict).toBe("no_known_threat_found");
    expect(result.matched).toBe(false);
  });

  it("does not match a deceptive hostname suffix", () => {
    const result = check("https://malware-test.invalid.evil/");

    expect(result.verdict).toBe("no_known_threat_found");
    expect(result.matched).toBe(false);
  });

  it("matches an exact URL indicator", () => {
    const result = check(
      "https://malware-test.invalid/payload",
    );

    expect(result.verdict).toBe("malicious");
    expect(result.matched).toBe(true);
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it("does not treat a different path as the same exact URL", () => {
    const result = check(
      "https://malware-test.invalid/other",
      LOCAL_THREAT_INDICATORS.filter(
        (indicator) => indicator.type === "url",
      ),
    );

    expect(result.verdict).toBe("no_known_threat_found");
    expect(result.matched).toBe(false);
  });

  it("returns an indeterminate result for an invalid URL", () => {
    const result = check("not a URL");

    expect(result.verdict).toBe("unable_to_determine");
    expect(result.matched).toBe(false);
  });

  it("returns an indeterminate result for unsupported protocols", () => {
    const result = check("javascript:alert(1)");

    expect(result.verdict).toBe("unable_to_determine");
  });

  it("does not claim an unmatched URL is safe", () => {
    const result = check("https://unknown-test.invalid/");

    expect(result.verdict).toBe("no_known_threat_found");
    expect(result.explanation.toLowerCase()).toContain(
      "not a guarantee",
    );
  });

  it("returns no known threat found when the dataset is empty", () => {
    const result = check("https://example.com/", []);

    expect(result.verdict).toBe("no_known_threat_found");
    expect(result.matched).toBe(false);
  });

  it("ignores expired indicators", () => {
    const indicators: ThreatIndicator[] = [
      {
        id: "expired-test",
        value: "expired-test.invalid",
        type: "domain",
        classification: "malware",
        sourceId: "sentinel-test",
        sourceType: "local",
        confidence: 100,
        expiresAt: "2026-10-13T11:00:00.000Z",
        description: "Expired synthetic test indicator.",
      },
    ];

    const result = check(
      "https://expired-test.invalid/",
      indicators,
    );

    expect(result.verdict).toBe("no_known_threat_found");
    expect(result.matched).toBe(false);
  });

  it("prefers a malicious verdict when classifications conflict", () => {
    const indicators: ThreatIndicator[] = [
      {
        id: "conflict-suspicious",
        value: "conflict-test.invalid",
        type: "domain",
        classification: "suspicious",
        sourceId: "sentinel-test",
        sourceType: "local",
        confidence: 75,
        description: "Synthetic suspicious indicator.",
      },
      {
        id: "conflict-malware",
        value: "conflict-test.invalid",
        type: "domain",
        classification: "malware",
        sourceId: "sentinel-test",
        sourceType: "local",
        confidence: 100,
        description: "Synthetic malware indicator.",
      },
    ];

    const result = check(
      "https://conflict-test.invalid/",
      indicators,
    );

    expect(result.verdict).toBe("malicious");
    expect(result.evidence).toHaveLength(2);
  });

  it("identifies synthetic tracker indicators", () => {
    const result = check("https://tracker-test.invalid/");

    expect(result.verdict).toBe("tracker");
    expect(result.matched).toBe(true);
  });

  it("identifies synthetic suspicious indicators", () => {
    const result = check("https://suspicious-test.invalid/");

    expect(result.verdict).toBe("suspicious");
    expect(result.matched).toBe(true);
  });
});