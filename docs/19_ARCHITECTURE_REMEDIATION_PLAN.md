# CBOS Architecture Remediation Plan

## Version 1.0

**Author Role:** Chief Architect  
**Source Document:** docs/99_ARCHITECTURE_GAP_ANALYSIS.md  
**Scope:** All 73 findings from the Gap Analysis  
**Decision Scale:** Accept · Reject · Defer

---

## Purpose

This document reviews every finding from the CBOS Architecture Gap Analysis and assigns a disposition (Accept, Reject, or Defer) with supporting rationale, affected documents, and the implementation phase in which resolution must occur.

Findings classified as **Accept** represent required architecture changes. Findings classified as **Defer** are real concerns but not required before Sprint 1–5. Findings classified as **Reject** are premature, over-engineered, or not aligned with current roadmap.

---

## Decision Rules Applied

**ACCEPT** — Security risk · Multi-tenant risk · Data integrity risk · Architectural contradiction · Missing entity or relationship that blocks implementation  
**REJECT** — Premature optimization · Over-engineering · Not needed before 10,000 customers · Not aligned with current roadmap  
**DEFER** — Needed later · Not required for Sprint 1–5 · Depends on a future module

---

## Finding Decisions

### Category 1: Contradictions

| Issue ID | Severity | Decision | Reason | Affected Documents | Implementation Phase |
|---|---|---|---|---|---|
| 1.1 | 🔴 Critical | **ACCEPT** | Irreconcilable contradiction between constitutional rule and frozen ERD decision. Every Project-creation service will implement different validation rules. Unresolved, this will produce data integrity violations at 100K projects. One document must yield and the decision must be recorded as an ADR before any Project entity code is written. | 04, 10 | Phase 1 — Foundation |
| 1.2 | 🔴 Critical | **ACCEPT** | Both Document 04 and Document 10 declare `organization_id` mandatory on every persisted entity. Engagement violates this rule. Absence enables cross-tenant leakage through any Engagement join. RLS cannot protect a row without `organization_id` present on the row. Must be resolved before the Engagement entity is implemented. | 04, 05, 10 | Phase 1 — Foundation |
| 1.3 | 🟠 High | **ACCEPT** | SubProject appears in three documents with three incompatible structural meanings. Without a canonical definition, engineers building SubProject features have no consistent model. Child entity foreign keys (`sub_project_id` on Task, Shoot, Gallery, Deliverable) cannot be added or omitted without this decision. Blocks implementation. | 04, 05, 10 | Phase 1 — Foundation |
| 1.4 | 🟠 High | **ACCEPT** | Quote cannot simultaneously be owned by Lead (ERD) and by Client+Project (Entity Model). Finance reporting and CRM pipeline attribution depend on a single, consistent ownership chain. This is an architectural contradiction that blocks both Finance and CRM domain implementation. | 05, 10 | Phase 1 — Foundation |
| 1.5 | 🟡 Medium | **ACCEPT** | `GalleryImage` (Document 05) and `GALLERY_ASSET` (Document 10) are incompatible bridge entities. The bridge table name, `favorite_count` field, and `Selection` entity must be canonically resolved before the Media/Gallery domain is implemented. Deferring this would require a costly migration mid-sprint. | 05, 10 | Phase 8 — Media |
| 1.6 | 🟡 Medium | **ACCEPT** | BillingAccount is a parent entity in the ERD but entirely absent from the Entity Model. The ownership chain Organization → BillingAccount → Subscription must be resolved into one canonical model before Finance is implemented. Inconsistency blocks Subscription and billing implementation. | 04, 05, 10 | Phase 7 — Finance |
| 1.7 | 🟡 Medium | **ACCEPT** | Three documents carry three incompatible event catalogs. Event subscribers and workflow triggers built from one catalog will not receive events from another. The canonical domain event catalog must be defined in a single authoritative document before any event-driven workflow is coded. | 04, 10, 11 | Phase 1 — Foundation |
| 1.8 | 🟡 Medium | **ACCEPT** | Conversation ownership is contradicted across three documents. The canonical parent (SubProject vs Project/Client) must be decided before the Communications domain is implemented. Without resolution, RBAC scope resolution for Conversations is undefined. | 04, 10 | Phase 6 — Communications |

---

### Category 2: Missing Entities

| Issue ID | Severity | Decision | Reason | Affected Documents | Implementation Phase |
|---|---|---|---|---|---|
| 2.1 | 🔴 Critical | **ACCEPT** | Workflows send email, SMS, and in-app notifications as first-class actions. Without `Notification`, `NotificationTemplate`, `NotificationLog`, and `NotificationDelivery` entities, every notification is hardcoded and there is no audit trail for customer communications. Workflow Engine implementation cannot proceed without these entities. | 07, 09, 10 | Phase 1 — Foundation |
| 2.2 | 🔴 Critical | **ACCEPT** | Document 12 specifies a full outbound webhook standard with organization-scoped subscriptions and encrypted signing secrets. Without `WebhookSubscription`, `WebhookDeliveryAttempt`, and `IntegrationCredential` entities, the webhook infrastructure has no persistent store. Integration surface cannot be built without these entities. | 12 | Phase 2 — Configuration |
| 2.3 | 🟠 High | **DEFER** | Document generation is referenced in the Industry Pack Architecture but is not required for Sprint 1–5. Depends on the Industry Templates module (Phase 9). `DocumentTemplate` and `GeneratedDocument` entities should be defined during Phase 9 design. | 09, 11 | Phase 9 — Industry Templates |
| 2.4 | 🟠 High | **DEFER** | Refund is referenced in domain events and an RBAC approval chain, but no active Sprint 1–5 feature requires it. Refund lifecycle, states, and audit requirements should be defined when the Finance domain matures in Phase 7. | 05, 10, 13 | Phase 7 — Finance |
| 2.5 | 🟠 High | **DEFER** | ProjectMilestone is referenced as a workflow action target but is not required for Sprint 1–5 core project management. Define `ProjectMilestone` entity during Phase 5 Projects. | 08 | Phase 5 — Projects |
| 2.6 | 🟠 High | **ACCEPT** | Document 11 describes subscription-gated features controlled by `min_plan` attributes and feature flags. Without `FeatureFlag` and `PlanFeature` entities, subscription tier enforcement has no persistent surface. The platform cannot enforce access control by plan without these entities. Required before any plan-gated feature is coded. | 11 | Phase 2 — Configuration |
| 2.7 | 🟡 Medium | **DEFER** | Tags are a workflow action but not a foundational requirement for Sprint 1–5. `Tag`, `TagDefinition`, and `EntityTag` entities should be added during Phase 3 Workflow when tag-based filtering and reporting are required. | 08 | Phase 3 — Workflow |
| 2.8 | 🟡 Medium | **DEFER** | Location as a plain `text` field on Shoot is sufficient for Sprint 1–5 use cases. Promoting Location to a managed entity with geocoding and map visualization is a Phase 8 Media enhancement. | 04, 05 | Phase 8 — Media |
| 2.9 | 🟡 Medium | **ACCEPT** | BillingAccount is a parent entity in the Master ERD that owns Subscription and BillingInvoice but is entirely absent from the Entity Model. Engineers implementing billing will find no entity definition. This is directly coupled to contradiction 1.6 and must be resolved in Phase 7. | 05, 10 | Phase 7 — Finance |
| 2.10 | 🟡 Medium | **DEFER** | `ReportDefinition` and `DashboardConfiguration` are produced by Industry Template installation. They have no relevance until Phase 9 and Phase 10. Define schemas when the Analytics and Industry Templates modules are designed. | 09, 10 | Phase 10 — Analytics |
| 2.11 | 🔵 Low | **DEFER** | `TemplateMigration` is a template version management concern that only becomes relevant when multiple installed template versions exist in production. Define during Phase 9 Industry Templates. | 09 | Phase 9 — Industry Templates |
| 2.12 | 🟠 High | **DEFER** | `StorageQuota` and `UsageTracking` are required before Media (Phase 8) launches with 10M assets. Not needed for Sprint 1–5. Define during Phase 8 design. | all | Phase 8 — Media |

