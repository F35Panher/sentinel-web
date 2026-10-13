export interface ProtectionSettings {
  protectionEnabled: boolean;
}

export type ThreatClassification =
  | "malware"
  | "phishing"
  | "tracker"
  | "suspicious"
  | "unknown";

export type ReputationVerdict =
  | "malicious"
  | "suspicious"
  | "tracker"
  | "no_known_threat_found"
  | "unable_to_determine";

export type ThreatSourceType =
  | "synthetic"
  | "public_feed"
  | "commercial_provider"
  | "community";

export interface ThreatIndicator {
  id: string;
  value: string;
  indicatorType: "domain" | "url";
  classification: ThreatClassification;
  sourceId: string;
  sourceType: ThreatSourceType;
  confidence?: number;
  firstSeenAt?: string;
  expiresAt?: string;
  description: string;
}

export interface ThreatIntelSource {
  id: string;
  name: string;
  type: ThreatSourceType;
  attributionUrl?: string;
  termsUrl?: string;
  lastSuccessfulFetchAt?: string;
}

export interface ThreatEvidence {
  sourceId: string;
  sourceType: ThreatSourceType;
  indicatorId: string;
  classification: ThreatClassification;
  matchedValue: string;
  matchType: "exact_url" | "domain";
  description: string;
  confidence?: number;
  firstSeenAt?: string;
  expiresAt?: string;
}

export interface ReputationResult {
  verdict: ReputationVerdict;
  normalizedUrl: string | null;
  hostname?: string;
  matched: boolean;
  checkedAt: string;
  evidence: ThreatEvidence[];
  explanation: string;
  datasetVersion?: string;
}

export interface ThreatIntelDataset {
  schemaVersion: number;
  version: string;
  status: "ready" | "not_initialized";
  generatedAt: string | null;
  expiresAt: string | null;
  sources: ThreatIntelSource[];
  indicators: ThreatIndicator[];
}