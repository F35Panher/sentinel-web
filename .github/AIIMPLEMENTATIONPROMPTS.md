I'll create a set of stage-by-stage implementation prompts designed to work with `PRODUCT_SPEC.md`, `Architecture.md`, `Agent.md`, and `Server.md`.

Each prompt will instruct an AI coding agent to inspect the existing repository, follow the architecture, implement one bounded milestone, run tests, and document its changes. The prompts will also include security and privacy guardrails so that future AI sessions don't accidentally turn this into an invasive telemetry collector or an unsafe signature-distribution system.

The goal is to make these prompts usable with coding agents such as Cursor, Claude Code, GitHub Copilot, or other repository-aware AI tools.

I recommend creating a separate `AI_IMPLEMENTATION_PROMPTS.md` file. It will contain a reusable master prompt and nine stage-specific prompts, with explicit instructions about when a stage is complete and when the AI should stop instead of moving on.

Writing

# AI_IMPLEMENTATION_PROMPTS.md

# AI-Assisted Development Prompts for the Endpoint Security Platform

**Purpose:** Guide AI coding agents through the implementation of the privacy-first endpoint and web security platform.

**Primary specification:** `PRODUCT_SPEC.md`

**Related documentation:** `Architecture.md`, `Agent.md`, `Server.md`, `Protocol.md`, `Threat_Model.md`, `Privacy_Model.md`

**Target platforms:** Windows, Linux, macOS

**Primary language:** Rust

**Browser extension:** TypeScript

**Deployment target:** 100,000+ endpoints

---

# Part 1 — How to Use These Prompts

## 1.1 Development Rules

Execute these prompts sequentially. Do not ask an AI coding agent to implement every stage in one request.

For each stage:

1. Open the repository in the coding agent.
2. Provide the Master Development Prompt.
3. Provide the prompt for the desired stage.
4. Allow the AI to inspect the repository and existing documentation.
5. Review the proposed implementation and any important design decisions.
6. Let the AI implement the stage.
7. Review the tests, security implications, and changed files.
8. Commit the work after it meets the stage's acceptance criteria.
9. Move to the next stage only after resolving blocking failures.

A stage may require multiple implementation sessions. That is expected.

## 1.2 Source-of-Truth Hierarchy

Use the following order when interpreting project requirements:

1. Explicitly approved security and privacy requirements.
2. `PRODUCT_SPEC.md`.
3. `Architecture.md`.
4. Component specifications such as `Agent.md`, `Server.md`, and `Protocol.md`.
5. Approved architecture decision records.
6. Existing implementation and tests.
7. New implementation proposals.

If two documents conflict, do not silently choose one. Identify the conflict and propose a documented resolution.

The actual repository state is authoritative about what has already been implemented. A specification describing a feature does not mean the feature exists.

## 1.3 Required AI Behavior

The AI must:

- Inspect existing code before editing it.
- Prefer small, testable changes.
- Preserve established interfaces unless a change is justified.
- Explain important design decisions.
- Identify assumptions and unresolved questions.
- Write automated tests alongside implementation.
- Update relevant documentation.
- Run the tests and builds available in the environment.
- Report failures honestly.
- Never claim to have created files or passed tests without evidence.

The AI must not:

- Rewrite the entire repository without approval.
- Introduce unnecessary dependencies or services.
- invent APIs, feed availability, licensing permissions, or operating-system capabilities.
- Disable or interfere with existing antivirus products.
- Make sensitive telemetry collection the default.
- Trust unverified threat indicators.
- Execute arbitrary downloaded code as part of intelligence updates.
- Introduce automatic destructive response actions without explicit authorization.

---

# Part 2 — Master Development Prompt

Use this prompt at the beginning of every implementation stage.

## MASTER PROMPT

You are the principal software architect and implementation engineer for a privacy-first, cross-platform endpoint and web security platform.

Your task is to implement the requested development stage within the existing repository.

### Product objective

Build a lightweight security platform combining:

- Browser-based phishing and malicious URL protection.
- Tracker and unwanted-domain blocking.
- A Rust endpoint agent for Windows, Linux, and macOS.
- Local threat-intelligence matching.
- Integration with existing antivirus products through documented interfaces.
- Multi-source threat-intelligence ingestion.
- Server-side validation and correlation.
- Signed intelligence distribution.
- Privacy-controlled endpoint observations.
- Optional enterprise EDR, investigation, and response capabilities.

