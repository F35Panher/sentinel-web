Sentinel Web Protection — Project Memory

Document purpose: Persistent project context for AI coding agents, developers, and future contributors.

Product: Sentinel Web Protection
Repository: sentinel-web
Initial platform: Google Chrome
Primary language: TypeScript
Extension architecture: Chrome Extension Manifest V3
Build tooling: Vite
Deployment target: Vercel for the public website
Project stage: Early development / MVP
Last updated: 2026-10-13

1. Executive Summary

Sentinel is a privacy-conscious web protection product intended to help users identify malicious websites, phishing links, unwanted trackers, and suspicious browsing destinations.

The product starts with a Chrome extension and a public website. It should eventually use multiple threat-intelligence sources, local reputation checks, and an optional backend for distributing validated intelligence.

The long-term goal is to grow Sentinel into a broader endpoint and web security platform. Earlier architectural discussions included a cross-platform endpoint agent for Windows, Linux, and macOS, EDR/antivirus capabilities, and centralized threat intelligence. Those are longer-term possibilities, not current implementation scope.

The immediate goal is to build a functional browser-protection MVP without requiring a backend at the beginning.

2. Product Vision

Sentinel should provide practical security benefits to users, even before a centralized server exists.

The initial product should:

Check submitted URLs against locally available threat intelligence.
Identify known malicious and phishing destinations.
Help users understand suspicious links.
Identify and eventually block unwanted trackers.
Provide protection directly inside Chrome.
Support multiple threat-intelligence sources over time.
Explain detection results instead of simply presenting unexplained scores.
Minimize collection and transmission of browsing data.
Allow users to install the Chrome extension from the public Sentinel website.

The product must not claim a URL is safe merely because no local indicator matched.

Preferred clean-result wording:

No known threat found

This means the available intelligence did not identify a known threat. It is not a guarantee of safety.

3. Initial Scope and Non-Goals
In scope for the initial MVP
Public Sentinel landing page.
Manual URL reputation checker.
Local threat-indicator dataset.
URL normalization.
Detection result and evidence schema.
Chrome extension popup and service worker.
Shared detection logic between the website and extension.
Unit tests.
A path toward integrating trusted threat-intelligence feeds.
Out of scope for the first MVP
A production threat-intelligence backend.
User accounts and subscription management.
A cross-platform native endpoint agent.
Kernel-level monitoring or antivirus scanning.
Automatic collection of all browsing history.
Automatic submission of users' URLs to third parties.
Enterprise EDR features.
A proprietary malware signature distribution network.

These features may be considered later when the MVP and privacy model are established.

4. Technology Decisions
TypeScript

TypeScript is the selected language for the initial browser product.

Reasons:

Strong typing for URL checks, threat indicators, and detection results.
Good compatibility with Chrome Extension Manifest V3.
Integration with Vite.
Shared modules between the website and extension.
Familiar tooling for tests and CI.
Easy transition to a backend implemented in TypeScript or another language.

Rust may be considered for future performance-sensitive components. C/C++ are not required for the initial browser extension.

Vite

Vite is the selected build tool.

The build must support both the public website and the Chrome extension without breaking either entry point.

Chrome Extension Manifest V3

The extension uses Manifest V3. Its background processing runs in a service worker, not a permanently running background page.

Extension permissions should follow least-privilege principles. Request additional permissions only when the corresponding functionality is implemented and the user experience justifies them.

Vercel

Vercel is being used to deploy the public website.

A successful Vercel deployment proves that the configured build completed. It does not prove that the extension works or that threat detection is operational.

5. Repository Structure

The intended structure is:

sentinel-web/
├── index.html
├── manifest.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── MEMORY.md
├── public/
│   └── icons/
├── src/
│   ├── background/
│   │   └── service-worker.ts
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   ├── shared/
│   │   ├── types.ts
│   │   └── url-normalizer.ts
│   ├── detection/
│   │   ├── local-indicators.ts
│   │   └── reputation-engine.ts
│   └── website/
│       ├── main.ts
│       └── style.css
└── tests/
    └── reputation-engine.test.ts


Some files are already present, while the detection modules and tests remain planned work.

The website HTML is currently intended to be at the repository root as index.html.

