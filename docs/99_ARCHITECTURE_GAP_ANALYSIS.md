# CBOS Architecture Gap Analysis

## Version 1.0

**Reviewer Role:** Chief Architect  
**Review Scope:** All documents in /docs (04 through 14)  
**Scale Assumption:** 1,000 organizations · 100,000 projects · 10,000,000 assets  
**Severity Tags:** 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low

---

## Executive Summary

The CBOS documentation set is architecturally ambitious and internally coherent at a high level. The domain model, entity model, RBAC architecture, workflow engine, configuration engine, industry pack design, and system architecture each describe well-structured individual concerns. However, deep cross-document review exposes a significant number of contradictions, undefined entities, missing relationships, underdocumented domains, and scaling strategies that are conceptually described but structurally absent.

At the stated scale (1,000 orgs · 100,000 projects · 10,000,000 assets), **nine categories of gap** are serious enough to prevent safe production deployment without resolution. The most critical risks are:

1. Direct contradictions between the Domain Model Constitution and the Master ERD on project ownership
2. Missing `organization_id` on the `FieldValue` entity — a multi-tenant data leak risk
3. The EAV (Entity-Attribute-Value) custom field storage pattern at 10M assets
4. Redis serving six concurrent roles with no partitioning or isolation strategy
5. Analytics domain being entirely underdocumented with no OLAP or aggregation strategy
6. A referenced `TemplateAdmin` permission that does not exist in the RBAC catalog
7. Missing entities for notifications, webhooks, refunds, milestones, feature flags, and document generation
8. No concrete search infrastructure design capable of serving 10M cross-entity records

Each finding below is cited to specific documents.

---

## 1. Contradictions

### 1.1 Domain Model vs Master ERD: Project Ownership Rule

🔴 **Critical**

**Document 04** (Domain Model Constitution) states:

> "Every Project belongs to one Engagement. Every Engagement belongs to one Client."

**Document 10** (Master ERD) states as a Frozen Architectural Decision:

> "Projects may exist with or without Clients. `client_id` optional. `engagement_id` optional."

These are irreconcilable. Document 04 is declared the constitutional foundation that "every database table, API, UI screen, workflow, AI agent, mobile feature, and integration must comply with." Document 10 directly contradicts it as a frozen decision.

**Impact:** Every service that creates or validates a Project will implement different rules depending on which document the engineer reads. At 100,000 projects, this inconsistency will surface as data integrity violations and client-engagement reporting gaps.

**Resolution needed:** The Domain Model Constitution must be updated to match the ERD's optional client/engagement linkage, or the ERD must be corrected to make them mandatory. One document must yield.

---

### 1.2 Engagement Entity Missing `organization_id`

🔴 **Critical**

**Document 04** declares: "Every entity must contain `organization_id`." and "All queries must be organization scoped."

**Document 10** declares: "Every persisted entity carries `organization_id`."

**Document 05** (Entity Model) defines Engagement with these attributes:

```
id
client_id
title
status
start_date
end_date
```

`organization_id` is absent. Since Engagement is derivable via `client_id → Client.organization_id`, some engineers will conclude it is not needed. Others will add it. Neither position matches the constitutional rule.

**Impact:** Without `organization_id` on Engagement, cross-tenant leakage is possible through any query that joins or filters by Engagement without propagating the tenant filter. RLS policies will not cover Engagement rows correctly.

---

### 1.3 SubProject Hierarchy Contradiction

🟠 **High**

**Document 04** places Conversation, Invoice, Payment, Asset, Workflow, Task, Shoot, Gallery, and Deliverable as children of Sub Project in the entity hierarchy:

```
Sub Project
 ├── Task
 ├── Shoot
 ├── Gallery
 ├── Deliverable
 ├── Invoice
 ├── Payment
 ├── Asset
 ├── Workflow
 └── Communication
```

**Document 05** (Entity Model) defines SubProject as:

```
id
parent_project_id
name
status
```

No children.

**Document 10** (Master ERD) only shows `PROJECT ||--o{ SUB_PROJECT`. No children hang off SubProject.

**Impact:** Engineers building SubProject features have no consistent model. If SubProjects are to be operational containers, all child entities need `sub_project_id` foreign keys and corresponding RBAC scopes. If they are not, Document 04 must be corrected. At 100,000 projects with multiple sub-projects each, this ambiguity compounds across every domain.

---

### 1.4 Quote Entity Relationship Inconsistency

🟠 **High**

**Document 05** defines Quote with `client_id` and `project_id` attributes.

**Document 10** (Master ERD) declares two separate relationships:
- `LEAD ||--o{ QUOTE : requests`
- `CLIENT ||--o{ QUOTE : billed_to`

Quote has no `lead_id` in Document 05 but the ERD shows it as a Lead child. The Quote entity cannot simultaneously be owned by Lead in the ERD and by Client+Project in the entity model.

**Impact:** Finance reporting and CRM pipeline reporting cannot be consistently built.

---

### 1.5 Gallery/Selection Entity Naming Inconsistency

🟡 **Medium**

**Document 05** defines `GalleryImage` with `gallery_id, asset_id, favorite_count` and a separate `Selection` entity with `gallery_id, selected_by, selected_at`.

**Document 10** (Master ERD) uses `GALLERY_ASSET` as the bridge entity, with no `favorite_count` and no `Selection` entity.

The two documents define incompatible join entities for Gallery ↔ Asset.

---

### 1.6 Subscription as Aggregate Root vs BillingAccount Child

🟡 **Medium**

**Document 04** lists `Subscription` as a top-level Aggregate Root alongside Organization, Client, Project.

**Document 10** (Master ERD) shows `BillingAccount ||--|| Subscription` — Subscription is owned by BillingAccount, which is owned by Organization.

**Document 05** defines Subscription under its own "Subscription Domain" with no BillingAccount entity at all.

**Impact:** BillingAccount is missing from the Entity Model entirely. Engineers implementing billing will reference incompatible ownership chains.

---

### 1.7 Domain Event Catalog Inconsistency Across Documents

🟡 **Medium**

**Document 04** (Domain Model Constitution) defines a small event catalog:

> CRM: LeadCreated, LeadAssigned, LeadConverted, QuoteCreated, QuoteAccepted