The platform must not require a custom antivirus engine to be built from scratch.

### Architecture principles

1. Prefer Rust for the endpoint agent, shared protocol implementation, and suitable backend services.
2. Use TypeScript for browser-extension functionality.
3. Isolate OS-specific functionality behind explicit interfaces.
4. Reuse established detection engines and data formats when technically and legally appropriate.
5. Keep local detection and protection functional during temporary server outages.
6. Make local-first privacy the default.
7. Keep external intelligence ingestion separate from intelligence approval and distribution.
8. Require signed, versioned, validated intelligence bundles.
9. Design for 100,000+ endpoints without prematurely overengineering infrastructure.
10. Make security controls enforceable in code rather than relying solely on documentation.

### Required workflow

Before implementing anything:

1. Inspect the repository structure, current branch, working tree, and relevant files.
2. Read the available product, architecture, agent, server, protocol, privacy, and threat-model documentation.
3. Identify existing implementations, tests, dependencies, and unfinished work.
4. Map the requested stage to concrete files and interfaces.
5. Identify compatibility risks, security implications, privacy implications, and unresolved decisions.
6. Present a concise implementation plan before making broad changes.

Then implement the smallest complete version of the requested stage.

### Engineering requirements

- Use typed interfaces and explicit error handling.
- Validate all external input.
- Apply resource limits to network handlers, parsers, queues, and scanners.
- Avoid blocking critical asynchronous execution paths.
- Implement retry and backoff where appropriate.
- Make operations idempotent where retries are expected.
- Use established cryptographic libraries.
- Avoid custom cryptographic primitives.
- Keep credentials out of logs and source code.
- Use secure defaults.
- Include unit and integration tests.
- Add negative tests for invalid, malformed, unauthorized, or unexpected inputs.
- Update documentation when behavior or interfaces change.

### Security requirements

All downloaded intelligence, rules, feed records, provider events, and endpoint observations must be treated as untrusted until validated.

The platform must not:

- Install unsigned intelligence.
- Trust an endpoint's report as sufficient evidence for global blocking.
- Allow one tenant to access another tenant's data.
- Accept arbitrary executable code through intelligence updates.
- Automatically delete or quarantine files based solely on unverified indicators.
- Upload complete browsing history by default.
- Bypass OS permissions or security mechanisms.

### Privacy requirements

Implement explicit collection policies.

Support:

- Local-only protection.
- Privacy-preserving cloud reporting.
- Administrator-authorized managed EDR.

Separate routine operational metadata from security observations and sensitive investigation data.

Every new telemetry field must have a documented purpose, collection rule, retention policy, and access policy.

### Testing requirements

Run the available:

- Formatting checks.
- Static analysis and linting.
- Unit tests.
- Integration tests.
- Relevant build targets.
- Security-focused negative tests.

If a test cannot run because the required operating system, entitlement, external service, or toolchain is unavailable, report the limitation and provide a reproducible test plan.

Never fabricate test results.

### Completion report

At the end of the stage, report:

1. Summary of changes.
2. Files created or modified.
3. Architecture decisions.
4. Tests executed and their actual results.
5. Security and privacy considerations.
6. Known limitations.
7. Remaining work.
8. Acceptance criteria that passed or failed.
9. The recommended next stage.

Stop after completing the requested stage. Do not automatically begin the next stage.

---

# Part 3 — Stage 0: Requirements and Feasibility

## Objective

Resolve major technical, privacy, licensing, and platform uncertainties before committing to implementation decisions.

## Prompt

Using the Master Development Prompt, perform Stage 0 of the product development roadmap.

Read `PRODUCT_SPEC.md` and all existing architecture documents.

Do not begin implementing the full product.

### Tasks

**1\. Inspect the repository**

Determine:

- Which specifications already exist.
- Which source modules exist.
- Which interfaces are implemented.
- Which features are planned but absent.
- Which tests and CI workflows are available.

**2\. Establish the initial MVP**

Recommend the smallest release that provides real user value.

Evaluate a browser extension providing tracker blocking and malicious-domain checks, supported by a Rust agent and a minimal intelligence distribution service.

Separate mandatory MVP features from later EDR features.

**3\. Evaluate dependencies and data sources**

Identify candidates for:

- Malicious URL and domain feeds.
- File-hash intelligence.
- Tracker lists.
- YARA-compatible detection.
- Sigma-derived event rules.
- Existing antivirus integrations.
- Optional scanning engines.

For each candidate, document its format, integration method, licensing questions, redistribution limitations, and technical risks.

Do not assume availability, commercial use, or redistribution rights without evidence.

**4\. Evaluate OS capabilities**

Identify the required Windows, Linux, and macOS APIs for the proposed MVP.

Document platform-specific permissions, entitlements, deployment restrictions, and compatibility concerns.

**5\. Create a threat model**

Identify the major trust boundaries and threats, including:

- Malicious or compromised feeds.
- Forged intelligence bundles.
- Compromised endpoint credentials.
- False-positive indicator poisoning.
- Tenant data exposure.
- Malicious browser destinations.
- Resource exhaustion.
- Unauthorized telemetry collection.
- Compromised signing keys.

**6\. Define measurable acceptance criteria**

Propose measurable targets for:

- Agent idle resource consumption.
- URL lookup latency.
- Intelligence update time.
- Event delivery reliability.
- False-positive handling.
- Privacy-policy enforcement.
- Deployment scale.

Mark proposed numbers as provisional until measured and approved.

### Deliverables

Create or update, as appropriate:

- `docs/requirements/MVP_REQUIREMENTS.md`
- `docs/requirements/DEPENDENCY_AND_FEED_REVIEW.md`
- `docs/Threat_Model.md`
- `docs/Architecture_Decisions.md`

Do not overwrite existing documents blindly.

### Acceptance criteria

- MVP scope is explicit.
- High-risk assumptions are identified.
- Licensing uncertainties are documented.
- Platform constraints are documented.
- The threat model includes intelligence poisoning and privacy risks.
- Requirements are testable.
- No unsupported implementation claims are made.

Stop after Stage 0.

---

# Part 4 — Stage 1: Project Foundation

## Objective

Create a maintainable development foundation without prematurely implementing the entire platform.

## Prompt

Implement Stage 1 using the Master Development Prompt.

### Tasks

**1\. Establish the workspace**

Inspect the existing repository before deciding whether to create a Cargo workspace or modify the current one.

Use a modular structure similar to:

- `crates/common-protocol`
- `crates/agent-core`
- `crates/agent-platform`
- `crates/intel-model`
- `services/intel-service`
- `services/ingestion-service`
- `services/observation-service`
- `apps/admin-console`
- `apps/browser-extension`

These are proposed boundaries, not mandatory directories. Adjust them to fit the repository.

Do not create empty crates solely to imitate the proposed structure.

**2\. Establish code quality controls**

Configure appropriate formatting, linting, dependency auditing, automated tests, and CI builds.

Add a dependency review process for security-sensitive libraries.

**3\. Define shared conventions**

Establish:

- Structured logging.
- Configuration loading.
- Error handling.
- Versioning.
- Feature flags.
- Health reporting.
- Test fixtures.

Never log secrets or complete browsing histories.

**4\. Establish the shared protocol**

Define initial types for:

- Endpoint identity.
- Protocol version.
- Agent health.
- Security observation.
- Intelligence manifest.
- Synchronization status.

Avoid prematurely implementing all production APIs.

**5\. Create a minimal runnable agent**

Implement a basic application lifecycle, configuration loading, logging, graceful shutdown, and a health status command or endpoint appropriate to the application.

### Deliverables

- Buildable project foundation.
- Shared protocol definitions.
- CI workflows.
- Basic agent lifecycle.
- Contributor and development documentation.

### Acceptance criteria

- The project builds in the available environment.
- Formatting and linting checks are configured.
- Unit tests run.
- Errors are handled explicitly.
- Platform-specific functionality has not been falsely represented as implemented.
- The repository remains easy to extend.

Stop after Stage 1.

---

# Part 5 — Stage 2: Threat Intelligence MVP

## Objective

Build the first working pipeline that converts authorized external intelligence into locally usable, signed updates.

## Prompt

Implement Stage 2 using the Master Development Prompt.

### Tasks

**1\. Implement feed adapters**

Start with one or two documented, legally usable sources.

Each adapter must:

- Identify its source.
- Retrieve data securely.
- Apply response-size and timeout limits.
- Parse the source format.
- Validate required fields.
- Report errors and freshness.
- Preserve provenance.
- Avoid logging secrets or sensitive response data.