The website entry script is:

HTML
<script type="module" src="/src/website/main.ts"></script>


The website TypeScript imports its stylesheet:

import "./style.css";


Do not move files or alter build entry points without checking the current Vite configuration and generated output.

6. Existing Shared Types

The initial shared type definitions were:

export interface ProtectionSettings {
  protectionEnabled: boolean;
}

export type ThreatClassification =
  | "malware"
  | "phishing"
  | "tracker"
  | "suspicious"
  | "unknown";

export interface ThreatLookupResult {
  classification: ThreatClassification;
  matched: boolean;
  sourceId?: string;
  expiresAt?: string;
}


These definitions were subsequently expanded to support the reputation engine.

The expanded design includes:

ProtectionSettings
ThreatClassification
ReputationVerdict
ThreatSourceType
ThreatIndicator
ThreatLookupResult
ThreatEvidence
ReputationResult
ThreatIntelDataset

Before changing these types, inspect the current file and all imports. Preserve compatibility where practical, and update dependent code deliberately.

Intended reputation verdicts
type ReputationVerdict =
  | "malicious"
  | "suspicious"
  | "tracker"
  | "no_known_threat_found"
  | "unable_to_determine";


These represent overall user-facing outcomes, not merely threat categories.

Threat indicator model

Indicators should describe:

Stable indicator ID.
Indicator value.
Indicator type: domain or exact URL.
Classification.
Source ID and source type.
Confidence metadata.
First-seen time, if available.
Expiration time, if applicable.
Human-readable description.

A confidence value is not automatically proof of maliciousness. Source reliability, freshness, and classification must be evaluated separately.

7. URL Normalization

The file src/shared/url-normalizer.ts has been created.

Its intended exports are:

normalizeUrl(input: string): UrlNormalizationResult

hostnameMatchesDomain(
  hostname: string,
  indicatorDomain: string
): boolean

normalizeHostname(input: string): string | null


The normalization module:

Accepts only HTTP and HTTPS.
Rejects malformed URLs.
Rejects embedded usernames and passwords.
Removes URL fragments.
Preserves paths and query parameters.
Canonicalizes hostnames through URL parsing.
Supports exact URL matching and domain/subdomain matching.
Does not perform network requests.

A critical matching rule is that example.com must match example.com and login.example.com, but must not match notexample.com or example.com.evil.

Future hardening

Before production use, review:

IP-literal handling.
Internationalized domain names.
Default ports and URL canonicalization.
Public Suffix List integration where registrable-domain boundaries matter.
Path and query matching semantics.
Encoded characters and ambiguous URL representations.
Malformed or deceptive URL input.

Do not treat URL normalization as a complete security validator.

8. Public Website

The public landing page is index.html.

It is intended to contain:

Sentinel branding.
A URL input form.
A URL-checking result area.
A browser-protection section.
A future Chrome extension installation link.
Privacy messaging.

The stylesheet is src/website/style.css.

The TypeScript controller is src/website/main.ts.

Current checker behavior

The initial controller:

Reads the submitted URL.
Validates HTTP or HTTPS syntax.
Displays the hostname.
Explains that reputation checking is not connected yet.
Keeps the extension download link disabled until a real installation URL is available.

An example result is:

URL format accepted: progress.com. Reputation checking is not connected yet, so Sentinel cannot determine whether this link is malicious.

This is expected behavior for the initial UI. It is not actual threat detection.

Next website milestone

Replace the format-only result with a real local reputation lookup. Do not display a malicious/safe verdict until the detection engine returns it.

9. Detection Architecture

The detection engine must be independent of the website and extension UI.

Planned modules:

src/detection/local-indicators.ts

Contains a small local dataset of documented test indicators.

Use reserved test domains such as .invalid to avoid interacting with real malicious destinations during tests.

Examples:

malware-test.invalid
suspicious-test.invalid

These are synthetic test indicators, not real threat intelligence.

src/detection/reputation-engine.ts

Consumes normalized URLs and indicators and returns a ReputationResult.

Initial responsibilities:

Normalize the URL.
Match exact URL indicators.
Match domain indicators using label-boundary-aware matching.
Ignore expired indicators.
Return a verdict.
Provide evidence for matches.
Explain when no known threat was found.
Return an indeterminate result for invalid input or insufficient data.

The engine should be deterministic and testable.

Do not fetch submitted URLs or execute website content as part of reputation matching.

10. Threat-Intelligence Strategy

The longer-term product should combine multiple threat-intelligence sources.

Potential source categories include:

Public phishing feeds.
Public malware-domain feeds.
Commercial reputation providers.
Curated community indicators.
Internally validated detections.

Each provider must have explicit licensing, attribution, rate-limit, and redistribution requirements.

Not all sources permit redistribution of raw indicators. Prefer locally consumed indicators when licensing allows, and share only the permitted information.

Planned feed pipeline
Acquire indicators through an approved integration.
Validate the provider and dataset format.
Normalize domains and URLs.
Validate indicator types and timestamps.
Deduplicate indicators.
Apply expiration and freshness policies.
Resolve conflicting classifications.
Publish a versioned dataset.
Update local extension intelligence.
Track feed failures and stale data.

Do not trust unvalidated community submissions.

Local-first principle

The initial extension should be useful without a backend. Local intelligence is checked locally. Remote intelligence updates may be introduced later.

A future backend can distribute signed, versioned intelligence snapshots and incremental updates.

11. Chrome Extension Design

The extension should reuse the shared normalization and reputation modules.

Responsibilities:

Store user protection preferences.
Maintain local threat intelligence.
Evaluate relevant browsing destinations.
Warn about known malicious links.
Block destinations when the detection policy explicitly requires it.
Show explanations and allow users to review a verdict.
Avoid collecting more browsing data than necessary.

The service worker must tolerate suspension and restart. Do not rely on permanent in-memory state.

Future browsing protection

Potential protection mechanisms include:

declarativeNetRequest for rule-based blocking.
webNavigation for supported navigation observation.
storage for settings and local metadata.
Minimal host_permissions appropriate to implemented functionality.

Choose permissions deliberately. Do not request broad website access until required and documented.

Chrome APIs and permissions must be checked against the current Manifest V3 requirements before implementing each feature.

12. Website and Extension Must Share One Engine

The website and extension should consume the same TypeScript modules.

                 Shared URL Reputation Engine
                            |
                  +---------+---------+
                  |                   |
             Public Website      Chrome Extension
                  |                   |
             Manual Check       Browsing Protection


This prevents the website from reporting a different verdict from the extension for the same normalized URL and indicator dataset.

Later, both can consume the same versioned intelligence format.

13. Privacy and Security Principles

Sentinel should follow data minimization.

Initial principles:

Do not upload browsing history.
Do not send submitted URLs to third parties without explicit disclosure.
Do not silently collect page content.
Do not transmit credentials or sensitive query parameters.
Explain the limits of local reputation results.
Avoid arbitrary URL fetching on the backend.
If a backend is added, validate all requests and enforce rate limits.
Never expose provider API keys in browser code.
Validate and version intelligence before distributing it.
Protect update integrity through cryptographic signing and verification.
Log operational metadata without unnecessarily retaining user browsing data.

A public URL checker may receive URLs containing tokens or personal information in query parameters. The interface should warn users not to submit private or authenticated links. A future server implementation must define retention and redaction policies.

14. Build and Deployment History

The project uses:

npm run typecheck
npm run build


The build command runs TypeScript checking followed by Vite.

Previous problems included:

Missing dirname typing/imports in vite.config.ts.
Missing characters in import statements.
Missing template-literal backticks.
Vite unable to resolve the root index.html.
Vercel returning 404 when the public website was not emitted at the expected output path.
Potential mismatch between the popup path in manifest.json and Vite's generated HTML path.

These issues should not be assumed to remain unresolved. Always inspect the current configuration and build output.

Build verification

After building, inspect:

find dist -maxdepth 4 -type f | sort


The desired public website output is:

dist/index.html


The extension must also have a valid packaged manifest and all referenced resources.

Verify the exact popup and service-worker paths against manifest.json before loading the unpacked extension.

A successful website build does not prove that the extension is functional.

Vercel

Expected settings:

Root directory: repository root.
Build command: npm run build.
Output directory: dist.

