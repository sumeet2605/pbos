# CBOS Sprint 1 Execution Plan

**Role:** CBOS Chief Engineer  
**Scope:** Work required to make EPIC-001 through EPIC-005 production ready  
**Basis:** Status gaps identified in `docs/EPIC_1_5_STATUS_REPORT.md`  
**Constraint:** No new architecture. No future epics. Implementation of documented specifications only.

---

## Execution Sequencing

The work is ordered by hard dependency. Nothing in EPIC-002 is testable without EPIC-001 completing. Nothing in EPIC-004 is enforceable without EPIC-002 completing. Audit (EPIC-005) requires all mutation endpoints from EPICs 002–003 to exist before meaningful coverage is achievable. Items within a phase may be parallelized across engineers.

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
Foundation  Identity  Org/CRM   RBAC      Audit     Frontend + Tests
```

---

## Phase 1 — Foundation Completion (EPIC-001)

### 1.1 Fix Configuration Security

**File:** `backend/app/core/config.py`

Add a startup validator that raises `RuntimeError` if `environment == "production"` and `secret_key == "change-me-in-production"`. This must execute in the `lifespan` function in `main.py`.

### 1.2 Mount All Domain Routers

**File:** `backend/app/main.py`

Import and mount all domain routers under `/api/v1`:

```
/api/v1/auth
/api/v1/organizations
/api/v1/branches
/api/v1/users
/api/v1/roles
/api/v1/permissions
/api/v1/permission-sets
/api/v1/teams
/api/v1/clients
/api/v1/contacts
/api/v1/engagements
/api/v1/projects
/api/v1/project-types
/api/v1/field-definitions
/api/v1/status-definitions
/api/v1/form-definitions
/api/v1/workflow-definitions
/api/v1/workflow-executions
/api/v1/audit-events
```

Routers will initially return `501 Not Implemented` until their phases are complete. This ensures OpenAPI documentation is immediately accurate.

### 1.3 Add Idempotency-Key Middleware

**New file:** `backend/app/core/idempotency.py`

Implement a FastAPI dependency (not middleware) that:
- Reads `Idempotency-Key` header on `POST` and sensitive action endpoints
- Checks Redis for a cached response keyed to `{org_id}:{idempotency_key}`
- Returns cached response if present (HTTP 200 with original payload)
- Stores the response in Redis with a 24-hour TTL after first execution

Apply the dependency to: `auth/register`, `auth/login`, all resource `POST` endpoints, `workflow-executions/retry`.

### 1.4 Extend BaseRepository

**File:** `backend/app/shared/repository.py`

Add the following methods to `BaseRepository`:
- `list_paginated(filters, order_by, cursor, page_size)` — cursor-based pagination
- `update(instance, **kwargs)` — partial update with `updated_at` refresh
- `exists(id)` — existence check without loading full object
- `get_by_id_scoped(id, organization_id)` — tenant-safe get-by-id that enforces `organization_id` match

### 1.5 Add Organization-Scoped Repository Base

**New file:** `backend/app/shared/tenant_repository.py`

Create `TenantScopedRepository(BaseRepository[ModelT])` that:
- Overrides all query methods to always apply `WHERE organization_id = :org_id`
- Raises `ForbiddenError` if a record is fetched and its `organization_id` does not match the caller's
- All domain repositories for tenant-scoped models must inherit from this class

### 1.6 Celery Application Init

**New file:** `backend/app/core/celery_app.py`

Initialize the Celery app with Redis broker/backend from settings. Register task autodiscovery for `app.*.tasks`. This is a prerequisite for the workflow execution queue (Sprint scope) and the domain event outbox dispatcher (EPIC-005).

### 1.7 Initial Alembic Migration Baseline

After all models in Phases 2–4 are defined, generate and review the first Alembic migration:

```
alembic revision --autogenerate -m "sprint01_initial_schema"
```

Verify the generated migration includes:
- All tenant-scoped tables carry `organization_id NOT NULL`
- All UUID primary keys
- All `created_at` / `updated_at` timestamp columns
- All foreign key constraints
- All indexes on `organization_id`, `email`, `slug`, and status columns

### 1.8 Docker Compose Validation

**File:** `docker-compose.yml`

Add `healthcheck` definitions for `postgres` and `redis` services. Add `depends_on` with `condition: service_healthy` to the backend service so it does not start before its dependencies are ready.

---

## Phase 2 — Identity (EPIC-002)

### 2.1 Identity SQLAlchemy Models

**New file:** `backend/app/identity/models.py`

Define the following models, all inheriting `BaseModel` and where applicable `TenantScopedMixin`:

| Model | Key Columns | Notes |
|---|---|---|
| `User` | `organization_id`, `email` (unique per org), `hashed_password`, `first_name`, `last_name`, `phone`, `status`, `is_superuser` | `status`: ACTIVE, INACTIVE, INVITED, SUSPENDED |
| `Role` | `organization_id`, `name`, `description`, `is_system` | `is_system=True` roles are immutable |
| `Permission` | `code` (globally unique), `description`, `resource`, `action` | Seeded, not org-scoped |
| `UserRole` | `user_id`, `role_id`, `organization_id`, `granted_by`, `granted_at`, `expires_at` | Composite unique on `(user_id, role_id, organization_id)` |
| `RolePermission` | `role_id`, `permission_id` | Composite unique on `(role_id, permission_id)` |
| `PermissionSet` | `organization_id`, `name`, `description` | |
| `PermissionSetItem` | `permission_set_id`, `permission_id` | |
| `Team` | `organization_id`, `name`, `manager_id` FK→User | |
| `UserTeam` | `user_id`, `team_id`, `role_in_team` | Composite unique on `(user_id, team_id)` |
| `BranchAccess` | `user_id`, `branch_id`, `organization_id`, `access_level` | |
| `ProjectAccess` | `user_id`, `project_id`, `organization_id`, `access_level` | |
| `Delegation` | `delegator_id`, `delegate_id`, `permission_set_id`, `valid_from`, `valid_until`, `organization_id` | |
| `ApprovalChain` | `organization_id`, `name`, `resource_type`, `action` | |
| `ApprovalChainStep` | `chain_id`, `step_order`, `approver_role_id`, `min_approvals` | |

### 2.2 Permission Registry Seed

**New file:** `backend/app/identity/permissions.py`

Define the canonical permission code catalog as Python constants. All permission codes follow the pattern `{resource}:{action}`. Minimum set:

```
org:read  org:update  org:delete
branch:create  branch:read  branch:update  branch:delete
user:create  user:read  user:update  user:delete  user:invite
role:create  role:read  role:update  role:delete
permission:read  permission:assign
team:create  team:read  team:update  team:delete  team:manage_members
client:create  client:read  client:update  client:delete
contact:create  contact:read  contact:update  contact:delete
engagement:create  engagement:read  engagement:update  engagement:delete
project:create  project:read  project:update  project:delete  project:manage
config:read  config:write
workflow:read  workflow:write  workflow:execute  workflow:manage
audit:read
```

Provide a seeder function that upserts all permission records on application startup.

### 2.3 JWT Service

**New file:** `backend/app/identity/jwt_service.py`

Implement using `python-jose`:
- `create_access_token(subject, organization_id, roles, permissions, expires_delta)` → signed JWT
- `create_refresh_token(subject, organization_id)` → opaque UUID stored in Redis with TTL
- `decode_access_token(token)` → claims dict or raises `UnauthorizedError`
- `revoke_refresh_token(token_id)` → deletes from Redis
- `is_refresh_token_valid(token_id)` → checks Redis existence

Access token payload must include: `sub` (user_id), `org_id`, `roles` (list), `jti` (token ID), `exp`, `iat`.

### 2.4 Auth Dependency

**New file:** `backend/app/identity/dependencies.py`

Implement `get_current_user` as a FastAPI dependency:
- Extracts `Authorization: ****** header
- Decodes JWT using `jwt_service.decode_access_token`
- Loads `User` from DB by `sub` claim; raises `UnauthorizedError` if not found or not ACTIVE
- Returns a `CurrentUser` dataclass: `id`, `organization_id`, `roles`, `permissions`

