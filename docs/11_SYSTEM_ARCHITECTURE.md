# CBOS System Architecture

## Version 1.0

Creative Business Operating System (CBOS)

---

## 1. System Overview

CBOS is a multi-tenant, cloud-native operating system for creative businesses. It is designed to serve Photography Studios, Videography Studios, Marketing Agencies, Production Houses, Podcast Studios, and any future creative industry that operates on a project-centric, client-serving model.

CBOS is built on the principle that industry-specific behavior is expressed through metadata and configuration — not through code. The core platform is permanent and universal. Business Templates extend it for individual industries without modifying the platform.

### System Identity

| Attribute | Value |
|---|---|
| Architecture Style | Monolith-first, microservice-ready |
| Deployment Model | Containerized, cloud-native |
| Tenancy Model | Multi-tenant, organization-isolated |
| Data Model | Project-centric, event-driven |
| Extensibility Model | Metadata-driven, template-based |
| AI Posture | AI-augmented, human-in-the-loop |

### Bounded Context Map

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CBOS Core Platform                          │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Identity │  │   Orgs   │  │   CRM    │  │ Clients  │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │Engagement│  │ Projects │  │Operations│  │  Media   │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Finance  │  │ Comms    │  │Marketing │  │Workflow  │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │Analytics │  │    AI    │  │ Billing  │  │  Config  │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architectural Principles

### Principle 1 — Project Centricity
Every business activity must ultimately connect back to a Project. The Project is the primary aggregate and operational anchor of the entire system.

### Principle 2 — Multi-Tenancy is Mandatory
Every entity must carry an `organization_id`. No cross-organization reads, writes, or reports are permitted under any condition.

### Principle 3 — Everything is Metadata
Business behavior is expressed through configuration. Industry-specific logic is never hardcoded when it can be represented through the Configuration Engine or Workflow Engine.

### Principle 4 — Event-Driven by Default
Every meaningful state change emits a domain event. Workflows, analytics, AI, and integrations subscribe to these events. No component polls for state changes.

### Principle 5 — API-First
No UI component accesses the database directly. All data access flows through versioned, organization-scoped APIs.

### Principle 6 — Domain Boundaries are Sacred
No domain owns another domain's tables. No cross-domain queries bypass the API layer. Service boundaries follow bounded context lines.

### Principle 7 — AI is Augmentation, Not Autonomy
AI may recommend, suggest, predict, and summarize. AI may never delete records, issue refunds, send payments, publish workflows, or modify finance records without explicit human approval.

### Principle 8 — Auditability is Non-Negotiable
Every state change, configuration modification, workflow execution, and AI recommendation is recorded with actor, timestamp, and context.

### Principle 9 — Failure is a First-Class Concern
Retries, dead letter queues, idempotency keys, and manual recovery paths are built into the engine, not added as afterthoughts.

### Principle 10 — Industry Agnosticism
The core engine cannot assume any industry domain. A new business vertical requires only a new Business Template, not new platform code.

---

## 3. Deployment Architecture

### Environment Strategy

| Environment | Purpose |
|---|---|
| Development | Local developer workstations via Docker Compose |
| Staging | Full replica of production, used for integration testing and UAT |
| Production | Cloud-hosted, multi-availability-zone deployment |

### High-Level Deployment Diagram

```
                        ┌──────────────────────────┐
                        │       CDN / WAF           │
                        │  (Static Assets + DDoS)   │
                        └────────────┬─────────────┘
                                     │
                        ┌────────────▼─────────────┐
                        │       Load Balancer       │
                        │      (HTTPS Termination)  │
                        └──────┬───────────┬────────┘
                               │           │
               ┌───────────────▼─┐       ┌─▼───────────────┐
               │  React Frontend  │       │  FastAPI Backend │
               │  (Static Build)  │       │  (Docker)        │
               └──────────────────┘       └────────┬────────┘
                                                   │
                    ┌──────────────────────────────┼────────────────────────┐
                    │                              │                        │
          ┌─────────▼──────┐            ┌──────────▼──────┐     ┌──────────▼──────┐
          │  PostgreSQL     │            │     Redis        │     │  Object Storage  │
          │  (Primary DB)   │            │  (Cache + Queue) │     │  (Media Assets)  │
          └─────────────────┘            └─────────────────┘     └──────────────────┘
```