**Document 10** (Master ERD) defines a significantly expanded catalog with 60+ events including `LeadQualified, LeadLost, QuoteSent, QuoteRejected, ExpenseApproved, etc.`

**Document 11** (System Architecture) repeats the smaller catalog from Document 04.

The three documents cannot all be correct. Event subscribers and workflow triggers built from one catalog will not receive events fired from another.

---

### 1.8 Conversation Ownership

🟡 **Medium**

**Document 04** places Conversation as a child of Sub Project in the entity hierarchy.

**Document 10** (Master ERD) shows Conversation owned by Project and Client simultaneously (`PROJECT ||--o{ CONVERSATION` and `CLIENT ||--o{ CONVERSATION`).

No SubProject → Conversation relationship appears in the ERD or Entity Model.

---

## 2. Missing Entities

### 2.1 Notification / NotificationTemplate / NotificationDelivery

🔴 **Critical**

Workflows send emails, SMS, and in-app notifications. **Document 09** (Industry Pack Architecture) states:

> "Templates define notification templates (email, SMS, in-app) triggered by workflow actions."

No `Notification`, `NotificationTemplate`, `NotificationLog`, or `NotificationDelivery` entity exists in **Document 05**, **Document 07**, or **Document 10**. There is no entity storing notification content, delivery status, bounce records, opt-out state, or retry history.

**Impact:** Without a NotificationTemplate entity, every notification is hardcoded. Without NotificationDelivery, there is no audit trail for customer communications — a compliance risk at scale.

---

### 2.2 WebhookSubscription / IntegrationCredential

🔴 **Critical**

**Document 12** (API Standards) defines comprehensive inbound and outbound webhook standards. Outbound webhooks are "emitted from stable domain events." Subscriptions are "organization-scoped." Secrets "must be encrypted at rest."

No `WebhookSubscription`, `WebhookDeliveryAttempt`, or `IntegrationCredential` entity exists anywhere.

**Impact:** There is no persistent store for who subscribed to what events, the target URL, the signing secret, or the delivery history. The webhook infrastructure described in Document 12 cannot be built without these entities.

---

### 2.3 DocumentTemplate / GeneratedDocument

🟠 **High**

**Document 09** states:

> "Templates define document templates (contracts, proposals, delivery confirmations) using template metadata. Documents are generated through CBOS Core's document generation capabilities and are stored as Assets linked to Projects."

No `DocumentTemplate` or `GeneratedDocument` entity exists. No document generation domain or service is described. The reference to "CBOS Core's document generation capabilities" points to a capability that is architecturally undefined.

---

### 2.4 Refund

🟠 **High**

**Document 10** (Master ERD) lists `PaymentRefundRequested` as a domain event. **Document 13** (RBAC) defines an approval chain for "Refund Approval" with `Payment` as the resource type.

No `Refund` entity exists in the Finance domain in any document. Refund lifecycle states, relationship to Payment, and audit requirements are undefined.

---

### 2.5 ProjectMilestone

🟠 **High**

**Document 08** (Workflow Engine) includes "set milestone date" as a Project Update action. Milestones are referenced as first-class operational targets.

No `Milestone` or `ProjectMilestone` entity exists. Milestone dates cannot be stored, queried, or reported against.

---

### 2.6 FeatureFlag / PlanFeature

🟠 **High**

**Document 11** (System Architecture) states:

> "Feature availability is controlled by the organization's subscription plan. The configuration metadata includes `min_plan` attributes that gate access to advanced capabilities."

No `FeatureFlag`, `PlanFeature`, or `SubscriptionFeature` entity exists. The `ProjectType` entity in Document 07 has no `min_plan` field. There is no mechanism for enforcing feature gates at scale.

---

### 2.7 Tag / TagDefinition / EntityTag

🟡 **Medium**

**Document 08** includes "attach tag" as a workflow action on projects. Tags are a common operational concept used for filtering and reporting.

No `Tag`, `TagDefinition`, or `EntityTag` entity exists. Tags cannot be managed, searched, or reported against.

---

### 2.8 Location

🟡 **Medium**

**Document 04** includes `LocationAssigned` as a domain event in the Operations context. **Document 05** represents `location` as a plain `text` field on Shoot.

At 100,000 projects each with multiple shoots, locations should be a managed entity supporting geocoding, map visualization, and location-based resource assignment. A text field cannot support these use cases.

---

### 2.9 BillingAccount (Missing from Entity Model)

🟡 **Medium**

`BillingAccount` appears in Document 10 (Master ERD) as owned by Organization and as the parent of Subscription and BillingInvoice. It does not appear in **Document 05** (Entity Model). Engineers implementing billing will find no entity definition.

---

### 2.10 ReportDefinition / DashboardConfiguration

🟡 **Medium**

**Document 09** states that template installation produces `ReportDefinition` and `DashboardConfiguration` records:

> "TemplateReport → produces → ReportDefinition"
> "TemplateDashboard → produces → DashboardConfiguration"

Neither entity is defined in Document 05, Document 07, or Document 10. These entities have no schema, no relationships, and no API endpoints defined anywhere.

---

### 2.11 TemplateMigration

🔵 **Low**

**Document 09** (Section 6.4) references `TemplateMigration` as the record defining transformation rules for major version migrations. No entity schema is defined for it.

---

### 2.12 StorageQuota / UsageTracking

🟠 **High**

At 10,000,000 assets, storage consumption is a primary cost driver and subscription enforcement mechanism. No `StorageQuota`, `UsageRecord`, or `ResourceConsumption` entity exists. There is no mechanism to:

- Track storage consumption per organization
- Enforce storage limits by subscription tier
- Bill on storage overages
- Alert organizations nearing their quota

---

## 3. Missing Relationships

### 3.1 FieldValue Has No `organization_id` or `entity_type`

🔴 **Critical**

**Document 07** defines FieldValue as:

```
id
field_definition_id
entity_id
value
```

`entity_id` is a bare UUID with no `entity_type` discriminator and no `organization_id`. This is the most dangerous gap in the entire model.

**Problems:**
- A UUID collision between a Project in Org A and a Client in Org B would produce incorrect FieldValue reads
- A query filtering by `field_definition_id` without `organization_id` would return values across all tenants who share that field definition (not possible today, but possible if field definitions were ever shared)
- RLS cannot enforce tenant isolation on FieldValue without `organization_id`