Implement `get_current_active_superuser` for platform-level admin operations.

### 2.5 Identity Schemas

**New file:** `backend/app/identity/schemas.py`

Pydantic v2 models for:
- `RegisterRequest`, `LoginRequest`, `TokenResponse`, `RefreshRequest`
- `UserCreate`, `UserUpdate`, `UserResponse`, `UserListResponse`
- `RoleCreate`, `RoleUpdate`, `RoleResponse`
- `PermissionResponse`
- `PermissionSetCreate`, `PermissionSetUpdate`, `PermissionSetResponse`
- `TeamCreate`, `TeamUpdate`, `TeamResponse`
- `UserRoleAssign`, `UserRoleRevoke`
- `RolePermissionAssign`

### 2.6 Identity Service

**New file:** `backend/app/identity/service.py`

Implement:
- `register_user(org_id, data)` — hash password, create user, assign default role
- `authenticate_user(email, password, org_id)` — verify credentials, return user
- `issue_tokens(user)` — create access + refresh token pair, store refresh in Redis
- `refresh_tokens(refresh_token)` — validate, revoke old, issue new pair
- `logout(refresh_token)` — revoke refresh token in Redis
- `get_user`, `list_users`, `update_user`, `deactivate_user`
- `create_role`, `update_role`, `delete_role`, `assign_permission_to_role`
- `assign_role_to_user`, `revoke_role_from_user`
- `create_team`, `update_team`, `add_team_member`, `remove_team_member`
- `create_permission_set`, `update_permission_set`