### Container Architecture

Every component is containerized using Docker. The full stack is orchestrated using Docker Compose for local development and a container orchestration platform for production environments.

| Container | Technology | Role |
|---|---|---|
| `cbos-frontend` | React + TypeScript + Nginx | Serves compiled SPA |
| `cbos-api` | FastAPI + Python | Core API server |
| `cbos-worker` | FastAPI + Celery | Background task execution |
| `cbos-scheduler` | Celery Beat | Cron and scheduled workflow triggers |
| `cbos-db` | PostgreSQL | Primary relational data store |
| `cbos-cache` | Redis | Session cache, job queue, pub/sub |
| `cbos-storage` | Object Storage (S3-compatible) | Media, asset, and file storage |

### Network Zones

```
Public Zone       → CDN, Load Balancer
Application Zone  → Frontend containers, API containers
Data Zone         → PostgreSQL, Redis
Storage Zone      → Object Storage
Management Zone   → Monitoring, Logging, Admin
```

---

## 4. Frontend Architecture

### Technology Stack

| Component | Technology |
|---|---|
| Framework | React 18+ |
| Language | TypeScript (strict mode) |
| State Management | React Query (server state) + Zustand (UI state) |
| Routing | React Router v6 |
| UI Components | Design system (component library) |
| Forms | React Hook Form |
| API Client | Axios with interceptors |
| Build Tool | Vite |
| Testing | Vitest + React Testing Library |

### Application Structure

```
src/
├── app/                  # App entry, routing, providers
├── domains/              # Feature modules aligned to bounded contexts
│   ├── identity/
│   ├── crm/
│   ├── projects/
│   ├── operations/
│   ├── media/
│   ├── finance/
│   ├── workflows/
│   └── ai/
├── shared/               # Shared components, hooks, utilities
│   ├── components/
│   ├── hooks/
│   ├── api/
│   └── types/
└── config/               # App-level configuration
```

### Multi-Tenant Frontend Rules

- The active `organization_id` is resolved at session authentication and injected into all API requests via an Axios interceptor.
- No component renders data from a different organization than the authenticated session's organization.
- Organization-specific configuration (branding, timezone, currency, feature flags) is loaded once at session start and stored in a global context provider.

### Metadata-Driven UI

The frontend renders dynamic forms, field definitions, status lists, and dashboard layouts from metadata API responses. The Configuration Engine drives UI behavior without frontend code changes. Field types, validation rules, select options, and form layouts are fetched from the configuration API and rendered by a generic form engine.

### AI Copilot Integration

An AI Copilot panel is available as a sidebar component rendered within a CopilotSessionProvider. The Copilot receives context (current organization, project, entity type, and entity ID) and streams AI recommendations, suggestions, and summaries through a dedicated API endpoint.

---

## 5. Backend Architecture

### Technology Stack

| Component | Technology |
|---|---|
| Framework | FastAPI |
| Language | Python 3.11+ |
| ORM | SQLAlchemy 2.x (async) |
| Migrations | Alembic |
| Task Queue | Celery + Redis |
| Validation | Pydantic v2 |
| Authentication | JWT (access + refresh tokens) |
| Authorization | RBAC via organization-scoped permission sets |
| Testing | pytest + pytest-asyncio |
| Documentation | Auto-generated OpenAPI via FastAPI |

### API Layer Structure

```
cbos-api/
├── main.py
├── core/
│   ├── config.py            # Settings and environment
│   ├── security.py          # JWT, hashing
│   ├── database.py          # Async engine and session
│   ├── events.py            # Domain event publisher
│   └── middleware.py        # Tenant resolution, logging
├── domains/
│   ├── identity/
│   ├── organizations/
│   ├── crm/
│   ├── clients/
│   ├── engagements/
│   ├── projects/
│   ├── operations/
│   ├── media/
│   ├── finance/
│   ├── communications/
│   ├── marketing/
│   ├── workflows/
│   ├── analytics/
│   ├── ai/
│   ├── billing/
│   └── configuration/
├── shared/
│   ├── models/              # Base SQLAlchemy models
│   ├── schemas/             # Shared Pydantic schemas
│   ├── repositories/        # Base repository pattern
│   └── exceptions/
└── workers/
    ├── workflow_worker.py
    ├── notification_worker.py
    └── analytics_worker.py
```

