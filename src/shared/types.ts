export interface ProtectionSettings { protectionEnabled: boolean; }

/*

Types of threats Sentinel can identify.
*/ export type ThreatClassification = | "malware" | "phishing" | "tracker" | "suspicious" | "unknown";

/*

Overall result of a URL reputation check.
*/ export type ReputationVerdict = | "malicious" | "suspicious" | "tracker" | "noknownthreatfound" | "unableto_determine";

/*

Where a threat indicator originated.
*/ export type ThreatSourceType = | "localtest" | "localfeed" | "external_provider" | "community";

/*

A threat intelligence indicator stored locally.
*

For the MVP, we support domain and exact URL matching.
More advanced matching can be added later.
*/ export interface ThreatIndicator { id: string; value: string; indicatorType: "domain" | "url"; classification: ThreatClassification; sourceId: string; sourceType: ThreatSourceType; confidence: number; firstSeenAt?: string; expiresAt?: string; description?: string; }

/*

Result from an individual threat lookup.
*/ export interface ThreatLookupResult { classification: ThreatClassification; matched: boolean; sourceId?: string; expiresAt?: string; indicatorId?: string; confidence?: number; description?: string; }

/*

Evidence explaining why a URL received its verdict.
*/ export interface ThreatEvidence { sourceId: string; indicatorId?: string; classification: ThreatClassification; description: string; confidence?: number; }

/*

Full result displayed by the website or extension.
*/ export interface ReputationResult { normalizedUrl?: string; hostname?: string; verdict: ReputationVerdict; checkedAt: string; evidence: ThreatEvidence[]; message: string; }

/*

A versioned local threat-intelligence dataset.
*/ export interface ThreatIntelDataset { version: string; updatedAt: string; indicators: ThreatIndicator[]; }