Keep feed-specific parsing separate from the canonical intelligence model.

**2\. Define canonical indicators**

Support the initial indicator types:

- SHA-256 file hash.
- Domain.
- Full URL, where supported.

Represent type, canonical value, source, classification, timestamps, confidence, expiry, and distribution permissions.

Do not treat all indicators as interchangeable.

**3\. Implement normalization**

Add:

- Type-aware canonicalization.
- Deduplication.
- Provenance tracking.
- Expiry handling.
- Rejection of malformed indicators.
- Explicit handling of conflicting source classifications.

Do not let a low-quality source silently override a trusted source.

**4\. Implement bundle creation**

Generate versioned intelligence artifacts.

Include:

- Manifest version.
- Content hash.
- Signing-key identifier.
- Creation and expiry timestamps.
- Schema compatibility.
- Artifact signature.
- Revocation information.

Use a documented signature format and an established cryptographic implementation.

Keep signing-key material separate from ordinary application configuration.

**5\. Implement a test client**

The client must:

- Download an artifact.
- Verify its signature.
- Validate its schema.
- Reject invalid or incompatible content.
- Apply updates atomically.
- Preserve the last-known-good state.
- Reject rollback attempts unless an explicitly authorized recovery procedure is used.

### Deliverables

- Feed adapters.
- Canonical indicator model.
- Normalization pipeline.
- Signed bundle generator.
- Verification library.
- Local intelligence cache.
- Integration tests.

### Acceptance criteria

- A test indicator can travel from an approved source to the local cache.
- Invalid source records are rejected.
- Invalid signatures are rejected.
- A failed update does not corrupt the previous working database.
- Source provenance is retained.
- Expired and revoked indicators are handled correctly.
- Licensing metadata is tracked.

Stop after Stage 2.

---

# Part 6 — Stage 3: Browser Protection MVP

## Objective

Deliver visible user value through local tracker blocking and malicious-destination protection.

## Prompt

Implement Stage 3 using the Master Development Prompt.

### Tasks

**1\. Establish the extension**

Use TypeScript and supported browser extension APIs.

Choose the initial browsers based on the Stage 0 requirements.

Implement:

- Extension lifecycle.
- Configuration.
- Local rules and list loading.
- Navigation evaluation.
- User settings.
- Block explanations.

**2\. Implement URL handling**

Develop and test safe URL parsing and canonicalization.

Account for:

- Hostnames and subdomains.
- IDNs and punycode.
- Unicode.
- IPv4 and IPv6 literals.
- Ports.
- Redirects.
- Percent encoding.
- Query strings and paths.
- Invalid and unusual URLs.

Do not use naive string suffix checks that mistake `example.com.attacker.invalid` for `example.com`.

Do not assume every URL belonging to a domain should receive the same classification.

**3\. Implement local reputation checks**

Evaluate URLs against the local intelligence cache.

Separate:

- Known malicious URLs.
- Known malicious domains.
- Suspicious destinations.
- Trackers.
- Unknown destinations.
- Explicit allowlist entries.

**4\. Implement tracker blocking**

Integrate a compatible tracker list with recorded source and license information.

Support:

- List updates.
- Custom rules.
- Site-specific exceptions.
- Block explanations.
- Safe handling of malformed rules.

**5\. Implement the user interface**

Provide understandable explanations for blocked requests and destinations.

The extension should not claim that an unknown site is malicious merely because no reputation information is available.

**6\. Enforce privacy**

Do not upload routine browsing history.

Any remote reputation lookup must be explicitly designed, documented, and constrained by privacy policy.

**7\. Test compatibility**

Include tests for false matches, redirect handling, list updates, exceptions, and browser API limitations.

### Deliverables

- Installable browser extension.
- Local URL reputation checks.
- Tracker filtering.
- User-facing warnings.
- Privacy and permissions documentation.
- Automated URL test corpus.

### Acceptance criteria

- Known test indicators are handled correctly.
- Tracker rules can be updated without reinstalling the extension.
- Invalid lists do not break all protection.
- Exceptions behave predictably.
- Routine browsing history is not uploaded.
- The extension uses only required permissions.
- Unsupported browser behavior is documented.

Stop after Stage 3.

---

# Part 7 — Stage 4: Native Agent and Server

## Objective

Establish secure endpoint enrollment, communication, health reporting, and reliable event delivery.