---

### Category 3: Missing Relationships

| Issue ID | Severity | Decision | Reason | Affected Documents | Implementation Phase |
|---|---|---|---|---|---|
| 3.1 | 🔴 Critical | **ACCEPT** | `FieldValue` with no `organization_id` and no `entity_type` discriminator is the most dangerous gap in the model. PostgreSQL RLS cannot enforce tenant isolation on a row without `organization_id`. UUID collision between entities across tenants will produce incorrect FieldValue reads. At 100M+ projected FieldValue rows, this is a multi-tenant security incident at scale. Must be resolved before FieldValue schema is implemented. | 07, 10 | Phase 1 — Foundation |
| 3.2 | 🔴 Critical | **ACCEPT** | `FormSubmission` with no entity reference (`project_id`, `lead_id`, `client_id`, or `entity_type`/`entity_id` pair) is an orphaned record. Forms used for Lead intake, Client onboarding, and Shoot planning cannot be linked back to their subject entity. The Configuration Engine cannot function correctly without this relationship. | 07 | Phase 2 — Configuration |
| 3.3 | 🟠 High | **ACCEPT** | When a Lead converts, the resulting Client and Project have no structural link back to the originating Opportunity. CRM pipeline-to-revenue attribution is architecturally impossible without this relationship. Required before Phase 4 CRM is implemented. | 05, 10 | Phase 4 — CRM |
| 3.4 | 🟠 High | **ACCEPT** | Consistent with decision on 1.3: once SubProject hierarchy is canonically decided, the Task entity must carry a nullable `sub_project_id` FK and RBAC scope resolution must support SubProject. Blocking the SubProject implementation decision is the same as blocking this relationship. | 04, 05, 10 | Phase 5 — Projects |
| 3.5 | 🟡 Medium | **DEFER** | Conversation participant lists are a Communications domain feature. Not required for Sprint 1–5. Define `ConversationParticipant` entity during Phase 6 Communications. | 05, 10 | Phase 6 — Communications |
| 3.6 | 🟡 Medium | **DEFER** | Non-project workflows (client onboarding, lead nurturing) requiring an `engagement_id` or `client_id` anchor on `WorkflowExecution` are Phase 4 CRM concerns. Not required for Sprint 1–5. | 08, 10 | Phase 4 — CRM |
| 3.7 | 🟡 Medium | **DEFER** | Campaign attribution through Lead conversion to Client and Project is a CRM analytics feature. Not required for Sprint 1–5. Add `campaign_id` to Client and Project during Phase 4 CRM. | 05, 10 | Phase 4 — CRM |

---

### Category 4: Missing Workflows

| Issue ID | Severity | Decision | Reason | Affected Documents | Implementation Phase |
|---|---|---|---|---|---|
| 4.1 | 🟠 High | **DEFER** | Client onboarding is an operational workflow that requires the CRM and Configuration Engine to be in place first. Not required for Sprint 1–5. Define during Phase 4 CRM. | 09 | Phase 4 — CRM |
| 4.2 | 🔴 Critical | **ACCEPT** | The platform hosts 1,000 organizations on paid subscriptions. Trial expiry, payment failure grace periods, renewal reminders, and churn handling are not optional features — they are required for the platform to operate as a SaaS product. Without these workflows, subscription lifecycle is entirely manual and revenue collection is unreliable. Must be architecturally specified before production launch. | all | Phase 2 — Configuration |
| 4.3 | 🟠 High | **ACCEPT** | User.Invite permission exists in RBAC but no workflow governs invitation expiry, first-login onboarding, or default role assignment. Engineers implementing user management will build inconsistent flows. The invitation and onboarding workflow must be specified before user management is coded. | 13 | Phase 1 — Foundation |
| 4.4 | 🟠 High | **DEFER** | Organization offboarding and tenant purge are operationally important but not required before Sprint 1–5. Define a governed process during Phase 2 Configuration or Phase 7 Finance when billing finalization is designed. | 10, 11 | Phase 2 — Configuration |
| 4.5 | 🟠 High | **DEFER** | Asset retention enforcement is a Phase 8 Media concern. Not required for Sprint 1–5. Define the automated retention and purge workflow during Phase 8. | 10 | Phase 8 — Media |
| 4.6 | 🟡 Medium | **DEFER** | SLA breach escalation is referenced as a future capability in Document 08. Not required for Sprint 1–5. Define during Phase 3 Workflow. | 08 | Phase 3 — Workflow |
| 4.7 | 🟡 Medium | **DEFER** | Financial reconciliation workflow requires the Finance domain to be complete. Not required for Sprint 1–5. Define during Phase 7 Finance. | 05 | Phase 7 — Finance |

