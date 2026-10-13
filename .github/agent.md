Here is `Agent.md`, defining the endpoint agent's internal architecture, Rust modules, lifecycle, platform-specific collectors, telemetry pipeline, detection, secure updates, and implementation roadmap. It is designed to complement `Architecture.MD`.

Writing

# Endpoint Agent — Design and Implementation

**Document:** `Agent.md`\
**Status:** Initial implementation specification\
**Component:** Endpoint Security Agent\
**Platforms:** Windows, Linux, macOS\
**Primary language:** Rust\
**Responsibilities:** Endpoint telemetry, local detection, antivirus scanning orchestration, secure communications, policy management, and response actions.

---

## 1\. Purpose

The endpoint agent is a persistent background application installed on each monitored endpoint.

It collects security telemetry, performs local detection, uploads events to the central security platform, receives authenticated policies and detection updates, and executes authorized security actions.

The agent must operate reliably under normal conditions, during temporary network outages, and when individual components fail.

### Primary objectives

- Monitor relevant endpoint security events.
- Detect known malware and suspicious activity locally.
- Upload normalized telemetry to the central server.
- Receive and validate signed detection-rule and signature updates.
- Maintain endpoint identity and report agent health.
- Support scheduled and on-demand scans.
- Execute authorized remediation actions.
- Minimize CPU, memory, disk, and battery consumption.
- Provide a shared implementation across Windows, Linux, and macOS.

### Non-goals for the initial MVP

The initial agent will not implement:

- A custom kernel driver for every operating system.
- A complete behavioral machine-learning engine.
- Arbitrary remote shell execution.
- An unrestricted remote file browser.
- Automatic destructive remediation without explicit policy.
- Full feature parity across all operating systems from the first release.

---

## 2\. Architectural Principles

### 2.1 Rust-first design

Rust is the primary implementation language for the agent core and user-mode modules.

Benefits include memory safety in safe code, compile-time data-race prevention for ordinary shared-memory code, native performance, and a mature build and test workflow.

Unsafe Rust, foreign-function interfaces, and native code must be narrowly scoped and reviewed.

### 2.2 Modular architecture

Collection, normalization, detection, transport, scanning, policy management, and updates must have separate responsibilities.

Platform-specific functionality must be isolated behind well-defined interfaces.

### 2.3 Local protection

The agent must retain its last-known-good policy and detection content while offline.

Essential local detections must not depend on continuous server connectivity.

### 2.4 Bounded resource consumption

Every queue, cache, parser, worker pool, and local data store must have defined resource limits.

When limits are reached, the agent must apply an explicit priority and backpressure policy rather than consume unbounded resources.

### 2.5 Fail-safe updates

The agent must validate update signatures and compatibility before activation.

It must preserve a recoverable last-known-good state and report update failures to the server.

### 2.6 Explicit capabilities

Each platform collector must report which event types and response capabilities it supports.

The backend must not interpret missing telemetry as proof that no suspicious activity occurred.

---

## 3\. Logical Architecture

The agent consists of the following logical components:

1. **Supervisor:** Starts, monitors, and coordinates agent components.
2. **Platform collector:** Collects OS-specific security events.
3. **Event normalizer:** Converts native events into the common schema.
4. **Local detection engine:** Evaluates supported local detection rules.
5. **Antivirus scanner:** Coordinates file scanning and scan scheduling.
6. **Event queue:** Buffers events and manages delivery state.
7. **Transport client:** Communicates with the central platform.
8. **Policy manager:** Validates and activates endpoint policies.
9. **Update manager:** Downloads, verifies, and activates signed content.
10. **Response manager:** Performs authorized remediation.
11. **Health monitor:** Reports component status and resource usage.
12. **Local state store:** Persists required state, queue metadata, and update versions.

### Data flow

```
Operating System
       |
       v
Platform Collector
       |
       v
Event Normalizer
       |
       +--------------------+
       |                    |
       v                    v
Local Detection       Bounded Event Queue
       |                    |
       v                    v
Local Alerts          Secure Transport
                            |
                            v
                     Central Ingestion

Server Policies --> Policy Manager
Server Updates  --> Update Manager
Server Commands --> Response Manager
Health Metrics  --> Health Monitor
```

The transport layer must not block the operating-system event callback path.

Expensive operations, including file hashing, deep scanning, and network uploads, must be dispatched to appropriately bounded workers.

---

## 4\. Rust Workspace and Module Layout

Suggested repository structure:

```
endpoint-security/
├── Cargo.toml
├── Cargo.lock
├── rust-toolchain.toml
├── crates/
│   ├── agent-core/
│   ├── agent-config/
│   ├── platform-api/
│   ├── platform-windows/
│   ├── platform-linux/
│   ├── platform-macos/
│   ├── telemetry/
│   ├── event-queue/
│   ├── detection-engine/
│   ├── scanner/
│   ├── transport/
│   ├── policy-manager/
│   ├── update-manager/
│   ├── response-manager/
│   ├── health-monitor/
│   └── common-protocol/
├── apps/
│   └── endpoint-agent/
├── installers/
│   ├── windows/
│   ├── linux/
│   └── macos/
├── tests/
│   ├── integration/
│   ├── compatibility/
│   ├── security/
│   └── performance/
└── docs/
    └── Agent.md
```

This layout is a target structure. The first implementation may combine related modules to avoid unnecessary crate boundaries.

### Module responsibilities

| Module | Responsibility |
| --- | --- |
| `agent-core` | Startup, shutdown, supervision |
| `agent-config` | Configuration loading and validation |
| `platform-api` | Common collector and capability interfaces |
| `platform-*` | Native OS event collection |
| `telemetry` | Normalization and event metadata |
| `event-queue` | Bounded buffering and acknowledgements |
| `detection-engine` | Local rules and alert generation |
| `scanner` | File scanning orchestration |
| `transport` | Authentication and network communication |
| `policy-manager` | Policy validation and activation |
| `update-manager` | Signed content and update lifecycle |
| `response-manager` | Authorized remediation |
| `health-monitor` | Health metrics and component status |
| `common-protocol` | Shared API and event schemas |

---

## 5\. Agent Lifecycle

### 5.1 Startup

The agent should perform these steps:

1. Load configuration from the approved system location.
2. Validate configuration and required permissions.
3. Initialize secure local state.
4. Load the last-known-good policy and detection content.
5. Initialize platform-specific collectors.
6. Start the local event queue.
7. Start detection and scanning workers.
8. Initialize the authenticated transport client.
9. Enroll or authenticate with the central server.
10. Report health, versions, and available monitoring capabilities.

A temporary network failure must not prevent already-configured local protection from starting.

If a required component fails, the supervisor must report a degraded state and apply a documented recovery policy.

### 5.2 Normal operation

During normal operation, the agent:

- Receives native events.
- Normalizes and classifies events.
- Applies local rules.
- Enqueues events according to priority.
- Uploads batches to the server.
- Receives and validates policies and updates.
- Executes authorized scans and remediation.
- Reports health and collector status.

### 5.3 Shutdown

The agent should:

1. Stop accepting new nonessential work.
2. Stop collectors using their documented lifecycle APIs.
3. Flush eligible queued events within a bounded deadline.
4. Persist necessary queue and update state.
5. Stop worker tasks cleanly.
6. Release native resources.

Forced shutdown must not corrupt update state or local queue metadata.

---

## 6\. Platform Collection Interfaces

Define a shared abstraction for platform-specific collectors.

An illustrative Rust interface:

```
pub trait EventSource: Send {
    fn capabilities(&self) -> Vec<EventCapability>;

    fn start(&mut self) -> Result<(), AgentError>;

    fn stop(&mut self) -> Result<(), AgentError>;
}
```

The actual interface should reflect asynchronous event delivery and native API lifecycle requirements. It must also define cancellation, error reporting, restart behavior, and ownership of native resources.

### 6.1 Windows collector

Initial integrations:

- Windows service lifecycle.
- ETW and supported system event sources.
- Process metadata and executable identity.
- File metadata and scan requests.
- AMSI integrations where applicable.
- Additional network or file-system monitoring as justified.

Potential native components:

- C with the Windows Driver Kit for a required kernel driver.
- Rust bindings for supported Windows APIs.
- A narrowly scoped native interface for components that cannot be integrated safely through existing Rust libraries.

Driver development must be justified by a documented monitoring or enforcement requirement.

### 6.2 Linux collector

Initial integrations:

- Process and executable metadata.
- eBPF event collection where supported.
- Linux audit interfaces where appropriate.
- File metadata and scanner integration.
- systemd lifecycle where available.

Use C for eBPF programs and a supported user-space library such as libbpf-rs for integration.

The collector must detect kernel feature availability and report unsupported event types.

### 6.3 macOS collector

Initial integrations:

- Apple Endpoint Security framework.
- Supported process and file security events.
- System extension lifecycle where required.
- File scanning and process metadata.
- Network monitoring only if required.

The implementation must account for entitlements, extension approval, event subscription restrictions, and signing requirements.

### 6.4 Capability reporting

Each collector should expose:

- Supported event types.
- Active event subscriptions.
- Missing permissions.
- Unsupported kernel or OS features.
- Last successful event time.
- Error and restart counters.
- Degraded operating mode.

These capabilities must be reported to the server and included in endpoint health.

---

## 7\. Common Event Model

All platform events must be converted to a versioned common schema.

Illustrative model:

```
pub struct SecurityEvent {
    pub event_id: EventId,
    pub schema_version: u16,
    pub timestamp_ns: u64,
    pub event_type: EventType,
    pub source: EventSourceKind,
    pub process: Option<ProcessContext>,
    pub file: Option<FileContext>,
}
```

The production schema should also include the appropriate endpoint identity, sequence metadata, OS information, and event-quality indicators.

### Event categories

Initial categories:

- Process creation.
- Executable metadata.
- File creation or modification.
- File scan results.
- Network connection metadata where supported.
- Detection alerts.
- Agent health and component errors.
- Policy and update status.

### Schema requirements

- Explicit schema versioning.
- Stable event identifiers.
- Bounded field sizes.
- Validated timestamps and enums.
- Defined handling of missing fields.
- Platform-specific extensions where required.
- Compatibility tests between agents and server versions.

Avoid including complete file contents or unnecessarily sensitive user data in routine telemetry.

---

## 8\. Event Queue and Backpressure

The agent requires a bounded local queue between collection and network transport.

### Queue behavior

1. Assign an event ID.
2. Apply local detection where required.
3. Enqueue the normalized event.
4. Batch eligible events for transmission.
5. Upload through the authenticated transport.
6. Record acknowledgements.
7. Retire acknowledged events.
8. Retry unacknowledged events according to policy.

### Queue requirements

- Bounded memory.
- Bounded disk consumption.
- Stable event identifiers.
- Crash-safe metadata where required.
- Retry backoff with jitter.
- Maximum batch size.
- Event prioritization.
- Duplicate-safe delivery.
- Explicit handling of dropped events.

High-priority detections and agent health events should not be starved by routine telemetry.

The agent must expose queue depth, oldest-event age, disk use, retry count, and dropped-event counters.

---

## 9\. Local Detection Engine

The local detection engine provides essential endpoint protection when the server is unavailable.

### Initial capabilities

- Known-malware hash matching.
- Supported signature matching.
- Basic process and file rules.
- Suspicious event sequences where supported.
- Local alert generation.
- Offline use of the last-known-good detection content.

### Rule model

Each rule should define:

- Rule ID and version.
- Supported platforms.
- Required event capabilities.
- Matching conditions.
- Severity and confidence.
- Expiration and compatibility metadata.
- Response recommendation.
- Regression-test cases.

Rules must be parsed and validated before activation.

The engine should support staged activation, rule-level error reporting, and rollback to a previously validated ruleset.

### Detection pipeline

```
Normalized Event
       |
       v
Rule Eligibility Check
       |
       v
Rule Evaluation
       |
       v
Detection Result
       |
       +--> Local Alert
       |
       +--> Event Queue
       |
       +--> Authorized Response Workflow
```

The rule engine must not perform unbounded computation on a native event callback thread.

---

## 10\. Antivirus Scanner

The scanner module coordinates file scanning. It is not responsible for operating-system event collection or server communication.

### Initial capabilities

- File hash calculation.
- Known-indicator matching.
- Integration with a selected scanning engine.
- Scheduled scans.
- On-demand scans.
- Scan-result reporting.
- Quarantine requests under an approved policy.

### Scanner requirements

- Bounded worker pools.
- Maximum file size and archive expansion limits.
- Timeouts and cancellation.
- Controlled CPU and I/O use.
- Duplicate scan suppression where appropriate.
- File identity and race-condition handling.
- Clear scan status and error reporting.

Do not assume a file is unchanged between event collection and scanning. Revalidate the relevant file identity and metadata before applying a destructive action.

The initial release should prioritize reliable scanning and reporting over building a custom malware-format parser.

---

## 11\. Transport Client

The transport module manages all authenticated communication with the central server.

### Responsibilities