### 2.7 Identity Router

**File:** `backend/app/identity/router.py`

Implement all auth and identity endpoints. All mutating endpoints require `get_current_user`. All endpoints that modify roles/permissions require `require_permission("role:write")` (implemented in Phase 4).

Auth: `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me`

Users: `GET /users` · `POST /users` · `GET /users/{id}` · `PATCH /users/{id}` · `DELETE /users/{id}` · `GET /users/{id}/roles` · `POST /users/{id}/roles` · `DELETE /users/{id}/roles/{role_id}`

Roles: `GET /roles` · `POST /roles` · `GET /roles/{id}` · `PATCH /roles/{id}` · `DELETE /roles/{id}` · `GET /roles/{id}/permissions` · `POST /roles/{id}/permissions` · `DELETE /roles/{id}/permissions/{permission_id}`

Permissions: `GET /permissions`

Permission Sets: `GET /permission-sets` · `POST /permission-sets` · `GET /permission-sets/{id}` · `PATCH /permission-sets/{id}` · `DELETE /permission-sets/{id}`

Teams: `GET /teams` · `POST /teams` · `GET /teams/{id}` · `PATCH /teams/{id}` · `POST /teams/{id}/members` · `DELETE /teams/{id}/members/{user_id}`

---

## Phase 3 — Organization & CRM (EPIC-003)

### 3.1 Organization SQLAlchemy Models

**New file:** `backend/app/organizations/models.py`

| Model | Key Columns | Notes |
|---|---|---|
| `Organization` | `name`, `slug` (globally unique), `industry_type`, `timezone`, `currency`, `subscription_plan`, `status` | No `organization_id` FK (root entity) |
| `Branch` | `organization_id`, `name`, `address`, `city`, `state`, `country`, `is_headquarters` | |
| `BillingAccount` | `organization_id`, `provider`, `provider_customer_id`, `status` | |
| `Subscription` | `organization_id`, `plan`, `status`, `current_period_start`, `current_period_end` | |

**New file:** `backend/app/organizations/crm_models.py`

| Model | Key Columns | Notes |
|---|---|---|
| `Lead` | `organization_id`, `source`, `name`, `email`, `phone`, `status`, `assigned_to` | status: NEW, CONTACTED, QUALIFIED, PROPOSAL, WON, LOST |
| `Opportunity` | `lead_id`, `organization_id`, `estimated_value`, `probability`, `expected_close_date` | Must add `organization_id` (not in entity model doc — apply constitutional rule) |
| `Client` | `organization_id`, `type`, `name`, `email`, `phone`, `status` | |
| `Contact` | `client_id`, `organization_id`, `name`, `email`, `phone`, `designation` | `organization_id` must be added (constitutional rule) |
| `Engagement` | `client_id`, `organization_id`, `title`, `status`, `start_date`, `end_date` | `organization_id` **must** be added — architectural gap documented in `99_ARCHITECTURE_GAP_ANALYSIS.md` §1.2 |
| `Project` | `engagement_id`, `organization_id`, `branch_id`, `project_code`, `project_name`, `project_type_id`, `status`, `start_date`, `due_date` | `engagement_id` optional per ERD frozen decision |
| `SubProject` | `parent_project_id`, `organization_id`, `name`, `status` | |
| `Task` | `project_id`, `organization_id`, `assigned_to`, `priority`, `due_date`, `status` | |