### Domain Module Structure

Each domain module follows a consistent internal structure:

```
domains/{domain}/
├── router.py       # FastAPI router with path operations
├── service.py      # Business logic
├── repository.py   # Database queries
├── models.py       # SQLAlchemy ORM models
├── schemas.py      # Pydantic request/response schemas
└── events.py       # Domain event definitions
```

### Request Lifecycle

```
HTTP Request
    ↓
Load Balancer / TLS Termination
    ↓
FastAPI ASGI Server (Uvicorn)
    ↓
Middleware Stack
  → Correlation ID injection
  → Organization scope resolution
  → JWT authentication and claims extraction
  → Request logging
    ↓
Route Handler (Router)
    ↓
Service Layer (Business logic, authorization checks)
    ↓
Repository Layer (Database access, always organization-scoped)
    ↓
Domain Event Publisher (async, non-blocking)
    ↓
Response Serialization (Pydantic)
    ↓
HTTP Response
```

### Organization Scope Enforcement

Every database query in every repository enforces the `organization_id` filter. The active organization ID is extracted from the JWT token claims and propagated through a request-scoped dependency injection context. No service method or repository method may accept queries without an organization scope.

### Background Workers

Long-running and asynchronous operations are processed by Celery workers consuming from Redis queues. Workers are domain-aligned and horizontally scalable. Worker categories include:

- Workflow execution workers
- Notification dispatch workers (email, SMS, in-app)
- Media processing workers (thumbnail generation, asset analysis)
- Analytics aggregation workers
- Scheduled trigger workers

---

## 6. Database Architecture

### Technology

PostgreSQL is the single source of truth for all structured operational data. All CBOS entities are stored in PostgreSQL.

### Schema Strategy

| Schema | Purpose |
|---|---|
| `identity` | Users, roles, permissions, sessions |
| `organizations` | Organizations, branches, teams |
| `crm` | Leads, opportunities, quotes |
| `clients` | Clients, contacts, engagements |
| `projects` | Projects, sub-projects, tasks |
| `operations` | Shoots, shoot setups, locations |
| `media` | Assets, galleries, gallery images, selections, deliverables |
| `finance` | Invoices, payments, expenses, payment allocations |
| `communications` | Conversations, messages |
| `marketing` | Campaigns, campaign leads |
| `workflows` | Definitions, versions, executions, steps, events, approvals |
| `configuration` | Project types, field definitions, status definitions, forms |
| `analytics` | Metrics, snapshots, domain event feeds |
| `ai` | Sessions, recommendations, action logs |
| `billing` | Subscriptions, billing accounts, platform invoices |

### Mandatory Column Standards

Every persistent entity table must include:

| Column | Type | Purpose |
|---|---|---|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Multi-tenant isolation |
| `created_at` | TIMESTAMPTZ | Audit trail |
| `updated_at` | TIMESTAMPTZ | Audit trail |
| `created_by` | UUID | Actor tracking |
| `updated_by` | UUID | Actor tracking |
| `deleted_at` | TIMESTAMPTZ | Soft delete support |
| `is_deleted` | BOOLEAN | Soft delete flag |

### Multi-Tenant Isolation

- Row-Level Security (RLS) policies are applied to all tenant-scoped tables, enforcing `organization_id` equality at the database level as a secondary defense layer.
- Application-level `organization_id` filtering is the primary enforcement mechanism applied in every repository query.
- Database connections never use privileged roles from the application layer. A least-privilege application role with schema-level permissions is used at runtime.

### Indexing Strategy

- Composite index on `(organization_id, id)` for all tenant-scoped tables.
- Composite index on `(organization_id, created_at DESC)` for list queries.
- Partial indexes on `is_deleted = false` for all soft-deleted tables.
- Full-text search indexes on name, title, and description fields where search is required.
- Index on `(project_id, organization_id)` for all project-child entities.

### Migration Strategy

All schema changes are managed through Alembic versioned migrations. Migrations are reviewed, tested in staging, and applied in production through automated deployment pipelines. Destructive migrations require a dual-phase approach: deprecate then remove.

