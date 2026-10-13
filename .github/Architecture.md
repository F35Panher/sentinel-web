I'll create `Architecture.MD` as the main architecture document for your cross-platform EDR and antivirus platform, covering Windows, Linux, macOS, Rust/C/C++ boundaries, backend services, communication protocols, detection, security, and scaling to 100,000+ endpoints.

Writing

# Endpoint Security Platform — Architecture

**Document:** `Architecture.MD`\
**Status:** Initial architecture proposal\
**Target platforms:** Windows, Linux, macOS\
**Primary language:** Rust\
**Deployment target:** 100,000+ endpoints\
**Product scope:** Endpoint Detection and Response (EDR) and Antivirus (AV)

---

## 1\. Purpose

This document defines the high-level technical architecture for a cross-platform endpoint security platform.

The platform consists of endpoint agents installed on customer systems and a centralized server platform that aggregates telemetry, detects suspicious behavior, manages endpoint policies, distributes detection signatures, and generates security alerts.

The primary design goals are:

- Cross-platform support for Windows, Linux, and macOS.
- Reliable, low-overhead endpoint monitoring.
- Local and server-side malware detection.
- Secure, authenticated agent-server communication.
- Signed detection-rule and signature updates.
- Centralized endpoint inventory, alert management, and investigation.
- Horizontal scalability to 100,000 or more endpoints.
- Strong memory safety, modularity, and maintainability.

## 2\. Architectural Principles

### 2.1 Rust-first implementation

Rust will be the primary language for the agent core, telemetry pipeline, transport layer, detection orchestration, update manager, and most backend services.

C and C++ will be used when required for platform-specific interfaces, existing libraries, or operating-system components.

### 2.2 Platform abstraction

The common agent core must not depend directly on operating-system-specific event APIs.

Platform-specific collectors will implement a shared internal event-source interface and normalize collected events into a common schema.

### 2.3 Local and centralized detection

The endpoint agent must perform essential local detections, including supported signature checks and selected behavioral rules.

The central server will perform fleet-wide correlation, advanced event analysis, threat intelligence distribution, and centralized alert management.

Essential protection must continue when the endpoint is temporarily offline.

### 2.4 Secure by default

All agent-server communication must be authenticated and encrypted.

Detection updates, policies, and agent binaries must be authenticated before installation or activation. Administrative and remediation actions must be authorized and audited.

### 2.5 Reliability and bounded resource usage

The agent must use bounded queues, controlled concurrency, backpressure, and configurable resource limits.

A server outage must not cause unlimited local disk usage or uncontrolled memory consumption.

---

## 3\. High-Level System Architecture

The platform is divided into four logical layers.

### 3.1 Endpoint layer

Installed on each monitored device.

Responsibilities:

- Collect security telemetry.
- Normalize operating-system events.
- Scan files and inspect supported content.
- Evaluate local detection rules.
- Maintain a durable, bounded event queue.
- Upload telemetry and detection results.
- Receive policies, commands, and signed updates.
- Report agent health and monitoring capabilities.
- Perform authorized local response actions.

### 3.2 Ingestion layer

Receives telemetry from authenticated agents.

Responsibilities:

- Authenticate endpoint identities.
- Validate incoming event batches.
- Enforce request-size and rate limits.
- Validate tenant and device ownership.
- Normalize events and enforce schema versions.
- Publish accepted events to the durable event stream.
- Return acknowledgements for accepted batches.

### 3.3 Detection and management layer

Processes telemetry and manages endpoint state.

Responsibilities:

- Execute detection rules.
- Correlate events across processes and endpoints.
- Generate and manage alerts.
- Maintain device inventory and policy assignments.
- Manage enrollment and credential rotation.
- Distribute signed signatures and rules.
- Authorize and audit response commands.

### 3.4 Presentation layer

Provides the security operations console.

Responsibilities:

- Display endpoint inventory and health.
- Search security events.
- Investigate detections.
- View process and file timelines.
- Manage policies and update rollouts.
- Review alert evidence and severity.
- Initiate authorized remediation actions.

---

## 4\. Component Architecture

### 4.1 Endpoint agent

The endpoint agent will be implemented primarily in Rust.

Suggested logical modules:

| Module | Responsibility |
| --- | --- |
| `agent-core` | Lifecycle, configuration, supervision |
| `platform` | OS-specific collector interfaces |
| `telemetry` | Event normalization and batching |
| `detection-engine` | Local rule evaluation |
| `scanner` | File scanning orchestration |
| `transport` | Secure communication with the server |
| `event-queue` | Bounded local buffering and delivery state |
| `policy-manager` | Policy validation and activation |
| `update-manager` | Signed updates and rollback |
| `response` | Authorized remediation actions |
| `health` | Resource metrics and collector status |
| `common-protocol` | Shared event and API schemas |

These are logical modules and may initially live in fewer Cargo crates.

### 4.2 Endpoint operating model

The agent should run as a managed operating-system service or daemon.

Its main execution responsibilities are:

1. Initialize configuration and verify local state.
2. Load the last-known-good policy and detection rules.
3. Initialize platform-specific collectors.
4. Start the local detection engine.
5. Start the bounded event queue and transport workers.
6. Register or authenticate with the central server.
7. Send heartbeat and health information.
8. Process validated policy changes, updates, and commands.
9. Recover from transient failures without disabling essential protection.

Privileged operations should be separated from ordinary event processing wherever practical.

### 4.3 Platform adapters

#### Windows

Preferred initial components:

- Rust Windows service.
- Supported Windows APIs and event sources.
- Event Tracing for Windows (ETW) where suitable.
- Antimalware Scan Interface (AMSI) integrations where applicable.
- Windows Filtering Platform (WFP) when network filtering is required.
- Windows File System Minifilter driver only when required by the product's enforcement goals.

Kernel-mode code should be narrowly scoped and independently tested.

#### Linux

Preferred initial components:

- Rust daemon.
- eBPF-based event collection where supported.
- C for eBPF programs.
- libbpf-rs/libbpf for user-space integration.
- Linux audit interfaces or other supported fallbacks.
- systemd integration where available.

The agent must detect available kernel capabilities and report reduced monitoring coverage when required features are unavailable.

#### macOS

Preferred initial components:

- Rust-oriented user-space agent.
- Apple Endpoint Security framework for security event monitoring and supported authorization workflows.
- SystemExtensions framework where required.
- Network Extension only if the product requires corresponding network capabilities.
- Supported signing, entitlement, and notarization workflows.

Apple platform integration and entitlement availability must be validated early in development.

---

## 5\. Programming Language Boundaries

| Component | Preferred language | Rationale |
| --- | --- | --- |
| Agent core | Rust | Memory safety and concurrency |
| Telemetry normalization | Rust | Shared cross-platform implementation |
| Network transport | Rust | Typed protocols and reliable asynchronous I/O |
| Detection orchestration | Rust | Shared rule execution and event processing |
| Scanner orchestration | Rust | Resource management and safe interfaces |
| Windows user-mode collector | Rust | Integration with supported Windows APIs |
| Windows kernel driver | C initially | Mature WDK ecosystem |
| Linux eBPF programs | C | Established eBPF development model |
| Linux collector and manager | Rust | Safe user-space implementation |
| macOS collector | Rust with native bindings | Shared core and platform-specific interfaces |
| Existing native scanning libraries | C/C++ or existing implementation | Avoid unnecessary rewrites |
| Backend services | Rust or Go | Efficient network and event processing |

Foreign Function Interface (FFI) boundaries must be narrow, documented, and tested.

Unsafe Rust must be isolated wherever practical and reviewed independently. Native code must not expose unchecked pointers, ownership ambiguity, or unbounded buffers to the shared agent core.

---

## 6\. Agent-Server Communication

### 6.1 Protocol

Use HTTPS and gRPC over TLS for agent-server communication.

Use Protobuf or an equivalent versioned schema for event messages and management requests.

The initial implementation may use conventional HTTPS batch uploads and polling. Persistent streams can be introduced when command-delivery latency and connection efficiency justify them.

### 6.2 Proposed API endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /v1/agents/enroll` | Endpoint enrollment |
| `POST /v1/telemetry/batches` | Upload telemetry |
| `POST /v1/agents/heartbeat` | Report agent health |
| `GET /v1/agents/config` | Retrieve policy and desired state |
| `GET /v1/updates/manifest` | Retrieve signed update metadata |
| `POST /v1/agents/commands/{id}/result` | Report command execution status |

These paths are proposed contracts and may be replaced by equivalent gRPC methods.

### 6.3 Telemetry delivery

Telemetry delivery will use at-least-once semantics with idempotent ingestion.

The delivery process:

1. Collect events and assign stable event IDs.
2. Write events to a bounded local queue.
3. Batch and compress eligible events.
4. Upload batches using authenticated requests.
5. Acknowledge accepted batches or event ranges.
6. Retain unacknowledged events for retry.
7. Deduplicate retries at the server.

The agent must use retry backoff with jitter and enforce maximum queue size, batch size, and storage limits.

### 6.4 Command handling

Server commands must use a typed, versioned schema.

Each command must include:

- Unique command ID.
- Target endpoint or authorized device scope.
- Command type and validated parameters.
- Issuer and authorization context.
- Expiry and replay protection.
- Required policy or approval conditions.
- Execution status and audit metadata.

Arbitrary remote shell execution must not be part of the default command interface.

---

## 7\. Backend Architecture

The backend should begin as a small set of independently scalable services.

### 7.1 API gateway

Responsibilities:

- TLS termination.
- Request routing.
- Rate limiting.
- Request-size limits.
- Authentication integration.
- Operational metrics.

### 7.2 Enrollment and identity service

Responsibilities:

- Device enrollment.
- Device identity issuance.
- Credential rotation and revocation.
- Tenant association.
- Device lifecycle management.

Each endpoint must have an independent identity. Shared fleet-wide credentials are prohibited.

### 7.3 Telemetry ingestion service

Responsibilities:

- Authenticate agents.
- Validate event envelopes.
- Enforce tenant isolation.
- Apply backpressure.
- Publish accepted events to the event stream.
- Return acknowledgements.

### 7.4 Event stream

Kafka or Redpanda is the preferred initial choice when durable buffering and independent consumer scaling are required.

Responsibilities:

- Decouple ingestion from detection.
- Support replay after processing failures.
- Distribute events to detection and storage workers.
- Handle temporary downstream outages.

Partitioning strategy must be selected through load testing. Tenant and endpoint keys must not create severe partition skew.

### 7.5 Detection workers

Responsibilities:

- Evaluate server-side rules.
- Correlate related events.
- Maintain time-windowed detection state.
- Enrich events with threat intelligence.
- Generate alerts and supporting evidence.
- Deduplicate repeated detections.

### 7.6 Control-plane service

Responsibilities:

- Manage endpoint policies.
- Maintain desired agent state.
- Assign detection-rule versions.
- Schedule scans.
- Authorize response commands.
- Manage staged agent upgrades.
- Audit administrative operations.

### 7.7 Update service

Responsibilities:

- Publish signed manifests.
- Store versioned release artifacts.
- Enforce staged rollouts.
- Track update success and failure.
- Support key rotation and emergency revocation.

### 7.8 Alert and case management

Responsibilities:

- Maintain alert lifecycle.
- Track severity and confidence.
- Store supporting evidence references.
- Support analyst assignment and acknowledgement.
- Record remediation outcomes.
- Preserve an auditable investigation history.

---

## 8\. Data Storage Architecture

### 8.1 PostgreSQL

Use PostgreSQL as the source of truth for operational and transactional data.

Suggested entities:

- `tenants`
- `endpoints`
- `agent_versions`
- `endpoint_capabilities`
- `policies`
- `policy_assignments`
- `update_manifests`
- `update_rollouts`
- `alerts`
- `alert_evidence`
- `commands`
- `command_results`
- `audit_records`

Use database constraints and tenant-aware authorization to prevent cross-tenant access.

### 8.2 Kafka or Redpanda

Use the event stream for durable event transport, replay, and decoupled processing.

It is not a replacement for the authoritative endpoint, policy, and alert database.

### 8.3 OpenSearch

Use OpenSearch for searchable telemetry, process timelines, incident investigation, and threat-hunting queries.

Retention policies and index lifecycle management must be defined before large-scale production ingestion.

### 8.4 Object storage

Use object storage for:

- Signed detection bundles.
- Agent release packages.
- Selected diagnostic artifacts.
- Approved scan artifacts.
- Optional compressed raw-event archives.

Access must be authorized and time-limited where appropriate.

---

## 9\. Detection Architecture

The platform will contain two related but distinct detection engines.

### 9.1 Antivirus engine

Responsibilities:

- File hashing.
- Known-malware signature matching.
- Supported file-format parsing.
- Script and archive scanning.
- Optional reputation checks.
- Scheduled and on-demand scans.
- Quarantine and remediation.
- Scan result reporting.