**Impact at scale:** At 10M assets and 100K projects each with custom fields, the FieldValue table is one of the largest in the system. A missing org filter is a multi-tenant security incident waiting to happen.

---

### 3.2 FormSubmission Has No Entity Reference

🔴 **Critical**

**Document 07** defines FormSubmission as:

```
id
form_id
submitted_by
submitted_at
```

There is no reference to which entity the form was submitted against (no `project_id`, `lead_id`, `client_id`, or `entity_type`/`entity_id` pair). A form submission without a subject is an orphaned record.

**Impact:** Forms defined for Lead intake, Client onboarding, and Shoot planning cannot be linked back to the entity they belong to.

---

### 3.3 Opportunity → Client / Project (Post-Conversion)

🟠 **High**

**Document 05** defines Opportunity with `lead_id, estimated_value, probability, expected_close_date`. When a Lead converts (`LeadConverted` event), a Client and Project are created. But there is no relationship between Opportunity and the resulting Client or Project. CRM pipeline-to-revenue attribution is structurally impossible.

---

### 3.4 SubProject → Task (Not Modeled)

🟠 **High**

**Document 04** implies Tasks belong under SubProject. **Documents 05 and 10** only show `PROJECT ||--o{ TASK`. If SubProjects are to be operational containers, the Task entity needs a nullable `sub_project_id` foreign key and the RBAC model needs SubProject scope resolution.

---

### 3.5 Conversation Participants

🟡 **Medium**

**Document 05** defines Conversation with `project_id, client_id, channel`. No participant list, user assignment, or team assignment exists. Internal team conversations cannot distinguish between participants. At scale, a Conversation attached to a large project would be visible to all project members with no granularity.

---

### 3.6 WorkflowExecution → Engagement / Client (Non-Project Workflows)

🟡 **Medium**

**Document 08** states WorkflowExecution has a `project_id` field that is "required whenever the workflow affects operational delivery work." For workflows scoped at Organization or Client level (e.g., client onboarding, lead nurturing), there is no `client_id` or `engagement_id` on WorkflowExecution. Non-project workflows have no entity anchor.

---

### 3.7 Campaign → Lead Conversion Attribution

🟡 **Medium**

**Document 05** defines `CampaignLead` as `campaign_id, lead_id`. But when a Lead converts to a Client and then to a Project, the Campaign attribution chain is broken. There is no `campaign_id` on Client, Engagement, or Project to track revenue attribution back to the originating campaign.

---

## 4. Missing Workflows

### 4.1 Client Onboarding

🟠 **High**

No system-level workflow for onboarding a new client is defined. This would typically include: client intake form submission, contact verification, welcome communication, contract generation, and initial engagement creation. All four industry templates (Photography, Agency, Podcast, Production) require this workflow.

---

### 4.2 Subscription Lifecycle (Trial, Renewal, Failure, Churn)

🔴 **Critical**

The platform hosts 1,000 organizations on paid subscriptions. No workflow handles:

- Trial expiry and conversion prompts
- Payment failure and grace period
- Subscription renewal and renewal reminders
- Churn (cancellation) and data export trigger
- Plan upgrade/downgrade feature gate changes

Without these workflows, subscription lifecycle is entirely manual or requires custom code.

---

### 4.3 User Invitation and Onboarding

🟠 **High**

User.Invite permission exists in RBAC. But no workflow defines the invitation email, expiry handling, first-login onboarding, or default role assignment flow.

---

### 4.4 Organization Offboarding / Tenant Purge

🟠 **High**

No workflow or process is defined for tenant offboarding. At 1,000 organizations, some will churn. The platform needs a governed process for: data export, GDPR deletion requests, billing finalization, and eventual purge. Without this, offboarded tenants accumulate indefinitely.

---

### 4.5 Asset Retention and Purge

🟠 **High**

**Document 10** defines a retention strategy for assets ("Retain by organization policy and project retention rules") but no automated workflow enforces these rules. At 10M assets, unmanaged retention leads to unbounded storage cost.

---

### 4.6 SLA Breach Escalation

🟡 **Medium**

**Document 08** lists "SLA monitoring" and "predictive escalation" as future capabilities. But at 100,000 projects, SLA breach escalation is an operational requirement, not a future feature. No escalation workflow is defined.

---

### 4.7 Financial Reconciliation

🟡 **Medium**

No workflow handles periodic financial reconciliation — matching payments to invoices, identifying overdue invoices, generating statements. `PaymentAllocation` records reconciliation events, but no automated reconciliation workflow exists.

---

## 5. Missing RBAC Permissions

### 5.1 `TemplateAdmin` Permission (Referenced But Undefined)

🔴 **Critical**

**Document 09** (Industry Pack Architecture, Section 10.2) states:

> "Only users with the `TemplateAdmin` permission may install or uninstall templates within an organization."

No `TemplateAdmin` permission exists in the complete permission catalog in **Document 13**. Business Template management is entirely absent from the RBAC architecture. There is no `BusinessTemplate.Install`, `BusinessTemplate.Uninstall`, `BusinessTemplate.Upgrade`, or `BusinessTemplate.View` permission defined anywhere.

---

### 5.2 SubProject Permissions

🟠 **High**

SubProject is a defined entity in Documents 05 and 10 with its own lifecycle. No `SubProject.View`, `SubProject.Create`, `SubProject.Edit`, or `SubProject.Delete` permissions exist in the RBAC catalog.

---

### 5.3 Conversation and Message Permissions

🟠 **High**

The Communications domain is a defined bounded context. Conversations and Messages are defined entities. No `Conversation.View`, `Conversation.Create`, `Message.Send`, `Message.Delete`, or `Message.View` permissions exist in the RBAC catalog.

---

### 5.4 Form and FormSubmission Permissions

🟠 **High**

Forms are a Configuration Engine capability used across all industries. No `Form.View`, `Form.Submit`, `Form.ViewSubmissions`, or `Form.ManageDefinitions` permissions exist. Configuration permissions only cover `Configuration.ManageFormDefinitions`, not submission access.

---

### 5.5 Refund Permission

🟠 **High**

