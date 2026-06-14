# CBOS API Standards

## Version 1.0

## Purpose

This document defines the mandatory API standards for CBOS.

Every FastAPI endpoint, REST contract, integration surface, webhook, file interface, and event-backed API workflow must comply with this document.

## Technology Baseline

| Component | Standard |
|---|---|
| API Style | REST over HTTPS |
| Framework | FastAPI |
| Authentication | JWT access and refresh tokens |
| Data Store | PostgreSQL |
| Cache / Idempotency / Rate Limit Store | Redis |
| Contract Format | JSON over UTF-8 |
| API Description | OpenAPI generated from FastAPI |

---

## 1. API Philosophy

CBOS APIs shall remain:

- **Organization-Scoped** — every request executes within a single organization boundary
- **Project-Centric** — business flows anchor to the Project aggregate wherever applicable
- **Resource-Oriented** — APIs expose business resources, not RPC-style verbs
- **Metadata-Driven** — configuration, workflow, and template behavior are represented through resources and versioned metadata
- **Event-Aware** — state-changing APIs publish domain events after successful persistence
- **Audit-Ready** — every meaningful mutation is traceable by actor, time, and before/after state
- **Industry-Agnostic** — APIs expose core capabilities without hardcoded industry behavior
- **Secure by Default** — authentication, authorization, validation, and tenant isolation are mandatory on every route

---

## 2. Versioning Strategy

### 2.1 External API Versioning

- All public and frontend-consumed endpoints use path-based versioning: `/api/v1/...`
- The major version in the URL defines the contract boundary
- Backward-compatible additions may be introduced within the same major version
- Breaking changes require a new major version path such as `/api/v2/...`

### 2.2 Change Classification

- **Patch-level change** — documentation clarifications, optional response metadata, non-breaking fixes
- **Minor contract change** — additive fields, additive endpoints, additive filters, additive events
- **Major contract change** — field removal, type changes, renamed resources, changed semantics, removed endpoints, changed authentication or authorization expectations

### 2.3 Compatibility Rules

- Published API versions are immutable in behavior except for non-breaking fixes
- New response fields must be additive and optional for consumers
- Clients must ignore unknown response fields
- Event payload versions are versioned independently through an event `version` field

---

## 3. Resource Naming Standards

### 3.1 Resource Names

- Use plural nouns for top-level collections
- Use kebab-case for path segments
- Use canonical business names from the Domain Model and Entity Model
- Avoid verbs in resource names
- Avoid abbreviations unless they are domain-standard and unambiguous

Examples:

- `/api/v1/organizations`
- `/api/v1/clients`
- `/api/v1/engagements`
- `/api/v1/projects`
- `/api/v1/sub-projects`
- `/api/v1/workflow-definitions`
- `/api/v1/workflow-executions`
- `/api/v1/field-definitions`
- `/api/v1/business-templates`

### 3.2 Sub-Resources

Use sub-resources only for true ownership or containment relationships.

Examples:

- `/api/v1/clients/{client_id}/contacts`
- `/api/v1/projects/{project_id}/tasks`
- `/api/v1/projects/{project_id}/galleries`
- `/api/v1/workflow-definitions/{workflow_definition_id}/versions`

### 3.3 Action Endpoints

Where a business action cannot be expressed as normal CRUD, use a terminal action segment on the resource.

Examples:

- `POST /api/v1/workflow-definitions/{workflow_definition_id}/publish`
- `POST /api/v1/workflow-definitions/{workflow_definition_id}/rollback`
- `POST /api/v1/workflow-executions/{workflow_execution_id}/retry`
- `POST /api/v1/galleries/{gallery_id}/share`

---

## 4. URL Standards

### 4.1 Base Structure

- Base prefix: `/api`
- Version prefix: `/api/v{major_version}`
- Resource path: `/api/v1/{resource}`
- Resource instance path: `/api/v1/{resource}/{resource_id}`

### 4.2 Scoping Rules

- Tenant-scoped routes must not require `organization_id` in the URL when the organization is derived from JWT claims
- Platform administration routes may use a dedicated namespace such as `/api/v1/platform/...`
- Public callback routes may use `/api/v1/webhooks/...` and must establish scope through signed integration identity, not through unauthenticated free-form organization input

### 4.3 Identifier Rules

- Use UUIDs for resource identifiers unless a documented external slug is explicitly intended
- Path parameter names use snake_case with `_id` suffix
- URLs must be lowercase
- Trailing slashes are not used

### 4.4 HTTP Method Semantics

- `GET` — read-only retrieval
- `POST` — create resource or invoke non-idempotent business action
- `PUT` — full replacement of a resource representation
- `PATCH` — partial update
- `DELETE` — logical removal where soft delete applies

CBOS default deletion behavior is soft delete for mutable business data unless a resource is explicitly append-only.

---