## Prompt

Implement Stage 4 using the Master Development Prompt.

### Tasks

**1\. Implement endpoint enrollment**

Create a secure enrollment flow.

Requirements:

- Authenticate enrollment requests.
- Associate devices with the correct tenant.
- Issue unique endpoint credentials.
- Define credential rotation and revocation.
- Prevent arbitrary tenant assignment.
- Avoid embedding shared production credentials in binaries.

**2\. Implement secure transport**

Use authenticated transport and versioned APIs.

Define request size limits, timeouts, rate limits, and structured error responses.

**3\. Implement the event queue**

Create a bounded persistent queue.

Support:

- Durable storage.
- Retry with exponential backoff and jitter.
- Event IDs.
- Idempotent submission.
- Server acknowledgements.
- Queue limits.
- Safe recovery after crashes.
- Configurable event expiration.

**4\. Implement basic server ingestion**

The server must:

- Authenticate the endpoint.
- Validate the schema.
- Determine tenant identity from authenticated server-side context.
- Reject unauthorized fields and malformed payloads.
- Persist accepted events before acknowledging durable receipt.
- Handle duplicate event submissions safely.

**5\. Implement health reporting**

Track:

- Agent version.
- OS version where permitted.
- Intelligence version.
- Last successful synchronization.
- Queue health.
- Provider health.
- Relevant error counters.

Avoid collecting unrelated user activity.

**6\. Add device inventory**

Create basic endpoints for enrollment, health, and inventory.

### Deliverables

- Working enrollment API.
- Native agent communication.
- Persistent event queue.
- Server ingestion service.
- Device inventory.
- Authentication and authorization tests.

### Acceptance criteria

- A test endpoint can enroll securely.
- Unauthorized enrollment is rejected.
- Duplicate submissions do not create duplicate logical events.
- A network outage does not lose queued events within the defined retention policy.
- The agent recovers after restart.
- Tenant isolation is tested.
- Health reporting respects privacy configuration.

Stop after Stage 4.

---

# Part 8 — Stage 5: Antivirus Integration and Local Detection

## Objective

Collect existing antivirus detections and provide lightweight local indicator matching without replacing the installed antivirus.

## Prompt

Implement Stage 5 using the Master Development Prompt.

### Tasks

**1\. Define a provider abstraction**

Create a vendor-neutral interface for:

- Provider identity.
- Product capabilities.
- Health status.
- Incremental event retrieval.
- Event checkpoints.
- Error reporting.
- Collection gaps.

Keep provider-specific behavior in adapters.

Do not assume a universal antivirus integration API exists.

**2\. Implement one supported provider**

Choose a provider based on documented APIs and the MVP's supported operating system.

The integration must be read-only by default.

It must not disable, modify, or interfere with existing antivirus protection.

**3\. Normalize observations**

Represent:

- Observation ID.
- Provider and product identity.
- Original event ID.
- Detection name and classification.
- Event and collection times.
- Available file hashes.
- Reported action and status.
- Allowed supporting context.

Preserve the difference between a vendor-reported detection and a detection produced by this platform.

**4\. Add local hash matching**

Implement SHA-256 calculation and indexed lookup for files when justified by an event or policy.

Do not continuously hash every file on the system.

**5\. Add selected local rules**

Integrate a compatible engine or implement a narrow, well-defined event-rule evaluator.

If using YARA, validate rule compatibility, resource limits, and licensing.

Do not describe event-rule matching as comprehensive antivirus scanning.

**6\. Apply privacy controls**

Filter event fields before upload.

Sensitive file paths, usernames, command lines, and raw logs must be collected only when authorized by the applicable policy.

**7\. Test reliability**

Test:

- Provider disconnection.
- Duplicate events.
- Event gaps.
- Malformed records.
- Checkpoint recovery.
- Local database failure.
- High event volume.
- Offline operation.

### Deliverables

- Provider interface.
- One working antivirus adapter.
- Normalized observation schema.
- Local hash matching.
- Detection reporting.
- Provider health reporting.

### Acceptance criteria

- The adapter collects supported events through documented interfaces.
- Provider failures do not crash the agent.
- Duplicate observations are handled safely.
- Local reputation matching works offline.
- Existing antivirus protection remains enabled.
- Privacy filtering occurs before transmission.
- The source of each detection remains identifiable.

Stop after Stage 5.

---