---

## 7. Event Architecture

### Event Bus

Redis Pub/Sub is used for lightweight, low-latency in-process event delivery within the same deployment unit. For durable, guaranteed event delivery between asynchronous workers, Celery tasks backed by Redis queues provide persistence and retry guarantees.

### Domain Event Structure

Every domain event carries a standardized envelope:

```
event_id          UUID       Unique event identifier
event_type        String     e.g. ProjectCreated, InvoicePaid
occurred_at       ISO-8601   Timestamp of the state change
organization_id   UUID       Tenant scoping
actor_id          UUID       User or system that caused the event
aggregate_type    String     e.g. Project, Invoice
aggregate_id      UUID       ID of the affected aggregate
version           Integer    Schema version of the event payload
payload           JSON       Event-specific data
correlation_id    UUID       Trace identifier across event chains
```

### Domain Event Catalog

| Domain | Events |
|---|---|
| CRM | LeadCreated, LeadAssigned, LeadConverted, QuoteCreated, QuoteAccepted |
| Client | ClientCreated, ClientUpdated |
| Engagement | EngagementCreated, EngagementClosed |
| Project | ProjectCreated, ProjectStarted, ProjectCompleted, ProjectArchived |
| Operations | ShootScheduled, ShootCompleted, LocationAssigned |
| Media | GalleryCreated, GalleryDelivered, SelectionCompleted |
| Finance | InvoiceGenerated, InvoicePaid, PaymentReceived, RefundIssued |
| Communications | MessageSent, MessageDelivered, CampaignExecuted |
| Workflow | WorkflowStarted, WorkflowCompleted, WorkflowFailed, WorkflowDeadLettered |
| Configuration | ConfigurationPublished, ConfigurationRolledBack |

### Event Consumer Architecture

```
Domain Service
    ↓
Event Publisher (async, non-blocking)
    ↓
Redis Event Bus
    ↓
    ├── Workflow Engine (trigger evaluation)
    ├── Analytics Worker (metric aggregation)
    ├── AI Session Context Updater
    └── Notification Dispatcher
```

### Event Durability

Events that require guaranteed delivery (workflow triggers, finance notifications, external webhooks) are published to Celery task queues backed by Redis with acknowledgement and retry policies. Events that are advisory (analytics feeds, AI context updates) use fire-and-forget pub/sub.

---

## 8. Workflow Execution Architecture

### Engine Overview

The Workflow Engine is the automation and orchestration layer of CBOS. It reacts to domain events, evaluates configurable conditions, and executes controlled actions across any business context — without industry-specific hardcoding.

### Execution Architecture

```
Trigger Sources
  ├── Domain Events (entity state changes)
  ├── Scheduled Events (time-based, org-timezone-aware)
  ├── Manual Events (user-initiated via API)
  └── API Events (external webhooks, integration callbacks)
        ↓
Event Ingestion Layer (FastAPI endpoint + Celery task)
        ↓
Workflow Resolver
  → Resolve organization scope
  → Identify matching workflow definitions
  → Load published version (immutable snapshot)
        ↓
Execution Context Builder
  → organization_id, project_id, actor_id
  → entity type, entity ID
  → timezone, custom field values
        ↓
Condition Evaluator
  → ALL / ANY / NONE logic groups
  → Entity field comparisons, date logic, role checks
        ↓
Action Executor
  → Communications (email, SMS, in-app, webhook)
  → Task creation and assignment
  → Project state updates
  → Finance action drafts (human-approval required)
  → Sub-workflow invocation
  → Wait states and approval gates
        ↓
Execution Persister
  → WorkflowExecution record (status, duration, retry count)
  → WorkflowExecutionStep records (per action)
  → WorkflowExecutionEvent records (immutable audit trail)
        ↓
Failure Handler
  → Configurable retry with exponential backoff
  → Dead Letter Queue for irrecoverable failures
  → Manual intervention API (retry, skip, cancel, replay)
```

### Worker Architecture

Workflow workers are Celery consumers that process execution tasks from the workflow queue. Workers are stateless, horizontally scalable, and partitioned by organization where volume demands it. Long-running wait states (approval pending, external callback awaiting) are tracked as WAITING status in the database and do not hold a worker thread.