---

### Category 5: Missing RBAC Permissions

| Issue ID | Severity | Decision | Reason | Affected Documents | Implementation Phase |
|---|---|---|---|---|---|
| 5.1 | 🔴 Critical | **ACCEPT** | `TemplateAdmin` is referenced in Document 09 as the required permission for template installation and uninstall but does not exist in the RBAC catalog. `BusinessTemplate.Install`, `BusinessTemplate.Uninstall`, `BusinessTemplate.Upgrade`, and `BusinessTemplate.View` must be added to the permission catalog before any template management feature is coded. | 09, 13 | Phase 2 — Configuration |
| 5.2 | 🟠 High | **ACCEPT** | SubProject is a defined entity with a lifecycle. No view, create, edit, or delete permissions exist. Once SubProject hierarchy is resolved (1.3), RBAC must cover SubProject scope before any SubProject feature is built. | 13 | Phase 5 — Projects |
| 5.3 | 🟠 High | **ACCEPT** | Conversation and Message are defined entities in a bounded Communications context. The absence of `Conversation.View`, `Conversation.Create`, `Message.Send`, `Message.Delete`, and `Message.View` means the Communications domain has no RBAC coverage. Must be added before Phase 6. | 13 | Phase 6 — Communications |
| 5.4 | 🟠 High | **ACCEPT** | Forms are a Configuration Engine capability used across all industries. `Form.View`, `Form.Submit`, `Form.ViewSubmissions`, and `Form.ManageDefinitions` are needed before the Configuration Engine is coded. | 13 | Phase 2 — Configuration |
| 5.5 | 🟠 High | **DEFER** | Consistent with decision on 2.4: Refund permissions should be defined in Phase 7 Finance when the Refund entity and workflow are designed. Not required for Sprint 1–5. | 13 | Phase 7 — Finance |
| 5.6 | 🟠 High | **ACCEPT** | Platform Operator is an actor referenced for template publishing, organization suspension, and audit log access. Without `Platform.ManageTemplates`, `Platform.SuspendOrganization`, and `Platform.ViewAllAuditLogs`, platform operations have no RBAC model. Required before platform administration features are built. | 09, 13 | Phase 2 — Configuration |
| 5.7 | 🟡 Medium | **ACCEPT** | Soft delete is a standard data management operation required for GDPR compliance. `Engagement.Delete` is absent from the RBAC catalog. Must be added to the permission catalog before Engagement management is implemented. | 13 | Phase 1 — Foundation |
| 5.8 | 🟡 Medium | **DEFER** | Granular webhook permissions are an operational enhancement. `Organization.ManageIntegrations` is sufficient for Sprint 1–5. Add granular webhook permissions in Phase 6 Communications when webhook management matures. | 12, 13 | Phase 6 — Communications |
| 5.9 | 🟡 Medium | **DEFER** | AI audit permissions (`AI.ViewActionLog`, `AI.ReviewRejectedRecommendations`) are governance requirements for the AI domain. Not required before Sprint 1–5. Define during Phase 10 Analytics when AI governance is designed. | 13 | Phase 10 — Analytics |

---

### Category 6: Missing Configuration Support

| Issue ID | Severity | Decision | Reason | Affected Documents | Implementation Phase |
|---|---|---|---|---|---|
| 6.1 | 🔴 Critical | **ACCEPT** | Notification template configuration is a prerequisite for workflow-driven notifications. Without a `NotificationTemplate` entity with content fields, channel bindings, and locale support, every notification is hardcoded. The Workflow Engine cannot send configurable notifications without this. Directly coupled to 2.1. | 07, 09 | Phase 1 — Foundation |
| 6.2 | 🟠 High | **ACCEPT** | Document 09 requires custom fields collecting PII to be flagged with `is_pii: true` but `FieldDefinition` in Document 07 has no `is_pii` attribute. PII classification on the canonical entity definition is a GDPR data processing requirement. Must be added before any custom field is used to collect personal data. | 07, 09 | Phase 2 — Configuration |
| 6.3 | 🟠 High | **ACCEPT** | `FieldDefinition.validation_rules` is a JSON attribute with no defined schema or supported rule types. Engineers building form validation will produce incompatible implementations. The validation rule schema (supported types, structure, evaluation order) must be defined and documented before the Configuration Engine is coded. | 07 | Phase 2 — Configuration |
| 6.4 | 🟠 High | **DEFER** | Tax rate configuration is a Finance domain concern. A hardcoded `gst_amount` field is a known limitation acceptable for Sprint 1–5 in single-jurisdiction deployments. `TaxRate`, `TaxConfiguration`, and `TaxRule` entities should be defined in Phase 7 Finance. | 05, 07 | Phase 7 — Finance |
| 6.5 | 🟡 Medium | **DEFER** | Conditional field visibility in forms is a UX enhancement for complex intake workflows. Not required for Sprint 1–5. Design the conditional display logic model during Phase 3 Workflow or Phase 9 Industry Templates. | 07 | Phase 3 — Workflow |
| 6.6 | 🟡 Medium | **DEFER** | Locale and language configuration supports multi-language notifications and UI labels. Not required for Sprint 1–5. Add `locale` to Organization during Phase 6 Communications or Phase 9 Industry Templates. | 05, 11 | Phase 9 — Industry Templates |
| 6.7 | 🟡 Medium | **ACCEPT** | Directly coupled to 2.6. The feature flag configuration surface (entity, admin interface, API endpoint) is required to enforce subscription-gated access. Without a defined configuration surface, feature gates are conceptual and unenforced. Must be addressed in Phase 2 Configuration. | 11 | Phase 2 — Configuration |

---

### Category 7: Multi-Tenant Risks