The scanner must enforce file-size, recursion-depth, decompression, time, and memory limits.

Use a mature scanning library where practical rather than immediately implementing a complete malware-format parser and detection engine from scratch.

### 9.2 EDR engine

Responsibilities:

- Process creation and ancestry.
- File activity.
- Network activity.
- Persistence-related events.
- Relevant system and identity activity.
- Behavioral rule evaluation.
- Event correlation.
- Risk scoring.
- Alert generation.

The server performs deeper correlation across processes, time windows, and endpoints. The endpoint performs essential local rules and immediate actions that must remain available offline.

### 9.3 Rule distribution

Detection rules must be declarative, versioned, validated, and signed.

A rule should contain:

- Rule ID and version.
- Supported platforms and event types.
- Conditions and thresholds.
- Severity and confidence.
- Response recommendation.
- Expiration and compatibility metadata.
- Regression-test references.

Arbitrary executable code must not be downloaded as a substitute for a safe rule format.

---

## 10\. Secure Update Architecture

The update pipeline consists of:

1. Build or prepare a release.
2. Validate the schema and compatibility.
3. Run detection regression tests.
4. Generate package hashes and version metadata.
5. Sign the release manifest.
6. Publish the release artifact.
7. Distribute to a canary group.
8. Monitor health and detection outcomes.
9. Expand the rollout gradually.
10. Retain rollback capability.

Security requirements:

- Signing keys must be separated from ordinary application servers.
- Agents must verify signed metadata and package integrity.
- Revoked and prohibited downgrade versions must be rejected.
- Key rotation and emergency revocation must be supported.
- Updates must be activated atomically.
- Failed updates must restore a last-known-good state.
- Release approval and deployment status must be auditable.

Agent binary releases and detection-content releases should have appropriately separated release controls.

---

## 11\. Capacity and Scaling

The initial fleet target is 100,000 or more endpoints.

Capacity planning must use measured event rates and serialized event sizes.

For a fleet of 100,000 endpoints:

`Incoming events per second = endpoint count × average events per endpoint per second`

Daily uncompressed event volume:

`Daily bytes = events per second × average event size × 86,400`

For example, at two events per second per endpoint and 700 bytes per event, the fleet produces approximately 200,000 events per second and 12.1 billion events per day.

This is an illustrative planning case, not a production forecast.

Scaling requirements:

- Horizontal ingestion scaling.
- Durable stream buffering.
- Independent detection and storage consumers.
- Regional ingestion where required.
- Tenant quotas and event-size limits.
- Backpressure and retry control.
- Retention and index lifecycle management.
- Protection against reconnect storms.
- Staged fleet upgrades.
- Monitoring for event loss, queue lag, and processing latency.

Initial infrastructure sizing must follow load tests using representative event distributions.

---

## 12\. Security Requirements

The platform must implement the following controls.

### Endpoint identity

Each enrolled endpoint receives unique credentials that can be rotated and revoked.

### Transport security

All communications use authenticated TLS connections. Mutual TLS may be used as part of the endpoint identity design.

### Least privilege

Separate privileged OS integration from ordinary telemetry processing wherever practical.

### Update integrity

Verify signed manifests, package hashes, version policies, and release authorization before activation.

### Tenant isolation

Enforce tenant authorization in API services, data access, event processing, search, and administrative operations.

### Audit logging

Record policy changes, enrollment changes, release approvals, commands, and remediation actions.

### Resource limits

Use bounded queues, constrained parsers, rate limits, and controlled concurrency.

### Privacy

Minimize collected data, protect sensitive artifacts, enforce retention policies, and restrict access to diagnostic content.

### Safe remediation

Require authorization and appropriate policy checks before high-impact actions such as quarantine or containment.

---

## 13\. Monitoring and Operational Reliability

Monitor both the central platform and each endpoint.

### Endpoint metrics

- Agent availability.
- Agent and policy version.
- CPU and memory use.
- Queue size and dropped-event count.
- Last successful upload.
- Collector capability and health.
- Last successful update.
- Scanner activity and errors.

### Backend metrics

- Incoming events per second.
- Authentication failures.
- Ingestion latency.
- Event-stream consumer lag.
- Detection processing latency.
- Duplicate and rejected event rates.
- Search latency.
- Database health.
- Update rollout success.
- Alert generation latency.

The platform must distinguish a healthy endpoint with no detections from an endpoint with a failed or degraded collector.

---

