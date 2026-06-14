# CBOS Sprint 01 Foundation Plan

## Version 1.0

## 1. Sprint Goal

Establish the CBOS production foundation as a multi-tenant, project-centric, metadata-driven platform baseline with secure organization-scoped APIs, core RBAC enforcement, configuration primitives, and workflow execution primitives.

## 2. Sprint Scope

This sprint delivers implementation planning for foundational platform capabilities using:

- FastAPI
- SQLAlchemy (async)
- PostgreSQL
- Alembic
- Redis
- React
- TypeScript
- Ant Design

In scope:

- Core tenant and identity foundation
- Core project and client ownership backbone
- Configuration engine phase-1 primitives
- Workflow engine definition/execution primitives
- RBAC and authorization enforcement foundation
- API standards-compliant v1 resource contracts
- Baseline audit, event, and observability hooks

Out of scope:

- Industry-specific hardcoded logic
- Advanced AI autonomy actions
- Full template marketplace rollout
- Non-foundational microservice extraction

## 3. Modules

1. **Identity & Access Foundation**
   - Users, roles, permissions, user-role assignment, team membership baseline
2. **Organization Foundation**
   - Organization, branches, tenancy bootstrap, organization configuration context
3. **Client & Project Backbone**
   - Clients, contacts, engagements, projects, project status lifecycle baseline
4. **Configuration Engine Foundation**
   - Project types, field definitions, status definitions, form definitions (phase-1/2 baseline)
5. **Workflow Engine Foundation**
   - Workflow definition, versioning, triggers, conditions, actions, execution tracking
6. **RBAC & Scope Resolution**
   - Organization/branch/team/project scope checks, default-deny authorization model
7. **Audit & Domain Event Foundation**
   - Standardized audit events and domain event publishing after commit
8. **Frontend Shell Foundation**
   - Authenticated app shell, tenant-aware API client, metadata-ready form/list views

## 4. Database Entities

### Identity / RBAC
- User
- Role
- Permission
- UserRole
- Team
- UserTeam
- RolePermission
- PermissionSet
- PermissionSetItem
- BranchAccess
- ProjectAccess
- Delegation
- ApprovalChain
- ApprovalChainStep
- AuditEvent

### Organization / Core
- Organization
- Branch
- BillingAccount
- Subscription

### CRM / Client / Project Backbone
- Lead
- Opportunity
- Client
- Contact
- Engagement
- Project
- SubProject
- Task

### Configuration Engine
- ConfigurationPackage
- ProjectType
- FieldDefinition
- FieldOption
- FieldValue
- StatusDefinition
- FormDefinition
- FormField
- FormSubmission

### Workflow Engine
- WorkflowDefinition
- WorkflowVersion
- WorkflowTrigger
- WorkflowConditionGroup
- WorkflowCondition
- WorkflowAction
- WorkflowTransitionRule
- WorkflowExecution
- WorkflowExecutionStep
- WorkflowExecutionEvent
- WorkflowRetry
- DeadLetterEntry
- WorkflowApproval

### Event / Observability
- DomainEvent

## 5. Backend Deliverables

1. FastAPI modular domain structure aligned to bounded contexts
2. SQLAlchemy models and Alembic migrations for Sprint 01 entities
3. Organization-scoped repository and service patterns with mandatory tenant filters
4. JWT authentication with Redis-backed refresh token/session revocation
5. RBAC guard framework enforcing permission checks before mutations
6. CRUD and lifecycle endpoints for:
   - Organizations, branches
   - Users, roles, permission sets
   - Clients, engagements, projects
   - Configuration entities
   - Workflow definitions, versions, executions
7. Domain event publishing contract (post-commit only) with standard envelope
8. Workflow execution queue integration (Redis/Celery) with retry and dead-letter handling baseline
9. Audit logging pipeline for security-relevant and state-changing actions
10. OpenAPI v1 documentation generated from FastAPI routes

## 6. Frontend Deliverables

1. React + TypeScript tenant-aware application shell
2. Authentication flows and protected route handling
3. RBAC-aware navigation and route guards
4. Ant Design-based foundational UI screens:
   - Organization and branch management
   - User, role, and permission assignment
   - Client and project listing/details
   - Configuration definitions (project types, fields, statuses, forms)
   - Workflow definitions and execution monitoring