### 3.2 Organization Schemas

**New file:** `backend/app/organizations/schemas.py`

Pydantic v2 schemas for create/update/response for: `Organization`, `Branch`, `Client`, `Contact`, `Engagement`, `Project`, `SubProject`, `Task`, `Lead`, `Opportunity`.

### 3.3 Organization Service

**New file:** `backend/app/organizations/service.py`

Implement CRUD and lifecycle for all organization and CRM entities. All list operations must accept `organization_id` from the caller's JWT claims (never from request body) and apply it as the mandatory tenant filter.

Include:
- `bootstrap_organization(name, slug, admin_email, admin_password)` — atomic: creates org, default branch, admin user, seeds system roles. Called once during setup. Gated to superuser or first-time init.
- `get_organization`, `update_organization`
- `create_branch`, `get_branch`, `list_branches`, `update_branch`, `delete_branch`
- `create_client`, `get_client`, `list_clients`, `update_client`, `archive_client`
- `create_contact`, `get_contact`, `list_contacts`, `update_contact`
- `create_engagement`, `get_engagement`, `list_engagements`, `update_engagement`
- `create_project`, `get_project`, `list_projects`, `update_project`, `transition_project_status`, `archive_project`
- `create_task`, `list_tasks`, `update_task`, `complete_task`

### 3.4 Organization Router

**File:** `backend/app/organizations/router.py`

Implement all endpoints. All endpoints require `get_current_user`. Tenant scope (`organization_id`) is always taken from the JWT, never from the caller.

Organizations: `GET /organizations/{id}` · `PATCH /organizations/{id}`

Branches: `GET /branches` · `POST /branches` · `GET /branches/{id}` · `PATCH /branches/{id}` · `DELETE /branches/{id}`

Clients: `GET /clients` · `POST /clients` · `GET /clients/{id}` · `PATCH /clients/{id}` · `DELETE /clients/{id}`

Contacts: `GET /contacts` · `POST /contacts` · `GET /contacts/{id}` · `PATCH /contacts/{id}`

Engagements: `GET /engagements` · `POST /engagements` · `GET /engagements/{id}` · `PATCH /engagements/{id}`

Projects: `GET /projects` · `POST /projects` · `GET /projects/{id}` · `PATCH /projects/{id}` · `DELETE /projects/{id}` · `POST /projects/{id}/transition`

---

## Phase 4 — RBAC Enforcement (EPIC-004)

### 4.1 Permission Resolution Service

**New file:** `backend/app/rbac/service.py`

Implement `PermissionResolver`:
- `resolve_effective_permissions(user_id, organization_id)` → set of permission codes
  - Loads all `UserRole` records for the user+org
  - Loads all `RolePermission` records for those roles
  - Checks `BranchAccess` and `ProjectAccess` for scope overrides
  - Checks active `Delegation` records
  - Returns the union of all permission codes as a frozenset
- Cache the result in Redis with a 5-minute TTL keyed to `perms:{user_id}:{org_id}`
- Invalidate the cache on role assignment, role revocation, and permission set changes

### 4.2 RBAC Guard Dependency

**New file:** `backend/app/rbac/dependencies.py`

Implement:
- `require_permission(code: str)` — FastAPI dependency factory that:
  - Calls `get_current_user` to get the authenticated user
  - Calls `PermissionResolver.resolve_effective_permissions`
  - Raises `ForbiddenError` if the required code is not in the effective set
  - Records the permission check in the audit pipeline (see Phase 5)
- `require_org_member` — validates that the `organization_id` in any path parameter matches the JWT `org_id`
- `require_any_permission(*codes)` — OR logic for multi-permission checks
- `require_all_permissions(*codes)` — AND logic