| Issue ID | Severity | Decision | Reason | Affected Documents | Implementation Phase |
|---|---|---|---|---|---|
| 7.1 | 🔴 Critical | **ACCEPT** | Duplicate of 3.1, emphasized separately. `FieldValue` without `organization_id` cannot be protected by PostgreSQL RLS. At 100M+ projected rows, this is a systemic multi-tenant data leak. The fix — adding `organization_id` and `entity_type` to `FieldValue` — must happen before any custom field data is persisted. | 07, 10 | Phase 1 — Foundation |
| 7.2 | 🟠 High | **ACCEPT** | Redis Pub/Sub channels without `organization_id` namespacing mean every worker receives every tenant's events. Application-layer filtering without an architectural contract is insufficient. Channel naming conventions and per-organization namespacing must be defined in the System Architecture document before any event-driven service is coded. | 11 | Phase 1 — Foundation |
| 7.3 | 🟠 High | **DEFER** | Analytics aggregation isolation is a Phase 10 concern. Until the Analytics domain has an architecture document, this risk cannot be resolved. Defer to Phase 10 Analytics. | 10, 11 | Phase 10 — Analytics |
| 7.4 | 🟠 High | **DEFER** | AI context boundary isolation depends on the AI Architecture document that does not yet exist (10.3). Defer until the AI domain architecture is designed. Not required for Sprint 1–5. | 11 | Phase 10 — Analytics |
| 7.5 | 🟠 High | **ACCEPT** | Celery tasks without mandatory `organization_id` in the task payload are a cross-tenant mutation risk. A formal requirement stating that every Celery task payload must carry `organization_id` and that every handler must enforce tenant scoping before any database operation must be documented and enforced as a platform convention before background worker code is written. | 11 | Phase 1 — Foundation |
| 7.6 | 🟡 Medium | **ACCEPT** | Pre-signed URL generation that does not validate the `organization_id` in the path against the authenticated user's organization allows cross-tenant asset access through a URL generation bug. Server-side validation must be specified before the Media upload/download service is built. | 11 | Phase 8 — Media |
| 7.7 | 🟡 Medium | **ACCEPT** | RLS tenant isolation is void if any service connects with a role that bypasses RLS. The application role credential model, superuser restrictions, RLS bypass detection, and credential rotation policy must be documented before the database layer is implemented. | 11 | Phase 1 — Foundation |
| 7.8 | 🟡 Medium | **DEFER** | Search index organization isolation depends on a defined search infrastructure that does not yet exist. Defer to the phase when search infrastructure is specified. For Sprint 1–5, PostgreSQL full-text search with per-query `organization_id` filters is sufficient. | 11, 12 | Phase 10 — Analytics |

---

### Category 8: Scalability Risks

| Issue ID | Severity | Decision | Reason | Affected Documents | Implementation Phase |
|---|---|---|---|---|---|
| 8.1 | 🔴 Critical | **ACCEPT** | The EAV pattern at 100M+ FieldValue rows is a well-documented scalability failure mode. The architectural decision — pure EAV, JSONB column hybrid, or separate custom schema per entity type — must be made before the FieldValue schema is finalized. This decision cascades into every query, index, and reporting design. It cannot be changed after data is written at scale. | 07, 10 | Phase 1 — Foundation |
| 8.2 | 🔴 Critical | **ACCEPT** | Redis serving eight simultaneous roles with no partitioning creates a single point of contention and failure. A Redis failure simultaneously degrades event delivery, task queuing, session management, configuration cache, workflow cache, permission cache, idempotency keys, and rate limiting. Redis role partitioning (separate databases, key namespacing, or separate instances) must be defined before the infrastructure is provisioned. Full Redis Cluster is not required and would be over-engineering at current scale — namespacing and logical separation are sufficient. | 11 | Phase 1 — Foundation |
| 8.3 | 🟠 High | **REJECT** | A single PostgreSQL cluster with RLS, read replicas, and partition-by-organization-and-time is appropriate architecture at 1,000 organizations. PostgreSQL sharding and multi-tenant horizontal partitioning are not required before 10,000 organizations. The partitioning strategy described in Document 11 must be formally defined (partition schemes, maintenance windows, hot/warm/cold tiering), but this is a Phase 1 Foundation architecture decision, not a rejection of PostgreSQL as the database. The rejection is specifically of the implied need to move to a sharded architecture now. | 11 | Phase 1 — Foundation |
| 8.4 | 🟠 High | **DEFER** | Workflow execution table archival is a Phase 3 Workflow operational concern. For Sprint 1–5, the append-only tables will not reach problematic volumes. Define the archival pipeline, timeline, and archive schema during Phase 3 Workflow. | 08, 10, 11 | Phase 3 — Workflow |
| 8.5 | 🟠 High | **ACCEPT** | Configuration cache stampede on uniform TTL expiry is a real risk at 1,000 organizations. The fix — jittered TTL initialization and lock-based cache refresh — is a small architectural addition that prevents a class of database saturation incidents. Must be specified in the System Architecture before the configuration cache is implemented. | 11 | Phase 2 — Configuration |
| 8.6 | 🟠 High | **DEFER** | A dedicated OLAP store or analytics data warehouse is not required for Sprint 1–5. PostgreSQL aggregations via a read replica are sufficient for early reporting. Define the analytics data warehouse strategy in Phase 10 Analytics. Reject the implication that a dedicated warehouse is needed before Sprint 1 begins. | 11 | Phase 10 — Analytics |
| 8.7 | 🟠 High | **DEFER** | Media processing SLA, priority tiers, GPU resource specs, and queue isolation are Phase 8 Media concerns. Not required for Sprint 1–5. Define during Phase 8 design. | 11 | Phase 8 — Media |
| 8.8 | 🟠 High | **REJECT** | A dedicated search service (Elasticsearch, OpenSearch, Typesense, Meilisearch) is not required before 10,000 customers. PostgreSQL full-text search with trigram indexes is adequate for Sprint 1–5 volumes. Re-evaluate at Phase 10 Analytics when search volume and latency requirements are measurable. | 11, 12 | Phase 10 — Analytics |
| 8.9 | 🟡 Medium | **DEFER** | Gallery expiry scan optimization (time-partitioned index, expiry queue) is a Phase 8 Media optimization. Not required for Sprint 1–5. A nightly scheduled scan is acceptable at early volumes. | 05, 11 | Phase 8 — Media |
| 8.10 | 🟡 Medium | **ACCEPT** | Unbounded JWT token size caused by large permission sets is a latency and reliability risk. HTTP header size limits are real infrastructure constraints. The JWT token structure must define a maximum size limit and specify a lazy permission resolution fallback (reference token + server-side lookup) before the authentication system is implemented. | 12, 13 | Phase 1 — Foundation |