`Invoice.Void` and `Invoice.Pay` exist. An approval chain for "Refund Approval" references `Payment` as a resource. But no `Payment.Refund`, `Invoice.Refund`, or equivalent permission exists in the catalog.

---

### 5.6 Platform Operator Permissions

🟠 **High**

The platform has a Platform Operator actor referenced in **Document 09** (template publishing, deprecation, archival) and elsewhere. No platform-level permissions (`Platform.ManageTemplates`, `Platform.SuspendOrganization`, `Platform.ViewAllAuditLogs`) are defined. Platform operators have no RBAC model.

---

### 5.7 Engagement.Delete

🟡 **Medium**

RBAC defines `Engagement.View`, `Engagement.Create`, `Engagement.Edit`, and `Engagement.Close`. There is no `Engagement.Delete`. Soft delete (and GDPR compliance) requires a delete permission.

---

### 5.8 Webhook / Integration Permissions

🟡 **Medium**

`Organization.ManageIntegrations` is a single broad permission. At scale, organizations will need granular control over who can create/edit/delete webhook subscriptions, view delivery logs, and rotate integration credentials. No webhook-specific permissions are defined.

---

### 5.9 AI Permission Gaps

🟡 **Medium**

`AI.UseAssistant`, `AI.ViewRecommendations`, and `AI.ManageAgents` are defined. But there is no `AI.ViewActionLog` or `AI.ReviewRejectedRecommendations` permission for compliance teams who need to audit what the AI suggested and what was accepted. This is a governance gap.

---

## 6. Missing Configuration Support

### 6.1 Notification Template Configuration

🔴 **Critical**

Workflows send email and SMS through the Communications domain. **Document 09** requires notification templates per industry. The Configuration Engine (**Document 07**) has no `NotificationTemplate` entity, no content field definition, no channel binding, and no locale support. Every organization's notifications are implicitly hardcoded.

---

### 6.2 Field-Level PII Classification

🟠 **High**

**Document 09** states that custom fields collecting PII "must be flagged with `is_pii: true` in the field definition." But `FieldDefinition` in **Document 07** has no `is_pii` attribute. The `is_pii` field exists only on `TemplateField` within the template model, not on the canonical FieldDefinition entity that all runtime data references.

---

### 6.3 Custom Validation Rules Schema

🟠 **High**

`FieldDefinition` has a `validation_rules` attribute. The format, schema, or supported rule types are never defined in any document. Engineers building form validation will implement incompatible validation rule structures.

---

### 6.4 Tax Rate Configuration

🟠 **High**

**Document 05** defines Invoice with a `gst_amount` field — hardcoded to a single tax type (GST). No `TaxRate`, `TaxConfiguration`, or `TaxRule` entity exists. Organizations operating in multiple jurisdictions with different tax schemes (VAT, GST, HST, sales tax) cannot be supported without custom code.

At 1,000 organizations across potentially multiple countries, hardcoding GST is a critical functional limitation.

---

### 6.5 Conditional Field Visibility in Forms

🟡 **Medium**

Forms are metadata-driven through `FormDefinition` and `FormField`. But there is no conditional display logic — no "show field X only if field Y equals Z." Modern intake forms (client questionnaires, shoot planning) require conditional logic. Without it, organizations will resort to multiple redundant forms.

---

### 6.6 Locale / Language Configuration

🟡 **Medium**

Organization has `timezone` and `currency`. There is no `locale` or `language` attribute. Multi-language support (documents, notifications, UI labels) has no configuration surface. For a platform targeting international creative businesses, this is a gap.

---

### 6.7 Feature Flag Configuration Surface

🟡 **Medium**

**Document 11** references `organization feature flag` as a workflow condition and describes subscription-gated features. No `FeatureFlag` configuration entity, no admin interface, and no API endpoint for feature flag management exists anywhere. Feature gates are described conceptually but architecturally invisible.

---

## 7. Multi-Tenant Risks

### 7.1 FieldValue Has No Tenant Isolation

🔴 **Critical**

This is also documented under Missing Relationships (3.1) but warrants separate emphasis as a multi-tenant risk.

`FieldValue` (entity_id, field_definition_id, value) has no `organization_id`. At 10M assets with custom fields, this table will be one of the largest in the system. Any query on this table that fails to join through the organization chain is a cross-tenant data leak.

**RLS cannot protect this table** without `organization_id` present on the row itself. PostgreSQL RLS operates on current row values. A row without `organization_id` cannot be filtered by an RLS policy.

---

### 7.2 Redis Shared Channel Risk

🟠 **High**

**Document 11** uses Redis Pub/Sub for domain event delivery. With 1,000 organizations generating events simultaneously, if channels are not namespaced by `organization_id`, every worker receives every tenant's events and must filter in application code. A filtering bug = cross-tenant event processing.

The document states workers "filter by tenant" but the filtering mechanism and its enforcement are not defined. No mention of Redis channel naming conventions or per-organization channel isolation.

---

### 7.3 Analytics Materialized Views Without Explicit Org Scoping

🟠 **High**

Analytics is one of the most underdocumented domains. `AnalyticsSnapshot` and `AnalyticsMetric` entities are mentioned but not defined. Materialized views and aggregations over shared tables without explicit per-row `organization_id` filters create cross-tenant reporting risk at scale.

There is no analytics query isolation model, no description of how snapshots are calculated, and no mention of whether analytics uses a separate schema or read replica.

---

### 7.4 AI Context Assembly Boundary

🟠 **High**

**Document 11** states:

> "Context is assembled from pre-fetched, permission-filtered data snapshots."

There is no formal contract defining:
- The maximum scope of context assembled per AI session
- Whether context assembly can accidentally join across organizations
- How PII masking is enforced before submission to external LLM providers
- What happens if the LLM caches context between sessions

The condition "unless the organization has configured explicit AI-PII consent" implies PII can flow to third-party LLM providers with consent. No data processing agreement framework is described.

---

### 7.5 Background Worker Organization Context

🟠 **High**

Celery workers process tasks asynchronously. If a task payload does not explicitly carry `organization_id`, or if the worker handler does not enforce tenant scoping before every database operation, cross-tenant mutations are possible. No formal requirement for `organization_id` in Celery task payloads is documented. No testing strategy for tenant isolation in workers is defined.