## 5. Request Standards

### 5.1 Content Types

- JSON requests use `Content-Type: application/json`
- File uploads use `multipart/form-data` only where direct object-storage upload is not used
- All request and response payloads use UTF-8 encoding

### 5.2 Required Headers

- `Authorization` header with bearer token for authenticated routes
- `X-Correlation-ID` on all state-changing requests; generated by the platform if absent
- `Idempotency-Key` on required idempotent create or action routes

### 5.3 Field Naming

- JSON field names use snake_case
- Timestamps use ISO-8601 in UTC unless a business timezone field is explicitly returned alongside them
- Booleans use `true` and `false`
- Enumerations use documented uppercase or lowercase values consistently per resource; values may not vary for the same field across endpoints

### 5.4 Validation Rules

- FastAPI request models and query models must validate all inputs
- Unknown request body fields should be rejected for mutation endpoints
- Server-managed fields such as `id`, `organization_id`, `created_at`, `updated_at`, and audit metadata must not be client writable
- Query parameters and payload fields must be allowlisted per endpoint; no arbitrary field execution is permitted

### 5.5 Concurrency Rules

- Mutable configuration, workflow, and template resources should support optimistic concurrency through a version field or ETag-based precondition
- When concurrency protection is enabled, stale updates must be rejected with a conflict response

---

## 6. Response Standards

### 6.1 Success Envelope

Single-resource responses should use:

```text
{
  data,
  meta
}
```

Collection responses should use:

```text
{
  data,
  meta,
  links
}
```

### 6.2 Response Metadata

`meta` should include, where relevant:

- `correlation_id`
- `timestamp`
- `api_version`
- `pagination`
- `filters_applied`
- `sort_applied`

### 6.3 Collection Links

`links` should include pagination links when pagination applies:

- `self`
- `next`
- `prev` when supported

### 6.4 Representation Rules

- Responses must never expose internal secrets, credentials, or implementation-only fields
- `organization_id` may be included where it is part of the business resource, but it must never be trusted from clients for tenant switching
- Append-only audit and event resources must surface immutable records
- Soft-deleted records must not appear in standard collection responses unless the endpoint explicitly supports authorized historical access

---

## 7. Error Handling Standards

### 7.1 Error Envelope

Errors use a consistent structure:

```text
{
  error: {
    code,
    message,
    details,
    correlation_id,
    timestamp
  }
}
```

### 7.2 Error Code Rules

- Error codes are stable, machine-readable, and uppercase with underscores
- Error codes should describe the business or platform condition, not implementation internals
- Validation, authorization, conflict, and dependency failures must use distinct codes

Examples:

- `AUTHENTICATION_REQUIRED`
- `TOKEN_EXPIRED`
- `PERMISSION_DENIED`
- `TENANT_SCOPE_VIOLATION`
- `RESOURCE_NOT_FOUND`
- `VALIDATION_FAILED`
- `CONFLICT_DETECTED`
- `IDEMPOTENCY_REPLAY_MISMATCH`
- `RATE_LIMIT_EXCEEDED`

### 7.3 HTTP Status Mapping

- `200 OK` — successful read or action response
- `201 Created` — successful creation
- `202 Accepted` — accepted asynchronous processing
- `204 No Content` — successful delete or update with no body
- `400 Bad Request` — malformed request
- `401 Unauthorized` — missing or invalid authentication
- `403 Forbidden` — authenticated but not authorized
- `404 Not Found` — resource absent or not visible in tenant scope
- `409 Conflict` — state conflict, concurrency conflict, duplicate constraint, idempotency mismatch
- `422 Unprocessable Entity` — semantic validation failure
- `429 Too Many Requests` — rate limit exceeded
- `500 Internal Server Error` — unexpected server failure
- `503 Service Unavailable` — upstream dependency or maintenance condition

### 7.4 Security Rules

- Do not leak stack traces, SQL text, secret values, or infrastructure topology in responses
- Tenant existence must not be disclosed across authorization boundaries
- Error responses must include `correlation_id` for support and audit tracing

---

## 8. Pagination Standards

### 8.1 Default Strategy

- Cursor pagination is the default for collection endpoints
- Required parameters: `limit` and optional `cursor`
- Default `limit`: 50
- Maximum `limit`: 200 unless a documented endpoint requires a smaller cap

### 8.2 Stable Ordering

- Every paginated endpoint must define a deterministic sort order
- Cursor pagination must use an indexed, stable key set such as `created_at` plus `id`
- High-volume resources such as events, audit logs, messages, assets, and workflow executions must not use offset pagination as the primary strategy

### 8.3 Response Metadata

Pagination metadata should include:

- `limit`
- `next_cursor`
- `has_more`
- `count` when the endpoint can return it efficiently

---

## 9. Filtering Standards

### 9.1 General Rules