- Endpoint authentication.
- TLS connection management.
- Batch serialization.
- Compression.
- Retry and reconnect logic.
- Request-size enforcement.
- Acknowledgement processing.
- API version compatibility.
- Rate-limit handling.
- Network and protocol metrics.

### Communication model

The initial implementation should use authenticated HTTPS batch uploads and a heartbeat or polling mechanism for desired state and commands.

A persistent gRPC stream may be added when lower command-delivery latency or reduced polling overhead is required.

### Reliability requirements

- Network operations must have deadlines.
- Transient failures must use bounded retry policies.
- Authentication failures must not be treated as ordinary transient network errors indefinitely.
- Invalid server responses must be rejected.
- Unacknowledged events must remain eligible for retry.
- Queue consumption must respect server backpressure.

---

## 12\. Policy Manager

The policy manager maintains the currently active endpoint configuration.

### Policy contents

A policy may define:

- Collection settings.
- Enabled detection rules.
- Scan schedules.
- Resource budgets.
- Telemetry priorities.
- Response permissions.
- Update channels.
- Data retention limits for local queues.

### Policy activation

1. Receive the proposed policy.
2. Verify authenticity and integrity.
3. Validate its schema and supported capabilities.
4. Check policy version and downgrade rules.
5. Persist the validated policy.
6. Activate it atomically.
7. Report activation status.

An invalid policy must not replace the last-known-good policy.

Policies must not grant permissions beyond those allowed by the local installation and platform security model.

---

## 13\. Update Manager

The update manager handles detection content and agent releases.

### Update types

- Detection rules.
- Antivirus signature bundles.
- Threat intelligence snapshots.
- Agent binaries.
- Platform-specific components.

### Update workflow

1. Retrieve signed release metadata.
2. Verify the signature against a trusted key.
3. Validate the release version and compatibility.
4. Download the artifact.
5. Verify its cryptographic hash.
6. Stage the artifact.
7. Activate it using an atomic or recoverable procedure.
8. Verify component health.
9. Report success or failure.

### Security requirements

- No activation of unsigned or invalidly signed content.
- Explicit version and rollback policy.
- Key rotation and revocation support.
- Separate release authorization from artifact hosting.
- Retention of a last-known-good version.
- Audit records for activation and rollback.

The update manager must distinguish a detection-content update from an agent binary upgrade because their risk and recovery requirements differ.

---

## 14\. Response Manager

The response manager executes a limited set of typed, authorized actions.

Initial actions may include:

- Requesting a file scan.
- Quarantining a confirmed detection.
- Refreshing approved detection content.
- Collecting a constrained diagnostic bundle.
- Applying a supported containment action when implemented and authorized.

Every action must validate:

- Command identity.
- Expiry and replay protection.
- Target endpoint.
- Local policy permissions.
- Required approvals.
- Parameters and resource limits.

The manager must record the outcome, including failure reasons where safe.

Arbitrary shell commands and unrestricted remote execution must not be part of the default interface.

High-impact remediation should support explicit approval policies and recovery procedures.

---

## 15\. Configuration and Local State

Configuration should be stored in the platform's appropriate protected system location.

The agent must distinguish:

- Immutable or installer-managed configuration.
- Server-managed policy.
- Local runtime state.
- Update and rollback metadata.
- Diagnostic and event queue data.

Server-managed settings must not silently override security-critical local constraints.

Sensitive credentials must use appropriate operating-system protection facilities and must not be written to ordinary logs.

Local state must have defined migration and corruption-recovery behavior.

---

## 16\. Logging and Health Monitoring

### Operational logs

Record:

- Agent startup and shutdown.
- Component initialization failures.
- Collector degradation.
- Transport connection failures.
- Update verification and activation.
- Policy changes.
- Detection-engine errors.
- Authorized remediation results.

Logs must not expose credentials, private keys, or unnecessary file contents.

### Health metrics

Expose:

- Agent version.
- Active policy version.
- Detection-content version.
- Collector status.
- CPU and memory use.
- Queue depth and disk consumption.
- Upload success and failure counts.
- Dropped-event counters.
- Last successful server contact.
- Last successful update.

Health reporting should use bounded data and avoid generating excessive telemetry of its own.

---

## 17\. Testing Strategy

### Unit tests

Test event normalization, configuration validation, rule matching, signature verification, retry logic, and policy activation.

### Integration tests

Test collector-to-normalizer flow, event delivery, acknowledgement handling, scan orchestration, and update activation.

### Security tests

Test malformed messages, invalid signatures, replayed commands, unauthorized policies, corrupted local state, and tenant or endpoint identity mismatches.