---

### 7.6 Pre-Signed URL Organization Validation

🟡 **Medium**

**Document 11** describes pre-signed URLs prefixed by `{organization_id}/`. But if the URL generation service has a bug and generates a URL with the wrong `organization_id` prefix, the object storage layer (S3-compatible) will serve the request without organization validation. No server-side validation that the `organization_id` in the URL path matches the authenticated user's organization is described.

---

### 7.7 RLS Superuser Bypass Risk

🟡 **Medium**

**Document 11** states a "least-privilege application role" is used. But if any service connects using a superuser or a role with `BYPASSRLS`, all tenant isolation at the database layer is void. No documentation describes how RLS enforcement is validated, how bypass is detected, or how application role credentials are rotated.

---

### 7.8 Search Index Organization Isolation

🟡 **Medium**

**Document 11** mentions "Dedicated search index for full-text and semantic search" in the scalability strategy. No search infrastructure is specified. If full-text search indexes are not organization-partitioned, a search query could return results from other tenants depending on the search implementation.

---

## 8. Scalability Risks

### 8.1 EAV Pattern for Custom Fields at 10M Assets

🔴 **Critical**

The `FieldValue` entity implements the Entity-Attribute-Value (EAV) pattern: one row per custom field per entity instance. At the stated scale:

- 10,000,000 assets × average 10 custom fields = **100,000,000 FieldValue rows**
- 100,000 projects × average 20 custom fields = **2,000,000 FieldValue rows**
- Total FieldValue rows: easily **100M+**

EAV is known to perform poorly at this scale for queries that need to reconstruct full entity records (requiring 10–20 row reads per entity), for filtering and sorting on custom field values (requiring subquery pivots), and for schema-level constraints.

No JSONB column alternative, document store, or hybrid strategy is mentioned. This pattern alone could prevent the platform from reaching the stated scale.

---

### 8.2 Redis as a Single Multi-Role Infrastructure Component

🔴 **Critical**

**Document 11** and **Document 14** assign Redis the following roles simultaneously:

- Domain event pub/sub
- Celery task queue
- JWT refresh token store
- Organization configuration cache
- Workflow version snapshot cache
- Permission set cache
- Idempotency key store
- Rate limiting counters

At 1,000 organizations with concurrent users, this is a single point of contention. No Redis Cluster mode, read replica strategy, or role partitioning is described. A Redis failure degrades all seven capabilities simultaneously. The document acknowledges "API continues with degraded caching; session re-authentication required" on Redis failure, but degraded caching also means degraded rate limiting, queue failure, and event loss.

---

### 8.3 Single PostgreSQL Cluster for All Tenants

🟠 **High**

All 1,000 organizations share a single PostgreSQL cluster (with read replicas for analytics). No sharding, horizontal partitioning by organization, or database-per-tenant tier is described.

At the stated scale:

- Assets table: 10M rows × ~500 bytes = ~5GB
- FieldValue table: 100M+ rows
- WorkflowExecutionEvent: append-only, potentially billions of rows over time
- DomainEvent: append-only, potentially billions of rows over time
- AuditEvent: append-only, millions of rows per month

A single PostgreSQL primary, even with read replicas and RLS, cannot sustain this volume indefinitely without sharding or archival pipelines. The partitioning strategy described (partition by `organization_id` and time period) is mentioned but never formally defined with partition schemes, maintenance windows, or hot/warm/cold tiering.

---

### 8.4 Workflow Execution Table Growth

🟠 **High**

At 100,000 projects each triggering multiple automated workflows:

- WorkflowExecution: potentially millions of rows
- WorkflowExecutionStep: 5–20 rows per execution = tens of millions of rows
- WorkflowExecutionEvent: immutable audit trail = hundreds of millions of rows

The archival strategy says "archive historical execution data without losing auditability." No archival pipeline, timeline, or archive schema is defined. Without automated archival, these tables will degrade query performance and backup times.

---

### 8.5 Configuration Cache Thundering Herd

🟠 **High**

**Document 11** caches organization configuration packages in Redis with a **5-minute TTL**. At 1,000 organizations, if the TTL is set uniformly (e.g., all initialized on platform restart), all 1,000 caches expire within the same 5-minute window. Every request to a cache-missed organization triggers a PostgreSQL read. A thundering herd of 1,000 simultaneous configuration loads could saturate the database connection pool.

No cache stampede prevention (jittered TTL, lock-based refresh) is described.

---

### 8.6 No OLAP / Analytics Data Warehouse

🟠 **High**

Analytics snapshots are calculated from DomainEvent records stored in PostgreSQL. At 10M assets and 100K projects, an operational OLTP database cannot serve analytical aggregations without dedicated infrastructure. No data warehouse, OLAP store, or time-series database is mentioned.

The `analytics_worker.py` in Document 11 is listed as a background worker, but aggregating analytics on the primary PostgreSQL transactional store is a well-known anti-pattern at this scale.

---

### 8.7 Media Processing at 10M Assets

🟠 **High**

Every uploaded asset triggers:
- Thumbnail and preview generation
- EXIF/metadata extraction
- Virus scanning
- Optional AI-based tagging and content analysis

At 10M assets with ongoing uploads, the media processing queue is a sustained high-volume workload. No priority tiers (urgent vs background), no GPU resource specification, no processing SLA, and no queue depth SLA is defined. The `notification_worker.py`, `workflow_worker.py`, and `analytics_worker.py` share the same worker pool described in Document 11 with no resource isolation.

---

### 8.8 Full-Text Search Degradation

🟠 **High**

**Document 12** describes full-text search using "PostgreSQL full-text search, trigram indexes, or purpose-built indexed search patterns." At 10M assets and millions of combined project/client/lead records, PostgreSQL full-text search degrades significantly. No dedicated search service (Elasticsearch, OpenSearch, Typesense, Meilisearch) is specified or planned.

---

### 8.9 Gallery Expiry Scan

🟡 **Medium**

Galleries have an `expiry_date`. A scheduled job must scan all galleries for expiry. At 100,000 projects with multiple galleries each, a table scan of potentially millions of gallery rows on a regular schedule (daily? hourly?) creates periodic database load spikes. No efficient expiry pattern (e.g., time-partitioned index, expiry queue) is described.