# Part 9 — Stage 6: Correlation and Threat Validation

## Objective

Prevent false-positive intelligence poisoning while allowing validated threats to improve protection across participating endpoints.

## Prompt

Implement Stage 6 using the Master Development Prompt.

### Tasks

**1\. Implement the indicator lifecycle**

Support states such as:

- Observed.
- Pending validation.
- Approved.
- Published.
- Revoked.
- Expired.
- Rejected.

Define permitted transitions and record their causes.

**2\. Preserve provenance**

Record:

- Original source.
- Observation source.
- Validation evidence.
- Confidence.
- First-seen and last-seen timestamps.
- Expiry.
- Review history.
- Publication status.

**3\. Implement correlation**

Deduplicate repeated observations and identify corroboration across independent sources.

Do not count copies of the same upstream feed as independent evidence.

Distinguish between:

- A confirmed vendor detection.
- A heuristic suspicion.
- A hash reputation match.
- A customer-specific observation.
- An independently validated global indicator.

**4\. Define publication policies**

Use configurable policies based on source quality, evidence type, confidence, and potential impact.

For example, a single suspicious observation might trigger further analysis without immediately generating a fleet-wide block.

High-impact rules should require stronger validation and, where appropriate, human approval.

**5\. Implement false-positive correction**

Support:

- Indicator rejection.
- Revocation.
- Allowlisting.
- Reason recording.
- Audit history.
- Re-publication controls.

**6\. Enforce tenant and sharing boundaries**

A tenant's raw observation must not automatically become globally visible.

Sharing must follow the configured policy and applicable contractual restrictions.

**7\. Connect approved intelligence to publication**

Only approved records may enter a global distribution bundle.

### Deliverables

- Indicator lifecycle service.
- Correlation logic.
- Provenance and confidence model.
- Review and approval workflow.
- Revocation mechanism.
- Audit trail.

### Acceptance criteria

- Unvalidated observations are not automatically promoted to global blocking intelligence.
- Every published indicator has traceable provenance.
- Revocation prevents future distribution and triggers appropriate client updates.
- False positives can be corrected.
- Tenant-specific observations remain tenant-specific unless sharing is authorized.
- All state transitions are auditable.

Stop after Stage 6.

---

# Part 10 — Stage 7: Enterprise EDR

## Objective

Add central investigation, alert correlation, enterprise policies, and controlled response.

## Prompt

Implement Stage 7 using the Master Development Prompt.

### Tasks

**1\. Expand supported telemetry**

Add selected, documented OS event sources.

Implement platform adapters separately and normalize events into a versioned schema.

Avoid collecting every possible event simply because it is available.

**2\. Implement alert correlation**

Correlate related observations using supported evidence such as:

- Endpoint identity.
- Time windows.
- Process relationships.
- File hashes.
- Network indicators.
- Antivirus detections.

Track evidence and explain why events were grouped into an alert.

**3\. Implement an incident model**

Support:

- Alert identity.
- Severity.
- Status.
- Supporting observations.
- Affected endpoints.
- Timeline.
- Assigned investigator.
- Notes.
- Resolution.
- Audit history.

**4\. Implement administrative authorization**

Add role-based access control and tenant isolation.

Sensitive investigation data must require appropriate authorization.

**5\. Implement policies**

Allow authorized administrators to configure:

- Telemetry scope.
- Retention.
- Web protection.
- Indicator distribution.
- Endpoint groups.
- Response permissions.

**6\. Implement controlled response**

Start with alerting, warning, and supported reversible actions.

Any future quarantine or isolation capability must:

- Require explicit authorization.
- Have a defined scope.
- Be auditable.
- Include failure handling.
- Avoid deleting data solely because of unverified intelligence.

**7\. Add integration boundaries**

Define interfaces for SIEM export and other enterprise systems without embedding vendor-specific assumptions into the core event model.

### Deliverables

- EDR event pipeline.
- Alert and incident model.
- Investigation interface.
- RBAC.
- Tenant policies.
- Audit logging.
- Controlled response interfaces.

### Acceptance criteria

- Alerts preserve supporting evidence.
- Tenant isolation is verified.
- Administrators can investigate without bypassing authorization.
- Telemetry respects configured policy.
- Response actions require appropriate authorization.
- The system records response outcomes.
- The platform clearly distinguishes suspected from confirmed threats.

Stop after Stage 7.