---

### Category 9: Security Risks

| Issue ID | Severity | Decision | Reason | Affected Documents | Implementation Phase |
|---|---|---|---|---|---|
| 9.1 | 🔴 Critical | **ACCEPT** | Finance mutation approval enforced only at the Workflow Engine layer is a defense-in-depth failure. Any authorized API caller can bypass workflow-driven approval by calling the Finance API directly. Approval enforcement must exist as a service-layer control independent of the Workflow Engine. This is a security architecture requirement that must be specified before any Finance endpoint is coded. | 08, 11 | Phase 7 — Finance |
| 9.2 | 🟠 High | **ACCEPT** | Pre-signed URLs with no maximum expiry window create effectively permanent public asset URLs. The architecture must define a maximum expiry window (e.g., 30 days), a mechanism to invalidate pre-signed URLs on gallery deletion or client access revocation, and an enforcement point. Required before the Media/Gallery sharing feature is built. | 11 | Phase 8 — Media |
| 9.3 | 🟠 High | **DEFER** | AI PII consent policy, GDPR Article 28 data processor framework, and LLM provider data processing agreements are AI domain concerns. Defer until the AI Architecture document is produced in Phase 10. Not required for Sprint 1–5. | 11 | Phase 10 — Analytics |
| 9.4 | 🟠 High | **ACCEPT** | Delegated permissions that survive the delegator's permission loss create privilege persistence risk. The RBAC architecture must define cascading revocation: when a delegator loses a permission, all delegations of that permission to subordinates must be automatically revoked. Must be specified before permission delegation is implemented. | 13 | Phase 1 — Foundation |
| 9.5 | 🟠 High | **DEFER** | Cryptographic tamper evidence for audit logs (hash chains, write-once storage, external audit sink) is a compliance enhancement beyond Sprint 1–5 requirements. Application-layer append-only enforcement is acceptable for early sprints. Evaluate external audit sink options in Phase 7 Finance or when a compliance certification requirement demands it. | 10, 11, 13 | Phase 7 — Finance |
| 9.6 | 🟡 Medium | **ACCEPT** | Password complexity policy, minimum length, HaveIBeenPwned breach detection, account lockout after failed attempts, and temporary suspension are standard security requirements for a platform managing business-critical financial and client data. These must be specified in the authentication architecture before user login is implemented. | 11, 12 | Phase 1 — Foundation |
| 9.7 | 🟡 Medium | **ACCEPT** | CSRF protection is a foundational web security requirement. JWT in Authorization headers provides protection for pure API clients, but any cookie-based session fallback or browser-native flow requires explicit CSRF mitigation. The API standards document must specify the CSRF strategy before frontend authentication is implemented. | 12 | Phase 1 — Foundation |
| 9.8 | 🟡 Medium | **ACCEPT** | Custom field `text`, `textarea`, and `json` values stored from form submissions and rendered in the React frontend without output encoding are a stored XSS vector. The API standards and frontend architecture must specify output encoding, input sanitization requirements, and Content Security Policy before custom field rendering is implemented. | 07, 12 | Phase 2 — Configuration |
| 9.9 | 🟡 Medium | **ACCEPT** | Prohibiting secrets in `WorkflowVersion.definition_json` as a convention is insufficient. A publish-time validation scan must reject workflow definitions containing credential patterns. This must be a specified enforcement control in the Workflow Engine architecture, not a documentation note. | 08 | Phase 3 — Workflow |

---

### Category 10: Documentation Gaps

| Issue ID | Severity | Decision | Reason | Affected Documents | Implementation Phase |
|---|---|---|---|---|---|
| 10.1 | 🔴 Critical | **DEFER** | A dedicated Analytics Architecture document is required before Phase 10. Analytics domain entities, aggregation pipeline, query isolation model, and reporting data model are all undefined. However, Analytics is not required for Sprint 1–5. Create the Analytics Architecture document as the first deliverable of Phase 10 design. | missing | Phase 10 — Analytics |
| 10.2 | 🟠 High | **DEFER** | Communications and Marketing Architecture documents are required before Phase 6. Email/SMS delivery providers, bounce handling, unsubscribe, opt-out, and SPF/DKIM requirements must all be specified. Not required for Sprint 1–5. Create these documents at the start of Phase 6 design. | missing | Phase 6 — Communications |
| 10.3 | 🟠 High | **DEFER** | An AI Architecture document is required before AI features are built. LLM provider integration, model selection, fallback, cost control, governance policy, and latency SLA are all undefined. Not required for Sprint 1–5. Create the AI Architecture document before the AI domain is implemented. | missing | Phase 10 — Analytics |
| 10.4 | 🟠 High | **ACCEPT (partial)** | The absence of a Data Privacy / GDPR Framework document (inferred as Document 03) is a security and compliance gap. The platform processes client PII under GDPR Article 28. A Data Privacy Policy document specifying data categories, retention periods, GDPR legal bases, CCPA obligations, and data processor agreements must be created before any personal data is collected. Documents 01 (Product Vision), 02 (Technical Specification), and 06 (unknown) are deferred — their absence does not block Sprint 1. | missing | Phase 1 — Foundation |
| 10.5 | 🟠 High | **DEFER** | SLA and SLO definitions are operationally important but do not block Sprint 1–5. Define API response time targets, availability commitments, and workflow execution latency SLOs before production launch. Phase 3 Workflow is a reasonable target. | missing | Phase 3 — Workflow |
| 10.6 | 🟡 Medium | **DEFER** | A formal integration catalog is needed before Phase 6 Communications. Supported providers, integration contracts, and fallback strategies for email, SMS, payment, LLM, storage, and CDN should be catalogued during Phase 6 design. | missing | Phase 6 — Communications |
| 10.7 | 🟡 Medium | **DEFER** | Multi-currency and multi-jurisdiction documentation is a Phase 7 Finance concern. Acceptable to operate single-currency in Sprint 1–5. | missing | Phase 7 — Finance |
| 10.8 | 🟡 Medium | **DEFER** | Mobile/PWA architecture is not required for Sprint 1–5. The React web application is the primary delivery surface. Design mobile architecture when the user base and mobile use case requirements are validated. | missing | Phase 8 — Media |
| 10.9 | 🟡 Medium | **DEFER** | Data import and migration tooling is a sales and customer acquisition enabler, not a Sprint 1–5 platform requirement. Define a migration strategy before Phase 9 Industry Templates, as template-based onboarding is the primary migration entry point. | missing | Phase 9 — Industry Templates |
| 10.10 | 🔵 Low | **DEFER** | A Disaster Recovery runbook is operationally required before production launch but is not a Sprint 1–5 design concern. Define the runbook during Phase 7 Finance or before the first production deployment. | missing | Phase 7 — Finance |