If Vercel cannot resolve an entry module, inspect the committed file tree and build root before changing configuration.

15. Development Roadmap
Stage 1 — Website and extension shell

Status: substantially implemented; verify current repository.

TypeScript and Vite setup.
Manifest V3.
Popup UI.
Background service worker.
Public website and styling.
Basic URL input validation.
Stage 2 — Local reputation engine

Next development stage.

Finalize shared types.
Test URL normalization.
Implement local test indicators.
Implement exact URL and domain matching.
Handle expired indicators.
Return evidence and clear explanations.
Add unit tests.
Connect website UI to the engine.
Stage 3 — Browser protection
Connect the engine to the extension.
Evaluate navigations using appropriate Chrome APIs.
Add block and warning policies.
Store settings and local intelligence.
Test extension lifecycle and performance.
Minimize required permissions.
Stage 4 — Real threat intelligence
Research and select approved feeds.
Implement feed adapters.
Validate and normalize incoming indicators.
Implement deduplication and expiration.
Define conflict-resolution policies.
Add signed, versioned intelligence updates.
Stage 5 — Public release
Publish the extension through the Chrome Web Store.
Link the listing from the public website.
Add privacy documentation and security disclosures.
Test false positives and performance.
Implement feedback and issue reporting.
Stage 6 — Backend

Only when justified by product needs.

Potential responsibilities:

Feed ingestion and validation.
Signed intelligence distribution.
Optional reputation lookups.
Abuse prevention and rate limiting.
Anonymous aggregate telemetry where appropriate.
Operational monitoring.
Privacy controls.
Stage 7 — Broader security platform

Potential future expansion:

Shared community threat intelligence.
Tracker and privacy controls.
Phishing-page signals.
Enterprise policy management.
Native endpoint agent for Windows, Linux, and macOS.
EDR telemetry and response capabilities.

These are future directions, not current commitments.

16. Testing Requirements

At minimum, test:

Valid HTTP and HTTPS URLs.
Malformed URLs.
Unsupported protocols.
URLs containing credentials.
Hostname case normalization.
Trailing-dot hostnames.
Internationalized domains.
Exact URL matching.
Domain and subdomain matching.
Lookalike domain boundaries.
Expired indicators.
Conflicting indicators.
Unknown URLs.
Invalid indicator data.
Empty intelligence datasets.
Extension behavior when intelligence is unavailable.
Website behavior when the engine cannot determine a verdict.

Use synthetic indicators for tests. Never require a real malicious website to be visited.

17. AI Coding Agent Instructions

When another AI agent starts working on this repository:

Read MEMORY.md first.
Read README.md, package.json, tsconfig.json, manifest.json, and vite.config.ts.
Inspect the actual repository structure and Git status.
Read the relevant source files before proposing replacements.
Do not assume that prior deployment errors are still present.
Preserve the distinction between the public website and extension build outputs.
Reuse shared detection logic.
Avoid adding backend dependencies before they are needed.
Never claim a URL is safe merely because it did not match a local indicator.
Do not implement fake threat detection or fabricated confidence scores.
Add tests for detection and normalization changes.
Run the available typecheck and build commands after changes.
Clearly distinguish completed functionality from planned functionality.
Avoid overwriting user changes or replacing whole files unnecessarily.
Explain exact commands and file paths when guiding manual development.

For security-sensitive code, explain assumptions, failure modes, and relevant tests.

18. Immediate Next Actions

The next AI session should:

Inspect the current repository and build configuration.
Confirm the expanded shared types compile with existing code.
Review src/shared/url-normalizer.ts.
Implement src/detection/local-indicators.ts.
Implement src/detection/reputation-engine.ts.
Add unit tests.
Connect src/website/main.ts to the local engine.
Run typechecking and build verification.
Confirm the extension and website outputs are both correct.

The goal of this stage is a real, deterministic local reputation checker—not a production malware detector.

19. Current Product Principle

Build a useful local-first browser security product first. Add centralized intelligence only when the detection model, source permissions, privacy design, and distribution mechanism are ready.

Every detection result must be explainable, every data source must have known provenance, and every advertised protection feature must actually be implemented.