### 4.3 Apply RBAC Guards to All Endpoints

Apply `require_permission` to every mutation endpoint across all domain routers. The required permission codes per endpoint are:

| Endpoint Pattern | Required Permission |
|---|---|
| `POST /organizations` | Superuser only |
| `PATCH /organizations/{id}` | `org:update` |
| `POST /branches` | `branch:create` |
| `PATCH /branches/{id}` | `branch:update` |
| `DELETE /branches/{id}` | `branch:delete` |
| `POST /users` | `user:create` |
| `PATCH /users/{id}` | `user:update` |
| `DELETE /users/{id}` | `user:delete` |
| `POST /users/{id}/roles` | `permission:assign` |
| `DELETE /users/{id}/roles/{role_id}` | `permission:assign` |
| `POST /roles` | `role:create` |
| `PATCH /roles/{id}` | `role:update` |
| `DELETE /roles/{id}` | `role:delete` |
| `POST /roles/{id}/permissions` | `permission:assign` |
| `POST /teams` | `team:create` |
| `PATCH /teams/{id}` | `team:update` |
| `POST /teams/{id}/members` | `team:manage_members` |
| `POST /clients` | `client:create` |
| `PATCH /clients/{id}` | `client:update` |
| `DELETE /clients/{id}` | `client:delete` |
| `POST /engagements` | `engagement:create` |
| `PATCH /engagements/{id}` | `engagement:update` |
| `POST /projects` | `project:create` |
| `PATCH /projects/{id}` | `project:update` |
| `DELETE /projects/{id}` | `project:delete` |
| `POST /projects/{id}/transition` | `project:manage` |
| `POST /workflow-definitions` | `workflow:write` |
| `POST /workflow-executions` | `workflow:execute` |
| `GET /audit-events` | `audit:read` |

### 4.4 RBAC Router

**File:** `backend/app/rbac/router.py`

Expose permission set management endpoints. These were not placed in the identity router because RBAC management is a distinct concern:

`GET /permission-sets` · `POST /permission-sets` · `GET /permission-sets/{id}` · `PATCH /permission-sets/{id}` · `DELETE /permission-sets/{id}`

### 4.5 Default Role Seeder

**New file:** `backend/app/rbac/seeds.py`

Define and seed the default system roles executed during `bootstrap_organization`:

| Role | Permissions |
|---|---|
| `SystemAdmin` | All permissions |
| `OrgAdmin` | All org-scoped permissions except `org:delete` |
| `ProjectManager` | `project:*`, `client:read`, `engagement:read`, `user:read`, `team:read` |
| `TeamMember` | `project:read`, `client:read`, `task:*` |
| `Auditor` | `audit:read` + all `:read` permissions |

### 4.6 PostgreSQL RLS Policies

Add RLS policies via Alembic migration for all tenant-scoped tables. The migration must:
- Enable RLS on each table: `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY`
- Create a policy: `CREATE POLICY tenant_isolation ON {table} USING (organization_id = current_setting('app.organization_id')::uuid)`
- The application must set `SET app.organization_id = '{org_id}'` at the start of each DB session via a SQLAlchemy event listener

**New file:** `backend/app/core/rls.py`

SQLAlchemy event listener that executes `SET app.organization_id` on connection checkout.

---

## Phase 5 — Audit & Events (EPIC-005)

### 5.1 Audit & Event SQLAlchemy Models

**New file:** `backend/app/audit/models.py`

`AuditEvent`:
- `id` (UUID PK)
- `organization_id` (NOT NULL, indexed)
- `actor_id` (FK→User, nullable for system events)
- `actor_email` (denormalized for forensic integrity)
- `resource_type` (e.g., `User`, `Project`, `Role`)
- `resource_id` (UUID of affected resource)
- `action` (e.g., `created`, `updated`, `deleted`, `login`, `logout`, `permission_assigned`)
- `before_state` (JSONB, nullable)
- `after_state` (JSONB, nullable)
- `ip_address`
- `user_agent`
- `correlation_id`
- `occurred_at` (timestamp, server default)