---

### 8.10 JWT Token Size at Scale

🟡 **Medium**

**Document 12** embeds `roles` and `permissions` in JWT token claims. Permission sets are organization-configurable and unbounded in size. A user with multiple custom roles and permission sets could generate JWT tokens exceeding standard HTTP header size limits, causing intermittent request failures. No maximum token size or lazy permission resolution strategy is defined.

---

## 9. Security Risks

### 9.1 Sensitive Action Enforcement Only in Workflow Engine

🔴 **Critical**

**Document 08** (Workflow Engine) states that finance mutations and approvals "require additional protection" including "approval gates" and "role-based permissions." **Document 11** states "Finance mutations require human confirmation regardless of AI confidence."

However, the Finance API endpoints (`POST /api/v1/invoices`, payment recording, refunds) are directly accessible without being routed through the Workflow Engine. If an authorized API caller bypasses workflow-driven approval by calling the Finance API directly, the approval gate is circumvented.

There is no description of service-layer enforcement of approval requirements independent of the Workflow Engine. Approval enforcement only at the workflow layer is a defense-in-depth failure.

---

### 9.2 Pre-Signed URL Expiry Control

🟠 **High**

**Document 11** states gallery sharing uses "time-limited, token-protected pre-signed URLs with configurable expiry matching the gallery expiry date." Gallery expiry dates are configurable by organizations.

If an organization sets a gallery expiry date years in the future, the pre-signed URL will be valid for years — effectively a permanent public URL. No minimum/maximum expiry window enforcement is described. No mechanism to invalidate pre-signed URLs before their expiry (e.g., on gallery deletion or client access revocation) is defined.

---

### 9.3 AI PII Policy Definition Missing

🟠 **High**

**Document 11** states:

> "Personally identifiable information (PII) is masked before being included in AI context payloads unless the organization has configured explicit AI-PII consent."

No definition of "AI-PII consent" exists — no configuration entity, no consent flow, no audit trail of consent changes. At 1,000 organizations potentially processing client data, this is a GDPR Article 28 data processor requirement gap.

---

### 9.4 Delegation Revocation on Permission Loss

🟠 **High**

**Document 13** states: "A user may only delegate permissions they themselves currently hold." But there is no rule for what happens when a delegator's permissions are revoked after a delegation is created. If the delegator loses the permission, does the delegation automatically expire? There is no stated mechanism for cascading revocation.

---

### 9.5 Audit Log Tamper Evidence

🟠 **High**

Audit records are "immutable" and "append-only." But immutability is enforced only at the application layer. A compromised database administrator can modify PostgreSQL rows regardless of application-layer protections. No cryptographic tamper-evidence mechanism (hash chains, write-once storage, external audit sink) is described.

---

### 9.6 Password Policy and Account Lockout

🟡 **Medium**

**Document 11** describes JWT authentication and MFA for organization administrators. No password complexity policy, minimum length, breach detection (HaveIBeenPwned), account lockout after failed attempts, or temporary suspension policy is defined. For a SaaS platform serving business-critical financial and client data, these are standard security requirements.

---

### 9.7 CSRF Protection

🟡 **Medium**

No Cross-Site Request Forgery (CSRF) protection is mentioned anywhere in the API standards, security architecture, or sprint requirements. JWT in Authorization headers provides CSRF protection for API-only clients, but any cookie-based session fallback or browser-native authentication flow requires explicit CSRF mitigation.

---

### 9.8 Content Sanitization for Stored Custom Field Values

🟡 **Medium**

Custom fields accept `text`, `textarea`, and `json` values from form submissions. No output encoding or input sanitization requirement is defined. If stored text field values containing `<script>` tags are rendered in the React frontend without escaping, cross-site scripting (XSS) is possible. No Content Security Policy (CSP) is defined for the frontend.

---

### 9.9 Secrets in Workflow `definition_json`

🟡 **Medium**

**Document 08** states: "secrets for outbound integrations must not be stored in workflow definitions in plain text." `WorkflowVersion.definition_json` is a JSON blob. No enforcement mechanism prevents engineers from storing credentials inline. No validation or scan at publish time is described. This is a convention, not an enforced control.

---

## 10. Documentation Gaps

### 10.1 Analytics Domain Has No Architecture Document

🔴 **Critical**

Analytics is a defined bounded context (Documents 04, 11). `AnalyticsMetric` and `AnalyticsSnapshot` appear in the ERD. An `analytics_worker.py` is referenced. But:

- There is no dedicated Analytics Architecture document
- No entity schemas for Analytics domain entities are defined in Document 05
- No analytics query model, aggregation pipeline, or dashboard specification exists
- No OLAP strategy or reporting data model is defined

At 10M assets with 1,000 organizations each expecting performance dashboards and reports, the Analytics domain is architecturally invisible.

---

### 10.2 Communications and Marketing Domains Have No Architecture Documents

🟠 **High**

Both Communications and Marketing are defined bounded contexts. They have entities (Conversation, Message, Campaign, CampaignLead) but:

- No dedicated architecture document exists
- Email/SMS delivery mechanism is referenced but no provider integration spec exists
- No bounce handling, unsubscribe, or opt-out mechanism is described
- SPF/DKIM requirements for transactional email are not mentioned
- Campaign execution model is undefined (bulk send? drip sequences? A/B testing?)

---

### 10.3 AI Domain Has No Architecture Document

🟠 **High**

AI is a defined bounded context with entities in the ERD. A Copilot panel is described in Document 11. But:

- No dedicated AI Architecture document exists
- No LLM provider integration is specified
- No model selection, fallback, or cost control strategy is defined
- No AI governance policy exists (fairness, explainability, model drift)
- No latency SLA for AI streaming responses is defined

---

### 10.4 Missing Documents 01, 02, 03, and 06

🟠 **High**

The document numbering scheme implies documents 01, 02, 03, and 06 exist but are absent from the repository. These likely represent:

- 01: Project Charter or Product Vision
- 02: Technical Specification
- 03: Data Privacy Policy / GDPR Framework
- 06: Unknown (gap between Document 05 and Document 07)

The absence of a GDPR/privacy document is a significant gap for a platform processing client PII.

---

### 10.5 No SLA / SLO Document