5. Shared API client layer with JWT handling, correlation ID support, and standardized error handling
6. Metadata-driven form rendering foundation for configuration-backed UI
7. Baseline workflow execution status views (running, waiting, succeeded, failed, dead-lettered)

## 7. APIs

All APIs must follow `/api/v1` path versioning, organization-scoped authorization, and standardized envelopes.

### Foundation API Groups
- `/api/v1/auth/*`
- `/api/v1/organizations`
- `/api/v1/branches`
- `/api/v1/users`
- `/api/v1/roles`
- `/api/v1/permissions`
- `/api/v1/permission-sets`
- `/api/v1/teams`
- `/api/v1/clients`
- `/api/v1/contacts`
- `/api/v1/engagements`
- `/api/v1/projects`
- `/api/v1/project-types`
- `/api/v1/field-definitions`
- `/api/v1/status-definitions`
- `/api/v1/form-definitions`
- `/api/v1/workflow-definitions`
- `/api/v1/workflow-definitions/{workflow_definition_id}/versions`
- `/api/v1/workflow-definitions/{workflow_definition_id}/publish`
- `/api/v1/workflow-definitions/{workflow_definition_id}/rollback`
- `/api/v1/workflow-executions`
- `/api/v1/workflow-executions/{workflow_execution_id}/retry`
- `/api/v1/audit-events` (authorized read scope only)

### API Standards Enforcement
- JWT bearer authentication for protected routes
- Default deny authorization policy
- Cursor-based pagination for high-volume resources
- Allowlisted filtering and sorting
- Idempotency-Key support for sensitive create/action endpoints
- Consistent error envelope with correlation ID

## 8. Security Requirements

1. Mandatory organization boundary validation on every request and permission evaluation
2. RBAC enforcement with explicit permission mapping per endpoint
3. Defense-in-depth with PostgreSQL RLS on tenant-scoped tables
4. JWT short-lived access tokens and revocable refresh tokens (Redis-backed)
5. Encryption in transit (TLS) and at rest for sensitive data
6. Secrets management via runtime environment/secret manager only
7. Explicit approval gates for finance and other sensitive workflow actions
8. AI actions constrained to user permissions and explicit human confirmation for consequential operations
9. Immutable, organization-scoped audit logging for all security-relevant actions
10. Cross-tenant access attempts must be denied, logged, and alertable

## 9. Test Requirements

1. **Unit Tests**
   - Service logic, permission resolution, workflow condition/action evaluation, validation rules
2. **Integration Tests**
   - API ↔ DB ↔ Redis interactions, event publishing, workflow execution state transitions
3. **Authorization Tests**
   - Organization isolation, role/permission enforcement, scope inheritance and overrides
4. **API Contract Tests**
   - Request/response envelope compliance, error standards, pagination/filter/sort behavior
5. **Migration Tests**
   - Alembic forward/backward migration safety for foundational schemas
6. **Workflow Reliability Tests**
   - Retry behavior, dead-letter transitions, manual intervention paths
7. **Security Tests**
   - Authentication failure cases, token expiry/revocation, injection and input validation checks
8. **Frontend Tests**
   - Route guards, RBAC-driven UI visibility, metadata-driven rendering, API error handling

## 10. Exit Criteria

Sprint 01 is complete only when all criteria are met:

1. Core foundation entities are migrated and tenant-scoped in PostgreSQL
2. All in-scope foundation APIs are implemented under `/api/v1` and documented in OpenAPI
3. Organization isolation is enforced in API, service, repository, and database layers
4. RBAC authorization is active with explicit endpoint permission declarations
5. Configuration and workflow foundation modules support create/read/update lifecycles with version-aware behavior
6. Workflow execution baseline supports trigger resolution, execution tracking, retries, and dead-lettering
7. Audit events are generated for all required security and state-changing actions
8. Frontend foundation screens are operational with authenticated, tenant-scoped flows
9. Required unit, integration, authorization, and contract tests pass for Sprint 01 scope
10. No constitutional violations against domain model, API standards, workflow rules, multi-tenancy, or RBAC architecture remain open