No `updated_at`. This table is INSERT-only. Add a PostgreSQL trigger that raises an exception on UPDATE or DELETE.

**New file:** `backend/app/events/models.py`

`DomainEvent` (outbox):
- `id` (UUID PK)
- `organization_id`
- `event_type` (e.g., `project.created`, `user.invited`)
- `aggregate_type`
- `aggregate_id`
- `payload` (JSONB)
- `status` (`PENDING`, `DISPATCHED`, `FAILED`, `DEAD_LETTERED`)
- `retry_count`
- `next_retry_at`
- `dispatched_at`
- `occurred_at`
- `correlation_id`

### 5.2 Audit Logger Service

**New file:** `backend/app/audit/service.py`

`AuditLogger`:
- `log(session, actor, resource_type, resource_id, action, before=None, after=None, request=None)` — creates `AuditEvent` in the same DB session as the originating transaction. Must be called **within the transaction**, not after commit.
- `list_events(org_id, filters, cursor, page_size)` — paginated read with org-scope enforcement

Apply audit logging to all security-relevant and state-changing actions:
- User login / logout / failed login
- User created / updated / deactivated
- Role created / updated / deleted
- Permission assigned / revoked
- Organization updated
- Branch created / updated / deleted
- Client / Engagement / Project created / updated / deleted
- Project status transitioned
- Workflow definition published / rolled back
- Workflow execution started / completed / failed

### 5.3 Domain Event Publisher

**New file:** `backend/app/events/publisher.py`

`DomainEventPublisher`:
- `publish(session, event_type, aggregate_type, aggregate_id, payload, org_id)` — inserts a `DomainEvent` row with `status=PENDING` in the current DB session (outbox pattern — event is written atomically with the originating transaction)
- Events are NOT dispatched in the service call; they are dispatched by the outbox poller

**New file:** `backend/app/events/tasks.py`

Celery task `dispatch_pending_events`:
- Polls for `DomainEvent` rows with `status=PENDING` and `next_retry_at <= now()`
- Dispatches each event (initially: writes to a Redis list / Celery task per event type)
- Marks as `DISPATCHED` on success
- Increments `retry_count`, sets `next_retry_at` with exponential backoff on failure
- After 5 retries, marks as `DEAD_LETTERED`

Schedule this task via Celery Beat every 10 seconds.

### 5.4 Audit Router

**File:** `backend/app/audit/router.py`

`GET /audit-events` — paginated, filterable by: `actor_id`, `resource_type`, `resource_id`, `action`, `occurred_at_from`, `occurred_at_to`. Requires `audit:read` permission. Always org-scoped.

`GET /audit-events/{id}` — single event detail. Requires `audit:read` permission.

### 5.5 Audit Immutability Enforcement

Add an Alembic migration that creates a PostgreSQL trigger on `audit_events`:

```sql
CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_events records are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_events_immutable
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();
```

---

## Phase 6 — Frontend Domain Screens

### 6.1 Auth Screens

**New files:** `frontend/src/pages/auth/`

- `LoginPage.tsx` — email/password form, calls `POST /auth/login`, stores `access_token` in memory (not localStorage — use `httpOnly` cookie or in-memory store; current localStorage approach is a known XSS risk that must be addressed), redirects to dashboard
- `AuthContext.tsx` — React context providing `currentUser`, `isAuthenticated`, `login()`, `logout()`, `refresh()`
- Update `frontend/src/api/client.ts` to read token from context, not `localStorage`

### 6.2 Protected Route Guard

**File:** `frontend/src/routes/router.tsx`

Create `ProtectedRoute` component that:
- Checks `isAuthenticated` from `AuthContext`
- Redirects to `/login` if not authenticated
- Wraps all non-auth routes

### 6.3 RBAC-Aware Navigation

**File:** `frontend/src/components/layout/AppShell.tsx`

Update `menuItems` to be generated from the current user's permissions. Hide menu items for resources the user cannot read.

Add all navigation entries:
- Dashboard
- Organization Settings (requires `org:read`)
- Users (requires `user:read`)
- Roles & Permissions (requires `role:read`)
- Teams (requires `team:read`)
- Clients (requires `client:read`)
- Engagements (requires `engagement:read`)
- Projects (requires `project:read`)
- Configuration (requires `config:read`)
- Workflows (requires `workflow:read`)
- Audit Log (requires `audit:read`)