### Versioning and Rollback

- Workflow versions move through DRAFT → PUBLISHED → ARCHIVED states.
- Published versions are immutable. Active executions continue on their original version.
- Rollback promotes a prior published version to active. New executions use the newly promoted version.
- Every version change creates an audit event recording actor, timestamp, and change summary.

---

## 9. File Storage Architecture

### Storage Strategy

All binary files — photographs, videos, documents, deliverables, and attachments — are stored in an S3-compatible object storage service. The PostgreSQL database stores only metadata references (storage path, size, mime type, checksum). The database never stores binary content.

### Asset Organization

```
{organization_id}/
├── library/                   # Organization asset library
│   └── {asset_id}/{filename}
└── projects/
    └── {project_id}/
        ├── assets/            # Project-scoped assets
        │   └── {asset_id}/{filename}
        ├── galleries/         # Gallery deliverables
        │   └── {gallery_id}/{image_id}/{filename}
        └── deliverables/      # Final deliverable packages
            └── {deliverable_id}/{version}/{filename}
```

### Access Control

- All direct client access to stored files is via pre-signed URLs with configurable expiry times.
- The API generates pre-signed URLs on demand. Clients never have long-lived credentials to the storage bucket.
- Gallery sharing uses time-limited, token-protected pre-signed URLs with configurable expiry matching the gallery expiry date.
- Internal workers access storage through a service role with write permissions scoped to the organization prefix.

### Media Processing

Asset ingestion triggers a background worker that performs:
- Thumbnail and preview generation
- EXIF/metadata extraction
- Virus scanning
- Optional AI-based tagging and content analysis

Processing status is tracked on the Asset entity. The original file is preserved unmodified.

### Dual Asset Ownership

Assets support two ownership models as defined in the Master ERD:
- **Organization Asset Library** — assets belonging to the organization that are not project-specific (brand materials, templates, stock).
- **Project Asset Library** — assets belonging to a specific project (shoot outputs, raw files, final deliverables).

---

## 10. AI Architecture

### AI Design Principles

- AI is an augmentation layer, not an autonomous agent.
- AI operates within the permission boundaries of the authenticated user and their organization.
- AI may never write to finance records, issue payments, publish workflows, delete data, or send external communications without human confirmation.
- All AI interactions are logged in the `ai` schema with actor, session context, recommendation payload, and confidence score.

### AI Components

| Component | Purpose |
|---|---|
| Copilot Session | Context-aware conversational assistant per user session |
| AI Recommendation Engine | Generates suggestions for leads, workflows, project actions |
| Predictive Analytics | Forecasting for revenue, project delivery, resource demand |
| Workflow Optimizer | Identifies bottleneck steps, dead-letter patterns, optimization opportunities |
| Content Analyzer | Auto-tagging and content analysis for media assets |
| Smart Search | Semantic search across projects, clients, assets, communications |

### AI Integration Architecture

```
User Interaction (Copilot Panel)
    ↓
CopilotSession (organization_id + context entity)
    ↓
AI API Endpoint (FastAPI, streaming response)
    ↓
Context Assembler
  → Current project, entity type, entity ID
  → Recent domain events for organization
  → User role and permissions
    ↓
LLM Provider (external, via abstraction layer)
    ↓
Response Streamer → Frontend
    ↓
AIRecommendation persisted
    ↓
AIActionLog persisted (if user acts on recommendation)
```

### AI Data Access

- The AI layer accesses CBOS data through the same organization-scoped API and repository layer used by the rest of the application. It does not query the database directly.
- Context is assembled from pre-fetched, permission-filtered data snapshots. Raw database dumps are never passed to external AI providers.
- Personally identifiable information (PII) is masked before being included in AI context payloads unless the organization has configured explicit AI-PII consent.

### AI Safety Rules

- Finance mutations require human confirmation regardless of AI confidence.
- Workflow publishing requires human confirmation.
- External communication sending (email, SMS) requires human confirmation.
- AI recommendations include a confidence score and must be accepted or rejected by a user before any state change occurs.

---

## 11. Security Architecture

### Authentication