🟠 **High**

**Document 11** references "SLO breaches" in the monitoring section and lists Prometheus Alertmanager for "SLO breaches" — but no SLOs are defined anywhere. No API response time targets, availability commitments, workflow execution latency targets, or media processing SLAs exist.

---

### 10.6 No Integration Catalog

🟡 **Medium**

External integrations referenced across documents include: email provider, SMS provider, external AI/LLM provider, payment processor, object storage provider, and CDN. None of these are formally cataloged with supported providers, integration contracts, or fallback strategies.

---

### 10.7 No Multi-Currency / Multi-Jurisdiction Documentation

🟡 **Medium**

Organizations have `currency` but the platform contains a hardcoded `gst_amount` field on invoices. No documentation exists for:

- Exchange rate management
- Multi-currency invoicing
- Jurisdiction-specific tax calculation
- Regional compliance requirements (GDPR, CCPA, etc.)

---

### 10.8 No Mobile / PWA Architecture

🟡 **Medium**

The primary user base (photographers, videographers, studio managers) relies heavily on mobile access for shoot day operations. No mobile app, PWA, or responsive architecture is documented. At 10M assets, mobile upload and gallery access are primary use cases with no architectural treatment.

---

### 10.9 No Data Import / Migration Strategy

🟡 **Medium**

Organizations migrating from existing tools (HoneyBook, Dubsado, Monday.com, Asana) need data import capabilities. No bulk import, CSV/Excel import, or API-based migration tooling is documented. Without this, customer acquisition is limited to greenfield organizations.

---

### 10.10 No Disaster Recovery Runbook

🔵 **Low**

Recovery objectives (RTO: 1 hour, RPO: 15 minutes) are defined. But no operational runbook exists for: who performs recovery, in what order, with what validation steps, and how multi-tenant isolation is verified after restore. Targets without procedures are aspirational.

---

## Summary Table