### 6.4 Organization & Branch Screens

**New files:** `frontend/src/pages/organization/`

- `OrganizationSettingsPage.tsx` — view/edit org details
- `BranchListPage.tsx` — list with create button
- `BranchDetailPage.tsx` — view/edit/delete

### 6.5 Identity Screens

**New files:** `frontend/src/pages/identity/`

- `UserListPage.tsx` — paginated user list, invite button
- `UserDetailPage.tsx` — view/edit user, role assignment panel
- `RoleListPage.tsx` — list roles, create role button
- `RoleDetailPage.tsx` — role name/description + permission assignment grid (checkbox matrix)
- `TeamListPage.tsx` — list teams
- `TeamDetailPage.tsx` — team detail + member management

### 6.6 CRM Screens

**New files:** `frontend/src/pages/crm/`

- `ClientListPage.tsx` — paginated client list with search and create
- `ClientDetailPage.tsx` — client details, contacts list, engagements list
- `EngagementDetailPage.tsx` — engagement details, projects list
- `ProjectListPage.tsx` — all projects in org, filterable by status and branch
- `ProjectDetailPage.tsx` — project details, status lifecycle control, tasks list

### 6.7 Audit Screen

**New files:** `frontend/src/pages/audit/`

- `AuditLogPage.tsx` — paginated audit event table, filterable by actor, resource type, action, date range
- `AuditEventDetailPage.tsx` — before/after state diff view

### 6.8 Shared Frontend Utilities

**New files:** `frontend/src/hooks/`

- `usePermission(code)` — returns boolean; reads from `AuthContext`
- `useCurrentOrg()` — returns current organization ID from JWT claims

**New file:** `frontend/src/components/common/PermissionGate.tsx`

Wrapper component: renders `children` only if `usePermission(requiredPermission)` returns true. Used to conditionally render action buttons.

---

## Phase 7 — Test Coverage

### 7.1 Unit Tests

**Directory:** `backend/tests/unit/`

- `test_jwt_service.py` — token creation, decode, expiry, revocation
- `test_password_service.py` — hash and verify
- `test_permission_resolver.py` — resolution chain: user → role → permission
- `test_tenant_repository.py` — org-scope enforcement, cross-tenant rejection
- `test_audit_logger.py` — event construction, immutability
- `test_domain_event_publisher.py` — outbox insertion, retry logic
- `test_idempotency.py` — cache hit/miss, TTL behavior

### 7.2 Integration Tests

**Directory:** `backend/tests/integration/`

- `test_auth_flow.py` — register, login, refresh, logout, re-use revoked token
- `test_organization_crud.py` — org + branch CRUD with tenant isolation
- `test_client_project_lifecycle.py` — client → engagement → project → status transitions
- `test_rbac_enforcement.py` — endpoints return 403 without permission, 200 with permission
- `test_audit_events.py` — audit rows created for all required actions, immutability enforced
- `test_domain_events.py` — outbox rows created post-commit, dispatched by Celery task
- `test_workflow_definitions.py` — create definition, version, publish, rollback

### 7.3 Authorization Tests

**Directory:** `backend/tests/authorization/`

- `test_cross_tenant_isolation.py` — user in org A cannot read, update, or delete resources from org B at API, service, and repository layers
- `test_default_deny.py` — unauthenticated requests to all protected endpoints return 401
- `test_permission_scope.py` — role without permission returns 403; role with permission returns 200
- `test_branch_access_override.py` — `BranchAccess` grants/restricts appropriately
- `test_delegation_expiry.py` — delegated permissions are inactive after `valid_until`

### 7.4 Migration Tests

- `test_migrations.py` — `alembic upgrade head` and `alembic downgrade base` complete without error
- Verify all org-scoped tables have `organization_id NOT NULL`
- Verify audit_events immutability trigger fires on UPDATE/DELETE

### 7.5 Security Tests

- `test_expired_token.py` — expired access token returns 401
- `test_revoked_token.py` — revoked refresh token returns 401
- `test_injection.py` — SQL-like inputs in filter parameters are handled safely by SQLAlchemy parameterization