### Platform compatibility tests

Test supported OS versions, missing capabilities, permission failures, system upgrades, sleep and resume, and service restart behavior.

### Performance tests

Measure:

- Idle CPU and memory.
- Event-processing throughput.
- Queue behavior under overload.
- Scanner resource use.
- Network overhead.
- Event delivery latency.
- Recovery after long network outages.

### Failure-injection tests

Simulate:

- Server unavailability.
- Full local queue.
- Disk exhaustion.
- Invalid update packages.
- Interrupted activation.
- Collector crashes.
- Repeated process restarts.

---

## 18\. Implementation Roadmap

### Phase 1 — Agent skeleton

- Create the Cargo workspace.
- Implement service lifecycle.
- Implement configuration and structured logging.
- Implement endpoint identity and enrollment.
- Implement heartbeat and health reporting.

**Deliverable:** A running agent that registers with the server and reports health.

### Phase 2 — Telemetry

- Define the event schema.
- Implement the first OS collector.
- Normalize process and file metadata.
- Implement a bounded event queue.
- Implement authenticated batch upload and acknowledgements.

**Deliverable:** Reliable endpoint telemetry with retry and duplicate-safe ingestion.

### Phase 3 — Local detection

- Implement file hashing.
- Integrate the initial signature or scanning engine.
- Add a declarative local rule evaluator.
- Generate local detection records.
- Report detection evidence to the server.

**Deliverable:** Repeatable test detections on the first supported platform.

### Phase 4 — Policy and updates

- Implement signed rule manifests.
- Implement policy validation.
- Add staged activation and rollback.
- Add update status reporting.
- Add command authorization.

**Deliverable:** Secure, auditable detection-content distribution.

### Phase 5 — Cross-platform collectors

- Add Linux event collection and capability detection.
- Add macOS Endpoint Security integration.
- Complete the required Windows integrations.
- Add platform-specific packaging and signing.

**Deliverable:** Supported builds with documented capabilities on all three operating systems.

### Phase 6 — Production hardening

- Load-test event processing.
- Validate resource budgets.
- Test upgrade and recovery scenarios.
- Perform security review.
- Finalize packaging and deployment automation.

**Deliverable:** An agent ready for controlled production rollout.

---

## 19\. MVP Acceptance Criteria

The initial MVP is complete when:

- The agent installs and starts using the supported service mechanism.
- The endpoint enrolls using a unique identity.
- Process and executable metadata are collected on the first target OS.
- Events are uploaded using authenticated encrypted communication.
- Transient network failures do not cause unbounded resource growth.
- Duplicate uploads are handled safely.
- A local detection can generate an alert with supporting evidence.
- Invalid update signatures are rejected.
- Failed update activation can recover to a known-good state.
- Agent health reports collector failures and queue status.
- Tests cover malformed input, interrupted communication, and update failures.

Production release criteria must additionally define supported OS versions, resource budgets, event coverage, and measurable reliability objectives.

---

## 20\. Final Design Decisions

| Area | Decision |
| --- | --- |
| Primary language | Rust |
| Architecture | Modular agent core with platform adapters |
| Windows integration | Supported APIs; C/WDK driver only if necessary |
| Linux integration | Rust user space with eBPF/C where supported |
| macOS integration | Endpoint Security framework |
| Event transport | HTTPS/gRPC over TLS |
| Local queue | Bounded and retryable |
| Detection | Local rules and signatures |
| Scanning | Dedicated scanner module |
| Updates | Signed manifests and verified artifacts |
| Remote actions | Typed, authorized commands |
| Reliability | Health reporting, backpressure, recovery |
| Security | Unique endpoint identity, least privilege, auditability |

---

## Conclusion

The endpoint agent is the security enforcement and telemetry component of the overall platform.

Its core responsibilities are collecting reliable events, performing essential local detection, scanning files, securely communicating with the server, and applying validated policies and authorized response actions.

Rust provides the primary implementation foundation, while narrowly scoped native integrations provide the OS-specific capabilities needed for Windows, Linux, and macOS.

The first engineering priority is a reliable single-platform agent with secure enrollment, process telemetry, bounded event delivery, basic local detection, and signed update support. Additional platform capabilities should be introduced incrementally and validated through measurable tests.

Next file recommendation: `Server.md` — the backend architecture for ingestion, endpoint identity, detection workers, alert management, policy distribution, and scaling to 100,000+ agents.