- Filtering is supported only on allowlisted fields
- Filter semantics must be documented per endpoint
- Tenant filtering by `organization_id` is enforced by the platform and may not be overridden by client input

### 9.2 Filter Syntax

Use query parameters in the format:

- `{field}__eq`
- `{field}__ne`
- `{field}__gt`
- `{field}__gte`
- `{field}__lt`
- `{field}__lte`
- `{field}__in`
- `{field}__contains`
- `{field}__is_null`

Examples:

- `?status__eq=ACTIVE`
- `?due_date__lte=2026-12-31`
- `?project_type__in=wedding,commercial`

### 9.3 Custom Field Filtering

Configuration-defined custom fields may be filterable only when:

- the field is explicitly marked filterable
- the field type supports indexed querying
- the caller has access to the field under data classification rules

---

## 10. Sorting Standards

### 10.1 Sort Syntax

Use a comma-separated `sort` query parameter.

- Ascending: `sort=created_at`
- Descending: `sort=-created_at`
- Multi-sort: `sort=status,-due_date`

### 10.2 Sort Rules

- Sorting is supported only on allowlisted fields
- Paginated endpoints must include a stable tie-breaker sort internally
- Sort behavior must be consistent across repeated requests for the same dataset and cursor window
- Sorting on computed or expensive unindexed fields should be prohibited on operational endpoints

---

## 11. Search Standards

### 11.1 Search Scope

- Search is always organization-scoped and permission-scoped
- Search may span only fields explicitly designated searchable
- Search must respect soft delete and visibility rules

### 11.2 Search Interface

- Free-text search uses the `q` query parameter
- Optional scoping filters may be combined with `q`
- Search results must clearly state the resource type when an endpoint supports multi-entity search

### 11.3 Search Implementation Expectations

- PostgreSQL full-text search, trigram indexes, or purpose-built indexed search patterns are the source of truth for operational search
- Redis may be used for caching search metadata or transient acceleration, but not as the canonical data source
- Search ranking behavior must be documented when relevance ordering is used

---

## 12. Authentication Standards

### 12.1 Token Model

- CBOS uses JWT bearer tokens for stateless API authentication
- Access tokens are short-lived
- Refresh tokens are long-lived and stored server-side in Redis for revocation and session control
- Token refresh endpoints must rotate refresh tokens on use where session policy requires it

### 12.2 Required Claims

JWT claims must include at minimum:

- `user_id`
- `organization_id`
- `email`
- `roles`
- `permissions`
- `issued_at`
- `expires_at`

### 12.3 Authentication Rules

- All authenticated routes require a valid bearer token
- Tokens must be signed with platform-managed secrets or keys
- Tokens may not be passed in query parameters
- MFA should be enforced for privileged administrative actions
- Revoked refresh tokens must be rejected through Redis-backed validation

---

## 13. Authorization Standards

### 13.1 Authorization Layers

CBOS authorization is mandatory at three layers:

1. **Organization Scope** — the request may access only the JWT-bound organization
2. **RBAC Permission Check** — the caller must hold the required permission code
3. **Resource Visibility Check** — team, role, entity, subscription, or data-classification constraints must be enforced where applicable

### 13.2 Enforcement Rules

- Authorization checks occur before business mutation is executed
- Repository and service layers must never allow unscoped data access
- PostgreSQL row-level security is the defense-in-depth backstop for tenant isolation
- Sensitive operations such as finance mutations, approval actions, workflow rollback, and template installation require explicit permissions
- Authorization defaults to deny when policy is missing or ambiguous

---

## 14. Idempotency Standards

### 14.1 Required Use Cases

Idempotency is required for:

- resource creation that may be retried by clients
- payment, billing, and refund requests
- workflow trigger and manual intervention actions
- outbound communication actions that could duplicate customer impact
- webhook ingestion endpoints receiving retries from external systems
- template installation and upgrade actions

### 14.2 Key Rules

- Clients send `Idempotency-Key` as a unique opaque value
- Keys are scoped by organization, authenticated actor or integration identity, route, and request intent
- The platform stores idempotency state in Redis with durable persistence in PostgreSQL where the business action requires longer retention or audit traceability
- Replays of the same key with a different payload must be rejected with conflict
- A successful replay returns the original effective result, not a duplicate side effect

### 14.3 Native Idempotent Methods

- `GET`, `PUT`, and `DELETE` should remain semantically idempotent by contract
- `PATCH` is not assumed idempotent unless the endpoint contract explicitly guarantees it

---

## 15. Audit Requirements

### 15.1 Mandatory Audit Events

The platform must audit:

- create, update, delete, restore actions
- publish, archive, rollback, retry, cancel, approve, reject actions
- authentication success and failure
- permission-denied events
- sensitive data access where policy requires logging
- template installation, upgrade, rollback, and uninstall
- file upload finalization and share-link generation

### 15.2 Audit Record Contents