| # | Category | Finding | Severity | Documents Affected |
|---|---|---|---|---|
| 1.1 | Contradiction | Project ownership rule: mandatory vs optional engagement/client | 🔴 Critical | 04, 10 |
| 1.2 | Contradiction | Engagement missing `organization_id` despite constitutional requirement | 🔴 Critical | 04, 05, 10 |
| 1.3 | Contradiction | SubProject children: hierarchy vs entity model vs ERD | 🟠 High | 04, 05, 10 |
| 1.4 | Contradiction | Quote ownership: lead vs client vs project | 🟠 High | 05, 10 |
| 1.5 | Contradiction | Gallery bridge entity: GalleryImage vs GalleryAsset | 🟡 Medium | 05, 10 |
| 1.6 | Contradiction | Subscription as aggregate root vs BillingAccount child | 🟡 Medium | 04, 05, 10 |
| 1.7 | Contradiction | Domain event catalog inconsistency across three documents | 🟡 Medium | 04, 10, 11 |
| 1.8 | Contradiction | Conversation ownership: SubProject vs Project/Client | 🟡 Medium | 04, 10 |
| 2.1 | Missing entity | Notification / NotificationTemplate / NotificationDelivery | 🔴 Critical | 07, 09, 10 |
| 2.2 | Missing entity | WebhookSubscription / IntegrationCredential | 🔴 Critical | 12, all |
| 2.3 | Missing entity | DocumentTemplate / GeneratedDocument | 🟠 High | 09, 11 |
| 2.4 | Missing entity | Refund | 🟠 High | 05, 10, 13 |
| 2.5 | Missing entity | ProjectMilestone | 🟠 High | 08 |
| 2.6 | Missing entity | FeatureFlag / PlanFeature | 🟠 High | 11 |
| 2.7 | Missing entity | Tag / TagDefinition / EntityTag | 🟡 Medium | 08 |
| 2.8 | Missing entity | Location (as managed entity) | 🟡 Medium | 04, 05 |
| 2.9 | Missing entity | BillingAccount (absent from Entity Model) | 🟡 Medium | 05, 10 |
| 2.10 | Missing entity | ReportDefinition / DashboardConfiguration | 🟡 Medium | 09, 10 |
| 2.11 | Missing entity | TemplateMigration | 🔵 Low | 09 |
| 2.12 | Missing entity | StorageQuota / UsageTracking | 🟠 High | all |
| 3.1 | Missing relationship | FieldValue: no `organization_id` or `entity_type` | 🔴 Critical | 07, 10 |
| 3.2 | Missing relationship | FormSubmission: no entity anchor | 🔴 Critical | 07 |
| 3.3 | Missing relationship | Opportunity → Client / Project post-conversion | 🟠 High | 05, 10 |
| 3.4 | Missing relationship | SubProject → Task | 🟠 High | 04, 05, 10 |
| 3.5 | Missing relationship | Conversation participants | 🟡 Medium | 05, 10 |
| 3.6 | Missing relationship | WorkflowExecution → client/engagement anchor | 🟡 Medium | 08, 10 |
| 3.7 | Missing relationship | Campaign attribution chain through conversion | 🟡 Medium | 05, 10 |
| 4.1 | Missing workflow | Client onboarding | 🟠 High | 09 |
| 4.2 | Missing workflow | Subscription lifecycle | 🔴 Critical | all |
| 4.3 | Missing workflow | User invitation and onboarding | 🟠 High | 13 |
| 4.4 | Missing workflow | Organization offboarding / tenant purge | 🟠 High | 10, 11 |
| 4.5 | Missing workflow | Asset retention and purge | 🟠 High | 10 |
| 4.6 | Missing workflow | SLA breach escalation | 🟡 Medium | 08 |
| 4.7 | Missing workflow | Financial reconciliation | 🟡 Medium | 05 |
| 5.1 | Missing RBAC | `TemplateAdmin` permission referenced but undefined | 🔴 Critical | 09, 13 |
| 5.2 | Missing RBAC | SubProject permissions absent from catalog | 🟠 High | 13 |
| 5.3 | Missing RBAC | Conversation / Message permissions absent | 🟠 High | 13 |
| 5.4 | Missing RBAC | Form / FormSubmission permissions absent | 🟠 High | 13 |
| 5.5 | Missing RBAC | Refund permission absent | 🟠 High | 13 |
| 5.6 | Missing RBAC | Platform Operator has no RBAC model | 🟠 High | 09, 13 |
| 5.7 | Missing RBAC | Engagement.Delete absent | 🟡 Medium | 13 |
| 5.8 | Missing RBAC | Webhook permissions too coarse | 🟡 Medium | 12, 13 |
| 5.9 | Missing RBAC | AI.ViewActionLog / audit permission absent | 🟡 Medium | 13 |
| 6.1 | Missing config | Notification template configuration | 🔴 Critical | 07, 09 |
| 6.2 | Missing config | Field-level PII classification on FieldDefinition | 🟠 High | 07, 09 |
| 6.3 | Missing config | Custom validation rule schema undefined | 🟠 High | 07 |
| 6.4 | Missing config | Tax rate configuration | 🟠 High | 05, 07 |
| 6.5 | Missing config | Conditional field visibility in forms | 🟡 Medium | 07 |
| 6.6 | Missing config | Locale / language configuration | 🟡 Medium | 05, 11 |
| 6.7 | Missing config | Feature flag configuration surface | 🟡 Medium | 11 |
| 7.1 | Multi-tenant risk | FieldValue has no tenant isolation | 🔴 Critical | 07, 10 |
| 7.2 | Multi-tenant risk | Redis channels not namespaced by organization | 🟠 High | 11 |
| 7.3 | Multi-tenant risk | Analytics aggregations lack explicit org scoping model | 🟠 High | 10, 11 |
| 7.4 | Multi-tenant risk | AI context assembly boundary undefined | 🟠 High | 11 |
| 7.5 | Multi-tenant risk | Celery worker organization context not enforced | 🟠 High | 11 |
| 7.6 | Multi-tenant risk | Pre-signed URL org validation absent | 🟡 Medium | 11 |
| 7.7 | Multi-tenant risk | RLS superuser bypass undocumented | 🟡 Medium | 11 |
| 7.8 | Multi-tenant risk | Search index organization isolation undefined | 🟡 Medium | 11, 12 |
| 8.1 | Scalability risk | EAV pattern for custom fields at 10M assets | 🔴 Critical | 07, 10 |
| 8.2 | Scalability risk | Redis as single multi-role infrastructure component | 🔴 Critical | 11 |
| 8.3 | Scalability risk | Single PostgreSQL cluster for all tenants | 🟠 High | 11 |
| 8.4 | Scalability risk | Workflow execution table growth without archival | 🟠 High | 08, 10, 11 |
| 8.5 | Scalability risk | Configuration cache thundering herd | 🟠 High | 11 |
| 8.6 | Scalability risk | No OLAP / analytics data warehouse | 🟠 High | 11 |
| 8.7 | Scalability risk | Media processing at 10M assets — no isolation or SLA | 🟠 High | 11 |
| 8.8 | Scalability risk | Full-text search degrades at 10M records | 🟠 High | 11, 12 |
| 8.9 | Scalability risk | Gallery expiry scan — no efficient pattern | 🟡 Medium | 05, 11 |
| 8.10 | Scalability risk | JWT token size unbounded at scale | 🟡 Medium | 12, 13 |
| 9.1 | Security risk | Finance approval only enforced in Workflow Engine | 🔴 Critical | 08, 11 |
| 9.2 | Security risk | Pre-signed URL expiry unbounded | 🟠 High | 11 |
| 9.3 | Security risk | AI PII consent policy undefined | 🟠 High | 11 |
| 9.4 | Security risk | Delegation not revoked on delegator permission loss | 🟠 High | 13 |
| 9.5 | Security risk | Audit log has no cryptographic tamper evidence | 🟠 High | 10, 11, 13 |
| 9.6 | Security risk | Password policy and account lockout undefined | 🟡 Medium | 11, 12 |
| 9.7 | Security risk | CSRF protection not mentioned | 🟡 Medium | 12 |
| 9.8 | Security risk | XSS via stored custom field values | 🟡 Medium | 07, 12 |
| 9.9 | Security risk | Secrets in `definition_json` — convention not enforcement | 🟡 Medium | 08 |
| 10.1 | Doc gap | Analytics domain has no architecture document | 🔴 Critical | missing |
| 10.2 | Doc gap | Communications and Marketing domains have no architecture documents | 🟠 High | missing |
| 10.3 | Doc gap | AI domain has no dedicated architecture document | 🟠 High | missing |
| 10.4 | Doc gap | Documents 01, 02, 03, 06 are absent | 🟠 High | missing |
| 10.5 | Doc gap | No SLA / SLO document | 🟠 High | missing |
| 10.6 | Doc gap | No integration catalog | 🟡 Medium | missing |
| 10.7 | Doc gap | No multi-currency / multi-jurisdiction documentation | 🟡 Medium | missing |
| 10.8 | Doc gap | No mobile / PWA architecture | 🟡 Medium | missing |
| 10.9 | Doc gap | No data import / migration strategy | 🟡 Medium | missing |
| 10.10 | Doc gap | No disaster recovery runbook | 🔵 Low | missing |

---

## Priority Remediation Order

The following items must be resolved before Sprint 01 implementation begins:

1. **Resolve Project ownership contradiction** (1.1) — foundational data model integrity
2. **Add `organization_id` to Engagement** (1.2) — tenant isolation requirement
3. **Add `organization_id` and `entity_type` to FieldValue** (3.1, 7.1) — tenant security
4. **Add entity anchor to FormSubmission** (3.2) — data integrity
5. **Define `TemplateAdmin` and all missing permissions** (5.1–5.9) — RBAC completeness
6. **Define Notification entity model** (2.1, 6.1) — workflow execution cannot function without it
7. **Define WebhookSubscription entity model** (2.2) — integration surface is undefined
8. **Resolve EAV scalability** (8.1) — JSONB hybrid strategy required before data model is frozen
9. **Partition Redis roles** (8.2) — separate instances or keyspace partitioning before production
10. **Define Analytics domain architecture** (10.1, 8.6) — no analytics delivery is possible without it

---

*This document reflects the state of CBOS architecture documentation as of the review date. All findings are based exclusively on documents 04 through 14 in the /docs directory. Findings should be reviewed against implementation state and resolved through document updates, entity additions, and architecture decisions recorded as ADRs.*