## 14\. Implementation Roadmap

### Phase 1 — Agent foundation

- Create the Rust workspace.
- Implement agent lifecycle and service integration.
- Implement enrollment and heartbeat.
- Establish TLS communication.
- Create the initial backend and PostgreSQL schema.

**Exit criterion:** The agent enrolls, reconnects, and reports health reliably.

### Phase 2 — Telemetry

- Implement the common event schema.
- Add the first platform collector.
- Implement bounded event buffering.
- Implement batched uploads and acknowledgements.
- Add event ingestion and basic inventory.

**Exit criterion:** Events are delivered reliably through ordinary network interruptions.

### Phase 3 — Detection

- Implement executable hashing.
- Add basic local signature and rule matching.
- Implement server-side detection and alert creation.
- Add evidence storage and a basic analyst view.

**Exit criterion:** Test detections create reproducible alerts with supporting evidence.

### Phase 4 — Secure control plane

- Implement signed manifests.
- Distribute detection rules.
- Add policy versioning.
- Implement command authorization.
- Add update rollback and audit records.

**Exit criterion:** Invalid updates are rejected, and failed updates recover safely.

### Phase 5 — Platform expansion

- Harden the first production collector.
- Implement Linux-specific event collection.
- Implement macOS Endpoint Security integration.
- Add Windows-specific integrations as required.
- Package, sign, and test each platform.

**Exit criterion:** All supported operating systems pass their compatibility and detection tests.

### Phase 6 — Fleet-scale readiness

- Load-test 100,000 endpoints.
- Validate recovery from regional and backend failures.
- Test update storms and reconnect storms.
- Measure endpoint resource consumption.
- Perform security and privacy reviews.
- Establish operational runbooks.

**Exit criterion:** Measured capacity and recovery behavior meet the production service-level objectives.

---

## 15\. MVP Scope

The first MVP should include:

- One fully supported target operating system.
- A Rust agent service.
- Endpoint enrollment and unique identity.
- Process telemetry and executable hashes.
- Heartbeats and agent health.
- Reliable telemetry uploads.
- Basic local detection.
- Basic server-side correlation.
- Alert creation and a simple console.
- Signed rule updates.
- Safe update activation and rollback.

Defer the following until the MVP is validated:

- Custom kernel drivers without a demonstrated need.
- Advanced machine-learning detections.
- Sophisticated automated containment.
- Full cross-platform feature parity.
- Large numbers of independently deployed microservices.
- Long-term retention of all raw telemetry without a demonstrated requirement.

---

## 16\. Key Architectural Decisions

| Decision | Selected approach |
| --- | --- |
| Primary language | Rust |
| Native integration | C/C++ only where justified |
| Windows monitoring | Supported APIs; driver when required |
| Linux monitoring | Rust user space with eBPF/C where supported |
| macOS monitoring | Endpoint Security framework |
| Agent protocol | HTTPS/gRPC over TLS |
| Event schema | Versioned Protobuf or equivalent |
| Operational database | PostgreSQL |
| Event stream | Kafka or Redpanda |
| Event search | OpenSearch |
| Artifact storage | Object storage |
| Detection | Local rules plus server-side correlation |
| Update integrity | Signed manifests and packages |
| Scaling strategy | Horizontal scaling with bounded workloads |

## 17\. Open Decisions

The following decisions must be resolved before implementation:

1. Initial production operating system.
2. Required event coverage and supported OS versions.
3. Whether file-system enforcement requires kernel components.
4. Malware scanning engine and signature-source strategy.
5. Cloud-hosted, self-hosted, or hybrid deployment.
6. Tenant isolation and data residency requirements.
7. Event retention and expected average event rate.
8. Target endpoint CPU, memory, disk, and battery budgets.
9. Availability, recovery, and detection-latency objectives.
10. Initial engineering team size and release timeline.

---

## Conclusion

The platform should be Rust-first, modular, and built around a common event model with native operating-system integrations.

The endpoint agent provides essential local protection and reliable telemetry. The backend provides fleet-wide correlation, centralized policy management, alert investigation, and signed update distribution.

The first milestone is a reliable, secure single-platform agent. Cross-platform monitoring, mature antivirus capabilities, and fleet-scale operations should be added incrementally, with measurable acceptance criteria at every stage.

This is the initial `Architecture.MD` document. The next logical file is `README.md` to explain the project, prerequisites, repository layout, and how to build and run the first agent.