---

# Part 11 — Stage 8: Production Hardening and Scale

## Objective

Prepare the platform for a controlled production deployment of 100,000+ endpoints.

## Prompt

Implement Stage 8 using the Master Development Prompt.

Do not assume the system is production-ready merely because the happy-path tests pass.

### Tasks

**1\. Perform load testing**

Simulate realistic endpoint behavior.

Measure:

- Concurrent endpoint connections.
- Events per second.
- Peak ingestion.
- Database write and query latency.
- Bundle generation time.
- Bundle download throughput.
- Update application latency.
- Storage growth.
- Recovery after an outage.

Simulate reconnect storms and large-scale update rollouts.

**2\. Test resilience**

Test:

- Database outages.
- Message broker outages, if used.
- Network partitions.
- Expired credentials.
- Interrupted downloads.
- Partial bundle delivery.
- Invalid signatures.
- Disk exhaustion.
- Corrupted local state.
- Service restarts.

**3\. Test security boundaries**

Verify:

- Tenant isolation.
- Endpoint authentication.
- Credential rotation.
- Authorization checks.
- Input validation.
- Rate limits.
- Signing-key rotation.
- Revocation.
- Anti-rollback behavior.
- Protection against malicious feed content.

**4\. Validate platform support**

Build and test on the supported Windows, Linux, and macOS configurations.

Verify platform-specific permissions, packaging, signing, installation, upgrade, and uninstall.

Mark unavailable or untested combinations as unsupported rather than claiming full compatibility.

**5\. Harden release processes**

Implement:

- Release artifact signing.
- Dependency audits.
- Software bill of materials.
- Controlled rollout.
- Rollback procedures.
- Release provenance.
- Vulnerability response procedures.

**6\. Establish operational monitoring**

Monitor:

- Ingestion latency.
- Queue depth.
- Error rate.
- Feed freshness.
- Bundle publication.
- Update failures.
- Endpoint health.
- Database health.
- Revocation propagation.
- Resource consumption.

**7\. Document operations**

Create runbooks for:

- Deployment.
- Backup and recovery.
- Credential compromise.
- Signing-key compromise.
- Feed poisoning.
- False-positive incidents.
- Intelligence rollback.
- Outage recovery.
- Privacy requests.
- Security incident response.

### Deliverables

- Load-test reports.
- Security-test reports.
- Platform compatibility matrix.
- Operational runbooks.
- Deployment documentation.
- Recovery procedures.
- Release process documentation.

### Acceptance criteria

- The platform has measured behavior at the target scale or a clearly documented staged validation plan.
- Reconnect storms do not cause uncontrolled resource consumption.
- Invalid updates cannot replace last-known-good intelligence.
- Recovery and revocation procedures have been tested.
- Security-critical failure modes have documented outcomes.
- Operational metrics and alerts are defined.
- Untested production assumptions are clearly listed.

Stop after Stage 8.

---

# Part 12 — Cross-Stage Prompt: Code Review and Security Audit

Use this prompt after any significant implementation.

## Prompt

Review the changes introduced in the current development stage.

Do not implement new features unless a minimal correction is necessary to address a confirmed defect and that correction is within the requested scope.

Inspect the diff and evaluate the following.

### Correctness

- Does the implementation meet the stated requirements?
- Are error conditions handled?
- Are retries safe?
- Are operations idempotent where required?
- Are concurrency and resource limits appropriate?
- Are platform assumptions correct?

### Security

- Can untrusted input reach privileged operations?
- Are signatures verified before updates are applied?
- Are authentication and authorization enforced?
- Can malformed input exhaust CPU, memory, or disk?
- Are secrets or credentials logged?
- Are tenant boundaries respected?
- Can a low-confidence observation trigger global blocking?

### Privacy

- Is each telemetry field necessary?
- Does local-only mode actually prevent routine event uploads?
- Are sensitive values redacted?
- Are retention and deletion behaviors defined?
- Can browsing history leak through logs, metrics, crash reports, or diagnostic requests?

### Reliability

- What happens during server outages?
- What happens when the disk is full?
- Can interrupted updates corrupt the active state?
- Can retries produce duplicate logical records?
- Can a revoked indicator remain active indefinitely?

### Testing

Identify missing:

- Unit tests.
- Integration tests.
- Negative tests.
- Permission tests.
- Cross-platform tests.
- Failure-recovery tests.