- JSON Web Tokens (JWT) are used for stateless authentication.
- Access tokens are short-lived (15 minutes). Refresh tokens are long-lived (30 days) and stored server-side in Redis to enable revocation.
- Token claims include: `user_id`, `organization_id`, `email`, `roles`, `permissions`, `issued_at`, `expires_at`.
- Multi-factor authentication is supported for organization administrators.

### Authorization

CBOS uses a three-layer authorization model:

**Layer 1 — Organization Scope**
Every request must carry a valid JWT. The `organization_id` in the token defines the tenant boundary. No operation may access data outside this boundary.

**Layer 2 — Role-Based Access Control (RBAC)**
Roles are organization-scoped and composed of permission sets. Permissions are fine-grained codes (e.g., `Project.View`, `Invoice.Create`, `Gallery.Share`). Permission evaluation is performed in the service layer before any data access.

**Layer 3 — Row-Level Security (RLS)**
PostgreSQL Row-Level Security policies enforce `organization_id` equality at the database level as a defense-in-depth measure.

### API Security

- All API endpoints are served over HTTPS only. HTTP is rejected at the load balancer.
- CORS is configured to allow only known frontend origins.
- Rate limiting is applied at the API gateway level, scoped per `organization_id` and per `user_id`.
- Input validation is enforced through Pydantic schemas on all request bodies and query parameters.
- SQL injection is prevented through parameterized queries enforced by SQLAlchemy.

### Secrets Management

- Database credentials, external API keys, JWT secrets, and storage credentials are injected via environment variables at runtime.
- No secrets are stored in source code, Docker images, or configuration files.
- Integration credentials (webhooks, external service tokens) stored in workflow definitions are encrypted at rest using a platform-managed key.

### Data Encryption

- All data at rest in PostgreSQL and object storage is encrypted using platform-managed keys.
- All data in transit uses TLS 1.2 or higher.
- Sensitive fields (payment references, personal data) are encrypted at the application layer in addition to storage-level encryption where required by compliance policy.

### Audit Logging

Every security-relevant event is recorded, including:
- User authentication (success and failure)
- Permission denied events
- Data access for sensitive entities (finance, personal data)
- Configuration changes
- Workflow publish, rollback, and manual intervention
- AI action logs

---

## 12. Multi-Tenant Architecture

### Tenancy Model

CBOS uses a shared-infrastructure, organization-isolated multi-tenancy model. All organizations share the same database cluster and application servers. Isolation is enforced at the application layer through mandatory `organization_id` scoping, and at the database layer through Row-Level Security policies.

### Tenant Isolation Guarantees

| Layer | Isolation Mechanism |
|---|---|
| API | JWT claims enforce organization_id per request |
| Service | Repository methods require organization_id parameter |
| Database | RLS policies enforce organization_id per row |
| Event Bus | Events carry organization_id; workers filter by tenant |
| File Storage | Object paths are prefixed with organization_id |
| AI | Context assembly is scoped to the authenticated organization |
| Analytics | Materialized views and snapshots are organization-scoped |
| Workflow | Definitions, executions, and audit trails are organization-isolated |

### Tenant Onboarding

New organization onboarding creates:
1. Organization record with slug, timezone, currency, industry type
2. Default branch
3. Default administrator role and permission set
4. Billing account and subscription record
5. Configuration package with system defaults
6. Optional Business Template installation

### Tenant Configuration Isolation

Each organization owns its Configuration Package containing its own project types, field definitions, status definitions, form definitions, workflow templates, roles, and permission sets. No organization can read or modify another organization's configuration.

### Subscription-Gated Features

Feature availability is controlled by the organization's subscription plan. Feature flag checks are performed in the service layer. The configuration metadata includes `min_plan` attributes that gate access to advanced capabilities.

---

## 13. Monitoring and Observability

### Observability Stack

| Component | Tool |
|---|---|
| Structured Logging | JSON logs → centralized log aggregation |
| Metrics | Prometheus metrics endpoint on API and workers |
| Dashboards | Grafana dashboards for system and business metrics |
| Distributed Tracing | OpenTelemetry instrumentation → trace backend |
| Alerting | Prometheus Alertmanager rules for SLO breaches |
| Uptime | Health check endpoints on all containers |

### Health Check Endpoints

Every container exposes a `/health` endpoint returning:
- Application status
- Database connectivity
- Redis connectivity
- Current version