---

## Execution Checklist

### Phase 1 — Foundation (prerequisite for all)
- [ ] 1.1 Add production secret_key startup validation
- [ ] 1.2 Mount all domain routers (501 stubs) in main.py
- [ ] 1.3 Implement idempotency-key dependency
- [ ] 1.4 Extend BaseRepository (list_paginated, update, exists, get_by_id_scoped)
- [ ] 1.5 Implement TenantScopedRepository
- [ ] 1.6 Initialize Celery application
- [ ] 1.7 Generate and validate initial Alembic migration (after Phase 2–4 models complete)
- [ ] 1.8 Add Docker Compose health checks

### Phase 2 — Identity
- [ ] 2.1 Define all identity SQLAlchemy models
- [ ] 2.2 Seed permission registry
- [ ] 2.3 Implement JWT service
- [ ] 2.4 Implement get_current_user dependency
- [ ] 2.5 Write identity Pydantic schemas
- [ ] 2.6 Implement identity service
- [ ] 2.7 Implement identity router with all endpoints

### Phase 3 — Organization & CRM
- [ ] 3.1 Define organization and CRM SQLAlchemy models (with Engagement.organization_id fix)
- [ ] 3.2 Write organization Pydantic schemas
- [ ] 3.3 Implement organization service (including bootstrap_organization)
- [ ] 3.4 Implement organization router with all endpoints

### Phase 4 — RBAC
- [ ] 4.1 Implement PermissionResolver service with Redis caching
- [ ] 4.2 Implement require_permission dependency factory
- [ ] 4.3 Apply RBAC guards to all mutation endpoints
- [ ] 4.4 Implement RBAC router (permission set endpoints)
- [ ] 4.5 Seed default system roles
- [ ] 4.6 Add PostgreSQL RLS policies via Alembic migration

### Phase 5 — Audit & Events
- [ ] 5.1 Define AuditEvent and DomainEvent models
- [ ] 5.2 Implement AuditLogger service
- [ ] 5.3 Implement DomainEventPublisher and outbox Celery task
- [ ] 5.4 Implement audit router (GET /audit-events, GET /audit-events/{id})
- [ ] 5.5 Add audit_events immutability trigger via Alembic migration

### Phase 6 — Frontend
- [ ] 6.1 Implement auth screens (LoginPage, AuthContext, token in memory)
- [ ] 6.2 Implement ProtectedRoute guard
- [ ] 6.3 Update AppShell with RBAC-aware navigation
- [ ] 6.4 Implement organization and branch screens
- [ ] 6.5 Implement identity screens (users, roles, teams)
- [ ] 6.6 Implement CRM screens (clients, engagements, projects)
- [ ] 6.7 Implement audit log screen
- [ ] 6.8 Implement shared hooks (usePermission, useCurrentOrg, PermissionGate)

### Phase 7 — Tests
- [ ] 7.1 Unit tests (JWT, password, permission resolver, repository, audit, events, idempotency)
- [ ] 7.2 Integration tests (auth flow, org CRUD, project lifecycle, RBAC, audit, events, workflow)
- [ ] 7.3 Authorization tests (cross-tenant isolation, default-deny, permission scope, delegation)
- [ ] 7.4 Migration tests (upgrade/downgrade, org_id constraints, audit immutability)
- [ ] 7.5 Security tests (expired token, revoked token, injection)

---

## Sprint Exit Gate

The sprint is **not complete** until every item in the checklist above is checked, and all of the following are true:

1. `alembic upgrade head` runs without error from a clean database
2. All unit, integration, authorization, migration, and security tests pass (`pytest --cov=app`)
3. Coverage for `app/` is ≥ 80%
4. `ruff check app tests` reports zero errors
5. Every endpoint in OpenAPI (`/api/v1/docs`) returns the correct documented schema
6. A test org can be bootstrapped end-to-end: create org → login → create branch → create client → create project → view audit log
7. Cross-tenant access attempt returns 403 and is recorded in audit_events
8. Revoked refresh token cannot be replayed
9. Frontend authenticated shell is operational with RBAC-driven navigation visible
10. No critical or high findings remain open from static analysis