Run the available checks and report the actual results.

### Output

Provide:

1. Findings ranked by severity.
2. Reproducible evidence.
3. Required fixes.
4. Tests that demonstrate each fix.
5. Remaining risks.
6. A clear recommendation on whether the stage is ready to proceed.

Do not report the stage as approved if any critical security or privacy defect remains unresolved.

---

# Part 13 — Cross-Stage Prompt: Documentation Synchronization

Use after changing interfaces, schemas, architecture, or privacy behavior.

## Prompt

Inspect the implementation and update the relevant project documentation.

Potential files include:

- `PRODUCT_SPEC.md`
- `Architecture.md`
- `Agent.md`
- `Server.md`
- `Protocol.md`
- `Threat_Model.md`
- `Privacy_Model.md`
- Architecture decision records.
- API documentation.
- Test and deployment instructions.

Requirements:

- Document implemented behavior separately from planned behavior.
- Keep API and schema definitions consistent with the code.
- Record breaking changes.
- Record new dependencies and licensing considerations.
- Document platform-specific limitations.
- Document security and privacy trade-offs.
- Do not remove requirements merely because they are not implemented yet.
- Do not claim unsupported platform coverage.
- Do not invent test results.

Report all files updated and list unresolved documentation conflicts.

---

# Part 14 — Cross-Stage Prompt: Release Readiness

Use before creating a release candidate.

## Prompt

Evaluate the current repository against the product's approved MVP acceptance criteria.

Do not assume that planned features are implemented.

Inspect code, tests, documentation, CI results, dependencies, configuration, and deployment procedures.

Produce a release-readiness report covering:

1. Implemented functionality.
2. Missing mandatory functionality.
3. Failed or missing tests.
4. Known security vulnerabilities.
5. Privacy-policy enforcement.
6. Dependency and licensing review.
7. Supported platform and browser matrix.
8. Update integrity and recovery.
9. Performance and resource usage.
10. Deployment and rollback procedures.
11. Operational monitoring.
12. Known limitations and user-facing claims.

Classify findings as:

- Blocker.
- High.
- Medium.
- Low.
- Informational.

A release must not be declared ready when a blocker remains unresolved.

For all unresolved items, identify an owner, remediation action, and verification method.

Provide a final decision:

- Ready for controlled internal testing.
- Ready for limited pilot.
- Ready for production, subject to stated limitations.
- Not ready.

Base the decision on evidence from the repository and actual test results.

---

# Part 15 — Recommended Execution Order

| Order | Prompt | Primary output |
| --- | --- | --- |
| 1 | Stage 0 | Requirements and threat model |
| 2 | Stage 1 | Project foundation |
| 3 | Stage 2 | Threat intelligence pipeline |
| 4 | Stage 3 | Browser protection |
| 5 | Stage 4 | Agent and server |
| 6 | Stage 5 | Antivirus integration |
| 7 | Stage 6 | Correlation and validation |
| 8 | Stage 7 | Enterprise EDR |
| 9 | Stage 8 | Production hardening |

Use the security audit and documentation synchronization prompts throughout development, not just at the end.

The stages may overlap in planning, but implementation dependencies must be respected. For example, intelligence distribution requires an agreed schema and signature format, while EDR correlation requires a stable event model.

---

# Final Instruction

The purpose of these prompts is to help AI coding agents implement a coherent security product rather than generate disconnected components.

Every stage must leave the repository in a buildable, testable state where practical. Each stage must document what works, what remains incomplete, and what assumptions have not yet been validated.

The overall product objective remains:

**Provide useful local web and endpoint protection, aggregate authorized threat intelligence from multiple sources, validate before sharing, and distribute trusted updates while minimizing unnecessary collection of customer data.**

## How I'd use this in practice

1. Save the document as `AI_IMPLEMENTATION_PROMPTS.md`.
2. Put it alongside `PRODUCT_SPEC.md` and the architecture documents.
3. Start with Stage 0, not Stage 1. This helps the AI catch licensing, API, and scope problems before generating code.
4. Keep each stage in a separate coding-agent task or conversation, and commit successful stages independently.
5. Use the security audit prompt before accepting significant changes, especially signature verification, endpoint enrollment, telemetry collection, and intelligence sharing.

One additional recommendation: when you begin coding, create a `docs/decisions/` directory for approved architectural decisions. That