---

## Decision Summary

| Decision | Count | % |
|---|---|---|
| ACCEPT | 42 | 58% |
| DEFER | 27 | 37% |
| REJECT | 4 | 5% |

**Rejected findings:** 8.3 (PostgreSQL sharding), 8.6 (OLAP warehouse before Sprint 1), 8.8 (dedicated search before 10K customers). Note: 8.3 is a partial reject — the partitioning strategy must still be formally defined; the rejection is of the implication that sharding is immediately required.

---

## Immediate Architecture Changes

The following items must be resolved before Sprint 1 coding begins. No entity schema, API endpoint, service, or database migration should be written until these decisions are recorded as Architecture Decision Records (ADRs) or document amendments.

### IC-01 — Resolve Project Ownership Rule (1.1)

**Action:** Choose one canonical position: either `client_id` and `engagement_id` are optional on Project (ERD position) or mandatory (Domain Model Constitution position). Update the losing document. Record the decision as an ADR.  
**Blocks:** Every service that creates or validates a Project entity.

---

### IC-02 — Add `organization_id` to Engagement (1.2)

**Action:** Add `organization_id` as a mandatory, indexed column to the Engagement entity definition in Document 05 and the Engagement table in Document 10. Add corresponding RLS policy.  
**Blocks:** Any query that joins or filters by Engagement.

---

### IC-03 — Add `organization_id` and `entity_type` to FieldValue (3.1 / 7.1)

**Action:** Add `organization_id` (mandatory, indexed, FK to Organization) and `entity_type` (discriminator, e.g., `asset`, `project`, `client`) to the FieldValue entity. Update the EAV query pattern accordingly. Add RLS policy on FieldValue using `organization_id`.  
**Blocks:** Any feature using custom fields.

---

### IC-04 — Define EAV vs JSONB Hybrid Strategy (8.1)

**Action:** Decide the custom field storage architecture: pure EAV, JSONB column per entity type, or hybrid. Document the performance model, index strategy, and query patterns for the chosen approach. Record as an ADR.  
**Blocks:** FieldValue schema finalization, which blocks all custom field implementation.

---

### IC-05 — Add Entity Anchor to FormSubmission (3.2)

**Action:** Add an entity anchor to FormSubmission: either a polymorphic (`entity_type`, `entity_id`) pair or explicit FKs (`project_id`, `lead_id`, `client_id`, all nullable with a constraint requiring at least one). Update Document 07.  
**Blocks:** Form submission linking for Lead intake, Client onboarding, and Shoot planning.

---

### IC-06 — Define Notification / NotificationTemplate / NotificationDelivery Entities (2.1 / 6.1)

**Action:** Add `Notification`, `NotificationTemplate` (with content fields, channel binding, locale support), `NotificationLog`, and `NotificationDelivery` entity schemas to Document 05 and Document 07. Add `organization_id` to all.  
**Blocks:** Workflow Engine notification actions.

---

### IC-07 — Resolve SubProject Hierarchy (1.3 / 3.4)

**Action:** Decide whether SubProject is an operational container (children: Task, Shoot, Gallery, Deliverable) or a simple project subdivision (no children). Update Documents 04, 05, and 10 to match. If SubProject is a container, add nullable `sub_project_id` FK to all child entities.  
**Blocks:** SubProject feature implementation, RBAC SubProject scope resolution.

---

### IC-08 — Resolve Quote Ownership (1.4)

**Action:** Decide the canonical Quote ownership: Lead-owned (ERD) or Client+Project-owned (Entity Model). Add the correct FK(s) to the Quote entity. Update Documents 05 and 10 to match.  
**Blocks:** Finance and CRM domain implementation.

---

### IC-09 — Define Canonical Domain Event Catalog (1.7)

**Action:** Produce one authoritative domain event catalog. Supersede the smaller catalogs in Documents 04 and 11 with the expanded catalog from Document 10 (or a reconciled version). Remove conflicting catalogs from Documents 04 and 11. Record location of the canonical catalog.  
**Blocks:** Event-driven workflow triggers, event subscriber implementation.

---

### IC-10 — Add Missing RBAC Permissions (5.1–5.7)

**Action:** Add the following permission groups to Document 13:  
- `BusinessTemplate.Install`, `BusinessTemplate.Uninstall`, `BusinessTemplate.Upgrade`, `BusinessTemplate.View` (5.1)  
- `SubProject.View`, `SubProject.Create`, `SubProject.Edit`, `SubProject.Delete` (5.2)  
- `Conversation.View`, `Conversation.Create`, `Message.Send`, `Message.Delete`, `Message.View` (5.3)  
- `Form.View`, `Form.Submit`, `Form.ViewSubmissions`, `Form.ManageDefinitions` (5.4)  
- `Platform.ManageTemplates`, `Platform.SuspendOrganization`, `Platform.ViewAllAuditLogs` (5.6)  
- `Engagement.Delete` (5.7)  
**Blocks:** Any RBAC enforcement in the above domains.

---

### IC-11 — Define FeatureFlag / PlanFeature Entities and Configuration Surface (2.6 / 6.7)

**Action:** Add `FeatureFlag`, `PlanFeature`, and `SubscriptionFeature` entity schemas to Document 05. Add `min_plan` to `ProjectType` and other gated entities in Document 07. Define the API endpoint for feature flag evaluation. Specify enforcement mechanism at service layer.  
**Blocks:** Subscription-gated feature access control.

---

### IC-12 — Define Redis Role Partitioning Strategy (8.2 / 7.2)

