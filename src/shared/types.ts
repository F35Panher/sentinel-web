export interface ProtectionSettings { protectionEnabled: boolean; }

export type ThreatClassification = | "malware" | "phishing" | "tracker" | "suspicious" | "unknown";

export interface ThreatLookupResult { classification: ThreatClassification; matched: boolean; sourceId?: string; expiresAt?: string; }