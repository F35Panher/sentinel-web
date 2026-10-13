# Chrome security extension: Project blueprint

We'll start with a local-first Chrome security extension that combines tracker blocking, phishing protection, suspicious URL detection, and threat intelligence from multiple sources. We will not build the backend yet.

The key architectural decision is to keep the extension independent of the future server. It will consume a standardized local intelligence format, allowing us to add a Rust-based intelligence service later without rewriting the browser protection engine.

## 1. Initial architecture

### External threat-intelligence sources

Public URL feeds · domain feeds · tracker lists · approved rules

Manually curated and imported during the first milestone

### Local intelligence bundle

Normalized indicators · source provenance · expiry · version

Validated rules and indicators

### Chrome Extension — Manifest V3

Malicious URL checks

Tracker blocking

Suspicious URL analysis

Settings and exceptions

No backend required for the first release

Protection runs locally and works offline with the installed intelligence.

One important distinction: we'll use multiple intelligence sources, but we won't blindly merge every source into one blocklist. Each source will retain its provenance and license information, and malware, phishing, and tracker classifications will remain separate.

## 2. Proposed project structure

I'd use TypeScript for the Chrome extension, with a build setup that can bundle and validate the extension for local installation.

text
```
sentinel-web/
├── README.md
├── PRODUCT_SPEC.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── manifest.json
├── public/
│   ├── icons/
│   └── rules/
│       └── tracker-rules.json
├── src/
│   ├── background/
│   │   └── service-worker.ts
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.ts
│   │   └── popup.css
│   ├── options/
│   │   ├── options.html
│   │   ├── options.ts
│   │   └── options.css
│   ├── protection/
│   │   ├── url-normalizer.ts
│   │   ├── domain-matcher.ts
│   │   ├── reputation-engine.ts
│   │   ├── phishing-heuristics.ts
│   │   └── tracker-manager.ts
│   ├── intelligence/
│   │   ├── indicator-schema.ts
│   │   ├── source-registry.ts
│   │   ├── bundle-loader.ts
│   │   ├── provenance.ts
│   │   └── expiry.ts
│   ├── storage/
│   │   ├── settings-store.ts
│   │   ├── intelligence-store.ts
│   │   └── allowlist-store.ts
│   └── shared/
│       ├── messages.ts
│       ├── types.ts
│       └── constants.ts
├── data/
│   ├── sources.json
│   └── development-indicators.json
├── tests/
│   ├── url-normalizer.test.ts
│   ├── domain-matcher.test.ts
│   ├── reputation-engine.test.ts
│   └── intelligence-bundle.test.ts
└── docs/
    ├── ARCHITECTURE.md
    ├── PRIVACY.md
    └── THREAT_INTELLIGENCE.md
```

This is the intended structure, not a claim that these files have already been created. We'll add modules when their dependencies and responsibilities are clear.

## 3. Chrome Manifest V3 permissions

Chrome's declarative network filtering API lets the browser evaluate blocking rules without requiring the extension to inspect every request's contents. This is a good privacy-conscious foundation. GitHub

+1

Here is the initial manifest:

json
```

{
  "manifest_version": 3,
  "name": "Sentinel Web Protection",
  "version": "0.1.0",
  "description": "Local tracker and malicious URL protection.",
  "permissions": [
    "storage",
    "declarativeNetRequest"
  ],
  "background": {
    "service_worker": "src/background/service-worker.js",
    "type": "module"
  },
  "action": {
    "default_popup": "src/popup/popup.html",
    "default_title": "Sentinel Web Protection"
  },
  "options_page": "src/options/options.html",
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "tracker_rules",
        "enabled": true,
        "path": "rules/tracker-rules.json"
      }
    ]
  }
}
```

The build process must copy or generate the compiled files at the paths declared in the final manifest.

### Why these permissions?

| Permission | Purpose |
| --- | --- |
| `storage` | Save settings, allowlists, and local metadata |
| `declarativeNetRequest` | Block matching network requests using declarative rules |

We deliberately omit `tabs`, `webNavigation`, `cookies`, `webRequest`, and broad host permissions from the initial manifest. Permissions should be added only when a concrete feature requires them; Chrome recommends minimizing permissions and using optional access where practical. Chrome for Developers

+1

One limitation: tracker blocking can begin with declarative rules, but reliable navigation warnings for known malicious destinations may require additional navigation-related permissions or a different rule strategy. We'll choose the least-privileged implementation that meets the tested requirements rather than requesting broad access automatically.

## 4. Multi-source threat intelligence

The first release will support multiple source formats through adapters, even though we won't yet have an automated ingestion server.

Each imported indicator should follow a common structure:

json
```
{
  "schemaVersion": 1,
  "indicators": [
    {
      "type": "domain",
      "value": "example-malware.test",
      "classification": "malware",
      "sourceId": "development-fixtures",
      "confidence": "unverified",
      "firstSeen": "2026-10-12T00:00:00Z",
      "expiresAt": "2026-10-19T00:00:00Z"
    }
  ]
}
```

This is a development fixture, not a real threat report. The `.test` domain is reserved for testing.

The source registry should record:

- Source ID and description.
- Data type and parser.
- License and redistribution restrictions.
- Last successful import.
- Provenance and confidence.
- Expiration policy.
- Whether the data is suitable for blocking or only for warnings.

For the first milestone, use local fixtures and a small number of reviewed, legally compatible sample lists. We will not have the extension scrape arbitrary sources or download executable signatures. Automated source retrieval can be introduced later through a trusted update service.

## 5. Implementation plan

## 01

Project skeleton

Set up TypeScript, the build pipeline, Manifest V3, popup UI, and local development instructions.

Deliverable: an installable Chrome extension shell.

## 02

Local tracker blocking

Load a small, tested declarative ruleset and display the protection state.

Deliverable: real request blocking with test cases.

## 03

Threat-intelligence engine

Implement normalization, domain matching, URL matching, expiry, and source attribution.

Deliverable: deterministic local reputation checks.

## 04

Malicious URL warnings

Add navigation evaluation, warning UI, and user-controlled exceptions.

Deliverable: explainable warnings for known test threats.

## 05

Local intelligence updates

Import normalized bundles, validate schemas, reject invalid data, and update local storage safely.

Deliverable: replaceable intelligence without rewriting protection logic.

## 6. First working milestone

The first milestone should be deliberately small.

Definition of done:

- [ ]The extension loads through `chrome://extensions` using Developer mode.
- [ ]A popup displays protection status.
- [ ]A test tracker rule blocks a designated test request.
- [ ]A local reputation engine correctly matches a reserved test domain.
- [ ]URL normalization has tests for subdomains, misleading suffixes, ports, and IDNs.
- [ ]Users can create and remove an allowlist entry.
- [ ]Invalid intelligence input is rejected.
- [ ]The extension does not transmit browsing history.
- [ ]The build and unit tests pass.

For the first milestone, a known malicious test domain can be detected by the local engine without implementing a full-page warning yet. The warning flow follows after navigation handling and permission requirements are verified.

## 7. What we should build first

Start with the project skeleton, manifest, popup, local settings, and a minimal tracker ruleset. Then implement the intelligence schema and URL-matching tests before connecting the two.

This creates a working foundation with no server dependency, while keeping the eventual backend integration straightforward.

Important: I have defined the project structure and initial implementation plan here; I have not created files in your repository in this response. If you open your repository in a coding agent, use this blueprint as its implementation task.