**Action:** Partition Redis roles into logical groups (e.g., DB 0: auth/session, DB 1: configuration cache, DB 2: Celery task queue, DB 3: event pub/sub, DB 4: rate limiting / idempotency). Define channel naming convention including `organization_id` namespace for Pub/Sub. Document in System Architecture (Document 11).  
**Blocks:** Infrastructure provisioning, event-driven service implementation.

---

### IC-13 — Define Celery Worker Tenant Context Requirement (7.5)

**Action:** Document a platform-wide requirement: every Celery task payload must carry `organization_id`. Every task handler must enforce tenant scoping before any database operation. Define enforcement as a base task class requirement. Add to System Architecture (Document 11).  
**Blocks:** All background worker implementation.

---

### IC-14 — Define Validation Rules Schema for FieldDefinition (6.3)

**Action:** Define the `validation_rules` JSON schema: supported rule types (required, min_length, max_length, regex, min_value, max_value, allowed_values), structure, and evaluation order. Document in Document 07.  
**Blocks:** Configuration Engine form validation implementation.

---

### IC-15 — Add `is_pii` to FieldDefinition (6.2)

**Action:** Add `is_pii: boolean` attribute to `FieldDefinition` in Document 07. Define the enforcement behavior (masking in audit logs, exclusion from AI context without consent, GDPR export inclusion).  
**Blocks:** PII-compliant custom field collection.

---

### IC-16 — Define Password Policy and Account Lockout (9.6)

**Action:** Specify minimum password length, complexity requirements, breach detection strategy (HaveIBeenPwned integration), maximum failed attempt count, lockout duration, and account suspension rules. Document in System Architecture (Document 11) and API Standards (Document 12).  
**Blocks:** Authentication service implementation.

---

### IC-17 — Specify CSRF Protection Strategy (9.7)

**Action:** Define CSRF mitigation strategy in API Standards (Document 12): state explicitly whether cookie-based sessions are used, and if so specify SameSite, CSRF token, or double-submit cookie strategy. If JWT-only Authorization header pattern is enforced universally, document this explicitly.  
**Blocks:** Frontend authentication implementation.

---

### IC-18 — Specify XSS Sanitization and CSP Policy (9.8)

**Action:** Define output encoding requirements for custom field values rendered in the frontend. Specify input sanitization for `text`, `textarea`, and `json` field types. Define Content Security Policy for the React application. Add to API Standards (Document 12).  
**Blocks:** Custom field rendering in frontend.

---

### IC-19 — Specify Finance Service-Layer Approval Enforcement (9.1)

**Action:** Document service-layer approval enforcement for Finance mutations (invoice creation, payment recording, refund initiation) that is independent of the Workflow Engine. Define the enforcement mechanism (service-layer guard, middleware, pre-save hook) that prevents approval bypass via direct API call.  
**Blocks:** Finance API implementation.

---

### IC-20 — Define RBAC Delegation Cascading Revocation (9.4)

**Action:** Add a rule to the RBAC architecture (Document 13): when a delegator's permission is revoked, all delegations of that permission are automatically revoked within one transaction. Specify the cascade mechanism and audit event emitted.  
**Blocks:** Permission delegation implementation.

---

### IC-21 — Define RLS Application Role Restrictions (7.7)

**Action:** Document that no application service may connect to PostgreSQL using a superuser role or a role with BYPASSRLS. Define how RLS enforcement is validated in CI/CD, how bypass is detected in monitoring, and how application role credentials are rotated. Add to System Architecture (Document 11).  
**Blocks:** Database layer implementation.

---

### IC-22 — Define Configuration Cache Stampede Prevention (8.5)

**Action:** Specify jittered TTL initialization (randomized TTL within a window on cache write) and lock-based refresh (single worker refreshes; others wait) for the organization configuration cache. Add to System Architecture (Document 11).  
**Blocks:** Configuration cache implementation.

---

### IC-23 — Define JWT Maximum Token Size and Lazy Permission Fallback (8.10)

**Action:** Define a maximum JWT token size. Specify a lazy permission resolution fallback: if the permission set exceeds the size limit, issue a reference token and resolve permissions server-side from the permission cache on each request. Document in API Standards (Document 12).  
**Blocks:** Authentication and authorization middleware implementation.

---

### IC-24 — Define User Invitation and Onboarding Workflow (4.3)

**Action:** Define the invitation workflow: invitation email with expiry (N hours), first-login onboarding steps, default role assignment, and invitation revocation. Document in Workflow Engine architecture or a dedicated User Management document.  
**Blocks:** User management implementation.

---

### IC-25 — Define Subscription Lifecycle Workflow (4.2)

**Action:** Define workflows for: trial expiry and conversion prompt, payment failure and grace period, subscription renewal and reminder, plan upgrade/downgrade feature gate changes, and churn (cancellation) and data export trigger. These workflows require `organization_id` scoping and must integrate with the notification system (IC-06).  
**Blocks:** SaaS subscription revenue reliability.

---

### IC-26 — Create Data Privacy / GDPR Framework Document (10.4)

**Action:** Create the Data Privacy Policy document (Document 03) specifying: personal data categories collected, GDPR legal bases for processing, CCPA obligations, retention periods by data category, data processor agreements required for third-party services (LLM, email, payment), and the right-to-erasure procedure.  
**Blocks:** Collection of any personal data from clients or end users.

---

### IC-27 — Define WebhookSubscription / IntegrationCredential Entities (2.2)

**Action:** Add `WebhookSubscription` (organization_id, event_type, target_url, signing_secret_ref, active, created_at), `WebhookDeliveryAttempt` (subscription_id, event_id, status, response_code, attempted_at), and `IntegrationCredential` (organization_id, provider, credential_ref, created_at) to Document 05. Add to Document 10 ERD.  
**Blocks:** Outbound webhook and integration credential implementation.

---

### IC-28 — Define Secrets Enforcement in Workflow Definitions (9.9)

**Action:** Specify a publish-time validation scan on `WorkflowVersion.definition_json` that rejects definitions containing credential patterns (API keys, passwords, tokens). Define the enforcement mechanism in the Workflow Engine architecture (Document 08). Elevate from convention to enforced control.  
**Blocks:** Workflow publishing implementation.

---

## Architecture Freeze List