A `/ready` endpoint indicates that the instance is ready to receive traffic (used by container orchestrator readiness probes).

### Key Metrics

**API Layer**
- Request rate by endpoint and organization
- P50, P95, P99 latency by endpoint
- Error rate (4xx, 5xx) by endpoint
- Active sessions by organization

**Worker Layer**
- Queue depth by queue name and organization
- Task execution duration by task type
- Task failure rate by task type
- Dead letter queue depth by organization

**Database Layer**
- Connection pool utilization
- Query duration P95 by query class
- Replication lag
- Lock contention events

**Business Layer**
- Active organizations
- Projects created per day
- Workflow executions per hour
- AI recommendation acceptance rate

### Log Standards

All application logs are structured JSON with mandatory fields:

```
timestamp      ISO-8601
level          INFO | WARNING | ERROR | CRITICAL
service        e.g. cbos-api, cbos-worker
correlation_id UUID (request trace)
organization_id UUID (tenant context)
message        String
```

PII must not appear in log entries. User identifiers are logged by ID only.

---

## 14. Scalability Strategy

### Scaling Dimensions

| Dimension | Strategy |
|---|---|
| API throughput | Horizontal scaling of API container instances behind load balancer |
| Background processing | Horizontal scaling of Celery worker pools per queue |
| Database reads | PostgreSQL read replicas for analytics and reporting queries |
| Database writes | Connection pooling via PgBouncer |
| File delivery | CDN in front of object storage for media and asset delivery |
| Caching | Redis caching for organization configuration, session data, and frequent read patterns |
| Search | Dedicated search index for full-text and semantic search |

### Tenant-Level Scaling

- Queue partitioning by `organization_id` allows high-volume tenants to be isolated on dedicated worker pools without affecting other tenants.
- Rate limiting per organization prevents any single tenant from monopolizing shared compute resources.
- Analytics queries run on read replicas, ensuring heavy reporting workloads do not impact transactional API performance.

### Stateless Application Tier

All API and worker containers are stateless. Session state is stored in Redis. All persistent state is in PostgreSQL or object storage. This enables zero-downtime horizontal scaling and rolling deployments.

### Caching Strategy

| Cache Layer | Content | TTL |
|---|---|---|
| Redis (hot) | Organization configuration packages | 5 minutes |
| Redis (hot) | JWT refresh token validation | Per token expiry |
| Redis (hot) | Workflow published version snapshots | 5 minutes |
| Redis (hot) | Permission sets for active users | 5 minutes |
| CDN | Static frontend assets | Immutable (content-addressed) |
| CDN | Media thumbnails and previews | 24 hours |

### Database Partitioning

High-volume tables (domain events, workflow execution events, audit logs, analytics snapshots) are partitioned by `organization_id` and time period to maintain query performance as data volume grows.

---

## 15. Disaster Recovery

### Recovery Objectives

| Objective | Target |
|---|---|
| Recovery Time Objective (RTO) | 1 hour |
| Recovery Point Objective (RPO) | 15 minutes |

### Failure Scenarios and Response

| Scenario | Response |
|---|---|
| Single API instance failure | Load balancer routes traffic to healthy instances within seconds |
| Single worker instance failure | Celery task requeue; task executed by another worker |
| Redis failure | API continues with degraded caching; session re-authentication required |
| PostgreSQL primary failure | Automatic failover to standby replica via streaming replication |
| Object storage outage | File upload and download unavailable; core platform operations continue |
| Full zone failure | Traffic routed to secondary availability zone |
| Data corruption event | Point-in-time recovery from WAL-based continuous backup |

### Database Failover

PostgreSQL is deployed with streaming replication to a hot standby replica in a separate availability zone. Automatic failover is managed by a database orchestration tool. Failover completes within 30 seconds. Applications reconnect automatically via a connection string that resolves to the current primary.

### Data Recovery Process

1. Identify the point-in-time target for recovery
2. Restore PostgreSQL from base backup + WAL replay to target timestamp
3. Validate data integrity and organization isolation
4. Redirect application connections to recovered instance
5. Replay any Celery tasks that were in-flight at the time of failure using task idempotency keys

---

## 16. Backup Strategy

### Database Backup