Every audit record must capture:

- `actor_id`
- `organization_id`
- `entity_type`
- `entity_id`
- `action`
- `timestamp`
- `before_state`
- `after_state`
- `reason`
- `correlation_id`

### 15.3 Audit Integrity

- Audit records are immutable
- Audit records are append-only and excluded from normal soft delete behavior
- Workflow runtime history uses workflow execution events as the execution audit trail
- Audit retention for finance, billing, and security events must meet stricter compliance retention policies

---

## 16. Event Publishing Requirements

### 16.1 Publish-on-Commit Rule

- Every meaningful state-changing API must publish its domain event only after the database transaction commits successfully
- No event may be emitted for a failed or rolled-back mutation

### 16.2 Event Envelope

Published events must include:

- `event_id`
- `event_type`
- `occurred_at`
- `organization_id`
- `actor_id`
- `aggregate_type`
- `aggregate_id`
- `version`
- `payload`
- `correlation_id`

### 16.3 Delivery Rules

- Guaranteed-delivery events use durable asynchronous processing backed by Redis/Celery
- Advisory events may use lightweight pub/sub delivery
- Event consumers must treat events as versioned contracts
- Event publishing must remain tenant-isolated end to end
- External webhook emission is downstream of domain event publication, not a substitute for it

---

## 17. File Upload Standards

### 17.1 Upload Model

CBOS uses a metadata-first, object-storage-backed upload model.

1. Client requests an upload session from the API
2. API validates intent and returns a scoped pre-signed upload target
3. Client uploads binary content directly to object storage
4. Client finalizes the upload through the API
5. Background processing performs virus scan, metadata extraction, and derivative generation

### 17.2 Storage Rules

- Binary content is not stored in PostgreSQL
- PostgreSQL stores metadata only: storage path, size, mime type, checksum, ownership, and processing state
- Object paths must be prefixed by `organization_id` and further partitioned by asset ownership model

### 17.3 Validation Rules

- File size, mime type, extension, and checksum must be validated
- Dangerous or unsupported content types must be rejected
- Upload finalization must not mark the asset usable until validation and required scanning complete
- Download access is via short-lived pre-signed URLs only

---

## 18. Webhook Standards

### 18.1 Inbound Webhooks

- Inbound webhook endpoints must authenticate the sender using signed secrets, mTLS, or equivalent integration credentials
- Every inbound webhook must validate signature, timestamp freshness, and replay protection
- Inbound deliveries must be idempotent
- Accepted webhook payloads should be acknowledged quickly and processed asynchronously when heavy work is required

### 18.2 Outbound Webhooks

- Outbound webhooks are emitted from stable domain events
- Payloads must include `event_id`, `event_type`, `occurred_at`, `organization_id`, `version`, and the event payload body
- Deliveries must be signed
- Retry policy, delivery status, and failure reason must be tracked per attempt
- Repeated permanent failure must move the delivery to a reviewable dead-letter state

### 18.3 Webhook Security and Governance

- Webhook subscriptions are organization-scoped
- Secrets must be encrypted at rest
- Webhook configuration changes require audit logging
- Webhook payloads must not include secrets or data outside the subscriber's authorization scope

---

## 19. Rate Limiting Standards

### 19.1 Scope

Rate limiting is enforced at the API gateway and application edge using Redis-backed counters or sliding windows.

Limits should be scoped by:

- `organization_id`
- `user_id`
- integration identity for machine callers
- IP address for unauthenticated or public endpoints

### 19.2 Policy Rules

- Different endpoint classes may have different limits
- Authentication, search, webhook ingestion, file-upload session creation, and export endpoints require explicit policies
- Burst and sustained limits should both be considered for high-cost routes
- Platform operators may apply emergency throttles to protect stability

### 19.3 Client Feedback

When limits are enforced, responses should provide:

- `429 Too Many Requests`
- retry timing guidance
- rate-limit headers describing limit, remaining budget, and reset window where safe to expose

---

## 20. Deprecation Strategy

### 20.1 Deprecation Rules

- Endpoints, fields, query parameters, and webhook/event contract elements may be deprecated before removal
- Deprecation must be documented in the API reference and release notes
- Deprecated contracts must provide a migration path and sunset date

### 20.2 Notification Mechanisms

Deprecation notices should use:

- documentation updates
- changelog entries
- `Deprecation` response header where supported
- `Sunset` response header for scheduled retirement
- platform notifications for affected integrations when impact is material

### 20.3 Removal Rules

- Breaking removals occur only in a new major API version, except in emergency security situations
- Deprecated items must remain functional for the published support window
- Event and webhook schema removals require version migration support rather than silent field deletion

---

## Constitutional Statement

CBOS APIs shall remain versioned, organization-scoped, resource-oriented, event-driven, audit-ready, secure by default, and industry-agnostic.