The following documents have been reviewed against all accepted findings. A document is listed as frozen when all accepted issues affecting it have been resolved via Immediate Architecture Changes (IC-01 through IC-28) above, or when the document contains no accepted issues pending resolution.

**Status key:** ✅ Frozen · ⏳ Freeze pending IC completion · 🚧 Requires new architecture document

| Document | Title | Freeze Status | Pending Items Before Freeze |
|---|---|---|---|
| 04 | Domain Model Constitution | ⏳ Freeze pending | IC-01 (Project ownership), IC-07 (SubProject hierarchy) |
| 05 | Entity Model | ⏳ Freeze pending | IC-01, IC-02, IC-06, IC-07, IC-08, IC-11, IC-27 |
| 07 | Configuration Engine | ⏳ Freeze pending | IC-03, IC-04, IC-05, IC-14, IC-15 |
| 08 | Workflow Engine | ⏳ Freeze pending | IC-09, IC-19, IC-28 |
| 09 | Industry Pack Architecture | ⏳ Freeze pending | IC-10 (TemplateAdmin permissions defined) |
| 10 | Master ERD | ⏳ Freeze pending | IC-01, IC-02, IC-03, IC-06, IC-07, IC-08, IC-09, IC-27 |
| 11 | System Architecture | ⏳ Freeze pending | IC-12, IC-13, IC-21, IC-22, IC-23, IC-24, IC-25 |
| 12 | API Standards | ⏳ Freeze pending | IC-16, IC-17, IC-18, IC-23 |
| 13 | RBAC Architecture | ⏳ Freeze pending | IC-10, IC-20, IC-23 |
| 14 | Sprint Requirements | ✅ Frozen | No accepted findings directly contra Document 14 content |
| 03 | Data Privacy / GDPR Framework | 🚧 Must be created | IC-26 |

**No document in the current set can be declared frozen until its pending IC items are resolved.** Document 14 (Sprint Requirements) is the only document with no accepted findings requiring change to its content.

---

## Sprint 1 Safe To Start Assessment

### Verdict: NO

Sprint 1 cannot safely start today.

### Reasoning

Sprint 1 is building the foundational platform layer: organization setup, user management, authentication, RBAC, and the core entity framework. Every one of those capabilities depends on decisions that are currently contradicted, undefined, or security-compromised in the architecture documentation.

**Specific blockers for Sprint 1:**

1. **IC-01 (Project ownership)** — The constitutional rule and the ERD directly contradict each other. Any engineer writing a Project creation service today will read conflicting rules from two authoritative documents. The resulting implementation will be wrong in at least one way.

2. **IC-02 (Engagement missing `organization_id`)** — Engagement is a Sprint 1 or Sprint 2 entity. Implementing it without `organization_id` violates the constitutional multi-tenant requirement and will require a breaking migration later.

3. **IC-03 / IC-04 (FieldValue multi-tenant and EAV decision)** — Custom fields are a Configuration Engine capability that Sprint 1 sets up. Implementing FieldValue without `organization_id` is a multi-tenant security incident embedded in the foundation. The EAV vs JSONB decision cascades into every schema, index, and query pattern for the largest table in the system.

4. **IC-05 (FormSubmission orphan)** — Form submission is part of the Configuration Engine introduced early. An orphaned FormSubmission entity makes it impossible to link intake data to the entities it belongs to.

5. **IC-09 (Domain event catalog)** — Sprint 1 will produce domain events. Engineers cannot write event publishers and subscribers reliably when three documents disagree on the event catalog.

6. **IC-10 (Missing RBAC permissions)** — Sprint 1 includes RBAC setup. Permissions for SubProject, Conversation, Form, and Platform Operator are absent. The permission catalog will be incomplete on day one.

7. **IC-13 (Celery worker tenant context)** — Background workers are part of the core infrastructure. Without a formal platform requirement on `organization_id` in task payloads, early worker implementations will not enforce tenant isolation.

8. **IC-16 / IC-17 / IC-18 (Security baseline)** — Password policy, CSRF protection, and XSS sanitization are not features to add later. They are baseline security requirements for any system accepting user credentials and rendering user-submitted content.

9. **IC-21 (RLS role restrictions)** — The database layer cannot be safely implemented without documented rules preventing superuser connections that bypass RLS.

10. **IC-26 (GDPR Framework missing)** — The platform will collect personal data from Sprint 1 onward (user accounts, organization details, client records). Operating without a documented legal basis for data processing creates GDPR exposure from the first user record created.

### Path to YES

Sprint 1 can start when the following IC items are completed:

| Required Before Sprint 1 | IC Item |
|---|---|
| Canonical Project ownership rule established | IC-01 |
| `organization_id` added to Engagement entity | IC-02 |
| `organization_id` and `entity_type` added to FieldValue | IC-03 |
| EAV vs JSONB storage decision recorded as ADR | IC-04 |
| Entity anchor added to FormSubmission | IC-05 |
| Canonical domain event catalog published | IC-09 |
| Missing RBAC permissions added to Document 13 | IC-10 |
| Celery tenant context requirement documented | IC-13 |
| Password policy and account lockout specified | IC-16 |
| CSRF protection strategy specified | IC-17 |
| XSS sanitization and CSP policy specified | IC-18 |
| RLS application role restrictions documented | IC-21 |
| Configuration cache stampede prevention specified | IC-22 |
| JWT max size and lazy permissions defined | IC-23 |
| Data Privacy / GDPR Framework document created | IC-26 |

The remaining IC items (IC-06, IC-07, IC-08, IC-11, IC-12, IC-14, IC-15, IC-19, IC-20, IC-24, IC-25, IC-27, IC-28) should be resolved by the end of Sprint 1 or at the start of the sprint that first implements the dependent feature, but they do not block Sprint 1 from beginning.

**Estimated resolution effort for the 15 Sprint-1 blockers above:** These are documentation decisions and entity amendments, not code. With focused architecture sessions, all 15 items can be resolved within one pre-sprint architecture sprint before Sprint 1 coding begins.

---

*This remediation plan is based exclusively on the findings in docs/99_ARCHITECTURE_GAP_ANALYSIS.md as of the review date. All decisions are subject to review by the architecture board. Accepted items must be tracked to completion before the dependent implementation phase begins. Rejected and deferred items should be reviewed at the start of each phase to confirm they remain appropriately classified.*