| Backup Type | Frequency | Retention |
|---|---|---|
| Full base backup | Daily | 30 days |
| Incremental WAL archive | Continuous (15-minute intervals) | 7 days |
| Weekly full backup | Weekly | 12 weeks |
| Monthly full backup | Monthly | 12 months |

All database backups are encrypted using platform-managed keys and stored in a separate availability zone from the primary database.

### Object Storage Backup

Media and asset files stored in object storage are protected by:
- Versioning enabled on the storage bucket (retains deleted and overwritten files for 90 days)
- Cross-region replication to a secondary storage region
- Lifecycle rules that transition older versions to cold storage tiers after 30 days

### Configuration and Metadata Backup

Organization configuration packages (project types, field definitions, workflow definitions) are versioned in the database and subject to standard database backup policies. Additionally, configuration exports are generated daily as JSON snapshots and stored in object storage for rapid recovery without full database restore.

### Backup Validation

Backup restoration is tested monthly in an isolated environment to verify:
- Backup integrity and completeness
- Point-in-time recovery accuracy
- RTO and RPO compliance
- Multi-tenant isolation after restore

---

## 17. Future Microservice Evolution

### Current Architecture

CBOS begins as a well-structured monolith — a modular monolith where domain boundaries are enforced through code organization, schema separation, and event-based communication between domains rather than direct cross-domain coupling.

This approach provides:
- Simpler deployment and operational overhead during early growth
- Easier developer onboarding and debugging
- Full ACID transactions across related domains where needed
- The ability to extract services later without re-architecting event and data contracts

### Evolution Trigger Criteria

A domain is a candidate for microservice extraction when it meets two or more of the following criteria:
- Independent scaling demand significantly different from the core API
- Dedicated team ownership with independent release cadence
- Technology requirements incompatible with the core stack
- Regulatory or compliance boundary requiring isolated deployment
- Sustained throughput exceeding what the monolith tier can handle cost-effectively

### Target Microservice Candidates

| Service | Trigger | Dependency Surface |
|---|---|---|
| Workflow Execution Service | High-volume automation at scale | Domain Events (input), DB (state), Redis (queue) |
| Media Processing Service | GPU/CPU-intensive workloads, independent scaling | Object Storage, Domain Events |
| Analytics Service | Read-heavy, time-series, large data volumes | Read Replica, Domain Events |
| AI Copilot Service | LLM provider dependency, streaming response requirements | REST API, Domain Events, Read API |
| Notification Service | High-volume outbound messaging (email, SMS) | Domain Events, External providers |
| Billing Service | Compliance isolation, payment processor integration | REST API, Stripe/payment provider |

### Extraction Strategy

Domain extraction from the monolith follows a strangler fig pattern:
1. Ensure the domain communicates exclusively through its published API and domain events (no direct cross-domain DB queries).
2. Deploy the extracted service alongside the monolith.
3. Route API calls to the new service through the API gateway while the monolith still handles the route.
4. Migrate database tables to the new service's own schema instance.
5. Decommission the monolith route once the extracted service is stable.

### Event Contract Stability

Domain event schemas are versioned from day one. The event envelope includes a `version` field and the event catalog is maintained as a stable contract. This ensures that when services are extracted, existing event subscribers are not broken by schema evolution in the emitting domain.

### API Gateway Readiness

The load balancer and routing layer is designed to support path-based routing from the beginning. When a service is extracted, its API routes are forwarded to the new service endpoint without requiring frontend or integration changes.

---

## Constitutional Statement

CBOS System Architecture shall remain:

- **Project-Centric** — every execution path connects to a Project
- **Multi-Tenant** — organization isolation is enforced at every layer
- **Event-Driven** — state changes propagate through events, not polling
- **Metadata-Driven** — business behavior is expressed through configuration, not code
- **AI-Augmented** — AI assists humans, never replaces human judgment on consequential actions
- **Industry-Extensible** — new industries require new templates, not new platform code
- **Security-First** — authentication, authorization, and audit are non-negotiable at every layer
- **Operationally Observable** — no component operates without metrics, logging, and health checks
- **Microservice-Ready** — bounded contexts, event contracts, and API boundaries are maintained from day one to enable future service extraction without re-architecting the system
