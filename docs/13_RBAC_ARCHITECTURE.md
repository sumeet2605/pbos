# CBOS RBAC Architecture

## Authorization Constitution

### Version 1.0

Creative Business Operating System (CBOS)

---

## 1. Purpose

This document is the official authorization constitution of CBOS (Creative Business Operating System).

It defines the complete Role-Based Access Control (RBAC) architecture that governs every permission decision across all organizations, branches, teams, projects, and business templates running on the CBOS platform.

Every API route, UI component, workflow action, AI recommendation, and data query that requires authorization must comply with this document.

This architecture must support:

- Multi-tenant SaaS with strict organization isolation
- Photography Studios, Marketing Agencies, Podcast Studios, and Production Houses
- Future creative industries through Business Templates
- Enterprise evolution toward ABAC, SSO, SCIM, and LDAP without redesign

---

## 2. Vision

CBOS authorization is built on one core principle:

> *Every access decision in CBOS is organization-scoped, role-driven, auditable, and designed to enforce least privilege at every level of the hierarchy.*

The vision for the RBAC system is:

- Platform teams control what permissions exist.
- Organizations decide how permissions are assembled into roles.
- Users receive roles and access grants that are always traceable to a specific context.
- No user may access data outside their organization under any condition.
- Access decisions are never implicit — they are always driven by explicit grants at organization, branch, team, project, or user scope.
- The authorization model scales gracefully from a two-person photography studio to an enterprise production house with hundreds of users and dozens of branches.
- The model is designed so that future integration with ABAC, Policy Engines, SSO, SCIM, LDAP, Azure AD, and Google Workspace requires no structural redesign.

---

## 3. RBAC Principles

### Principle 1 — Permissions Are Platform-Controlled

Permissions are atomic capability statements defined and maintained by the CBOS platform engineering team.

No organization may create, modify, or delete platform permissions. Organizations configure which permissions belong to which roles, but may not invent new permissions outside the platform catalog.

### Principle 2 — Roles Are Organization-Configurable

Roles are assembled by organizations from the platform permission catalog.

Organizations may create unlimited custom roles by selecting permissions from the catalog and combining them into role definitions appropriate to their business context.

### Principle 3 — Permission Sets Are Reusable

Permission Sets are named, reusable bundles of permissions. They exist to reduce role management overhead by grouping logically related permissions into a single installable unit.

An organization may define custom Permission Sets and assign them to multiple roles or directly to users in specific scopes.

### Principle 4 — Users May Belong to Multiple Teams

A user is not limited to a single team. Multi-team membership is a first-class capability, not a workaround.

Role and permission resolution must correctly aggregate access grants from all team memberships without conflict or privilege elevation beyond declared grants.

### Principle 5 — Projects May Have Resource-Specific Permissions

Project-level access grants override or narrow organization-level role grants for that project.

A user who is a Viewer at the organization level may be a Manager on a specific project. A user who has Gallery access at the organization level may have that access explicitly restricted for a confidential project.

Project access is always resolved after organization and branch access in the permission evaluation chain.

### Principle 6 — Branch Access Must Be Supported

Organizations with multiple physical or logical branches must be able to configure user access per branch.

A user may be active and fully authorized in Branch A while having no access to Branch B, even within the same organization.

### Principle 7 — Auditability Is Mandatory

Every access grant, access revocation, role assignment, permission change, and delegation must produce a permanent, immutable audit record.

Audit records may never be deleted.

### Principle 8 — Tenant Isolation Is Mandatory

No permission evaluation, role assignment, team membership, or access grant may produce a data access decision that crosses organization boundaries.

Tenant isolation is enforced at the data layer, service layer, and authorization layer simultaneously.

---

## 4. Domain Model

### Entity Hierarchy

```
Organization
 ├── User
 │    ├── UserRole (org scope)
 │    ├── UserTeam
 │    ├── BranchAccess
 │    ├── ProjectAccess
 │    └── Delegation (active delegations)
 ├── Role
 │    ├── RoleTemplate (source if derived)
 │    └── RolePermission
 │         └── Permission
 ├── PermissionSet
 │    └── PermissionSetItem
 │         └── Permission
 ├── Team
 │    └── UserTeam
 ├── Branch
 │    └── BranchAccess
 ├── Project
 │    └── ProjectAccess
 └── ApprovalChain
      └── ApprovalChainStep
```

### Ownership Rules

- Every RBAC entity must contain `organization_id`.
- A Permission is platform-owned and carries no `organization_id`. It is referenced by all tenants.
- A Role is organization-owned.
- A RoleTemplate is platform-owned or organization-owned.
- A PermissionSet is organization-owned.
- A UserRole is organization-scoped with an optional scope qualifier (branch, project, or team).
- All audit events carry `organization_id`.

### Entity Relationships

```
Organization      ──< Role
Organization      ──< PermissionSet
Organization      ──< Team
Organization      ──< BranchAccess
Organization      ──< ApprovalChain
Organization      ──< AuditEvent

User              ──< UserRole
User              ──< UserTeam
User              ──< BranchAccess
User              ──< ProjectAccess
User              ──< Delegation (as delegator)
User              ──< Delegation (as delegate)

Role              ──< RolePermission
RoleTemplate      ──< Role (spawned from)
Permission        ──< RolePermission
Permission        ──< PermissionSetItem

PermissionSet     ──< PermissionSetItem
Role              ──< PermissionSet (optional link)

Team              ──< UserTeam

Branch            ──< BranchAccess
Project           ──< ProjectAccess

Delegation        ──< AuditEvent
ApprovalChain     ──< ApprovalChainStep
ApprovalChainStep ──< AuditEvent
```

---

## 5. Permission Architecture

### 5.1 Permission Model

Permissions follow a strict `Resource.Action` format.

```
Resource.Action
```

This format is machine-readable, human-readable, and directly maps to API authorization guards.

Permissions are immutable once published to the platform catalog. New permissions require a platform release.

### 5.2 Permission Entity

```
Permission

id                     UUID, platform assigned
code                   string, unique across platform, e.g. Gallery.Upload
resource               string, e.g. Gallery
action                 string, e.g. Upload
description            string
category               string, e.g. Media, Finance, Operations
is_active              boolean
created_at             timestamp
```

### 5.3 Complete Permission Catalog

#### Organization

```
Organization.View
Organization.Edit
Organization.Delete
Organization.ManageBranches
Organization.ManageTeams
Organization.ManageBilling
Organization.ViewAuditLog
Organization.ManageIntegrations
```

#### User Management

```
User.View
User.Invite
User.Edit
User.Deactivate
User.AssignRole
User.ManageTeam
```

#### Role Management

```
Role.View
Role.Create
Role.Edit
Role.Delete
Role.AssignPermission
```

#### Client

```
Client.View
Client.Create
Client.Edit
Client.Delete
Client.ViewContacts
Client.ManageContacts
```

#### Engagement

```
Engagement.View
Engagement.Create
Engagement.Edit
Engagement.Close
```

#### CRM

```
Lead.View
Lead.Create
Lead.Edit
Lead.Delete
Lead.Assign
Lead.Convert
Quote.View
Quote.Create
Quote.Edit
Quote.Send
Quote.Approve
```

#### Project

```
Project.View
Project.Create
Project.Edit
Project.Delete
Project.ChangeStatus
Project.AssignTeam
Project.ViewBudget
Project.ManageBudget
Project.Archive
```

#### Task

```
Task.View
Task.Create
Task.Edit
Task.Delete
Task.Assign
Task.Complete
```

#### Shoot (Operations)

```
Shoot.View
Shoot.Create
Shoot.Edit
Shoot.Delete
Shoot.Schedule
Shoot.Complete
```

#### Gallery (Media)

```
Gallery.View
Gallery.Create
Gallery.Upload
Gallery.Edit
Gallery.Delete
Gallery.Share
Gallery.Download
Gallery.PublishExternal
Gallery.ViewClientSelection
```

#### Asset (Media)

```
Asset.View
Asset.Upload
Asset.Download
Asset.Delete
Asset.ManageLibrary
```

#### Deliverable

```
Deliverable.View
Deliverable.Create
Deliverable.Edit
Deliverable.Delete
Deliverable.Deliver
Deliverable.Approve
```

#### Invoice (Finance)

```
Invoice.View
Invoice.Create
Invoice.Edit
Invoice.Delete
Invoice.Send
Invoice.Pay
Invoice.Void
Invoice.ViewPayments
```

#### Expense (Finance)

```
Expense.View
Expense.Create
Expense.Edit
Expense.Delete
Expense.Approve
```

#### Campaign (Marketing)

```
Campaign.View
Campaign.Create
Campaign.Edit
Campaign.Delete
Campaign.Launch
Campaign.ViewAnalytics
```

#### Workflow

```
Workflow.View
Workflow.Create
Workflow.Edit
Workflow.Publish
Workflow.Archive
Workflow.Execute
Workflow.ManualTrigger
Workflow.ViewExecutionLog
Workflow.ResolveDeadLetter
```

#### Configuration

```
Configuration.View
Configuration.Edit
Configuration.PublishTemplate
Configuration.ManageFieldDefinitions
Configuration.ManageStatusDefinitions
Configuration.ManageFormDefinitions
```

#### Approval

```
Approval.View
Approval.Decide
Approval.Delegate
Approval.ManageChains
```

#### Branch

```
Branch.View
Branch.Create
Branch.Edit
Branch.Delete
Branch.ManageAccess
```

#### Team

```
Team.View
Team.Create
Team.Edit
Team.Delete
Team.ManageMembers
```

#### Delegation

```
Delegation.View
Delegation.Create
Delegation.Revoke
```

#### AI

```
AI.UseAssistant
AI.ViewRecommendations
AI.ManageAgents
```

#### Analytics

```
Analytics.ViewDashboard
Analytics.ViewReports
Analytics.ExportData
Analytics.ManageSnapshots
```

### 5.4 Permission Resolution Order

When evaluating whether a user has a given permission, resolution proceeds through the following hierarchy. The first explicit grant or deny wins. If no explicit decision is found at any level, access is denied.

```
1. Tenant Isolation Check          → Deny immediately if organization_id mismatch
2. User Status Check               → Deny if user is inactive or deactivated
3. Project Access Override         → Check explicit ProjectAccess grants for this project
4. Branch Access Check             → Verify user has access to the request's branch context
5. Team Role Grants                → Aggregate permissions from all team memberships
6. Direct UserRole Grants          → Check permissions from directly assigned roles
7. Delegation Check                → Check active delegations covering this permission and scope
8. Default Deny                    → No explicit grant found → access denied
```

---

## 6. Role Architecture

### 6.1 Role Entity

```
Role

id                     UUID
organization_id        UUID, foreign key to Organization (null for system roles)
name                   string
code                   string, unique within organization
description            string
role_type              enum: SYSTEM | BUSINESS_TEMPLATE | CUSTOM
template_source_id     UUID, foreign key to RoleTemplate, nullable
is_active              boolean
created_by             UUID
created_at             timestamp
updated_at             timestamp
```

### 6.2 RoleTemplate Entity

RoleTemplates are platform-published or industry-pack-published blueprints that organizations may use to derive their Roles.

```
RoleTemplate

id                     UUID
name                   string
code                   string, unique across platform
description            string
industry_pack          string, e.g. photography, agency, podcast, production, system
suggested_permissions  array of permission codes (advisory, not enforced)
is_active              boolean
created_at             timestamp
```

### 6.3 RolePermission Entity

```
RolePermission

id                     UUID
role_id                UUID, foreign key to Role
permission_id          UUID, foreign key to Permission
granted_at             timestamp
granted_by             UUID
```

### 6.4 System Roles

System Roles are platform-provided roles available to every organization. Their permission sets represent recommended defaults and may be customized by organizations.

| Role | Code | Default Scope | Description |
|---|---|---|---|
| Owner | OWNER | Organization | Full access to all resources including billing, user management, and configuration |
| Admin | ADMIN | Organization | Full operational access excluding billing management |
| Manager | MANAGER | Organization / Branch | Manages teams, projects, and operations |
| Contributor | CONTRIBUTOR | Project / Team | Creates and edits business content within their scope |
| Viewer | VIEWER | Organization / Project | Read-only access to permitted resources |

### 6.5 Business Template Roles

Business Template Roles are advisory role definitions included within each Industry Pack. They are installed as RoleTemplates and then derived as organization Roles when the template is activated.

#### Photography Pack Roles

| Role | Suggested Permission Set |
|---|---|
| Studio Manager | Gallery Manager, Finance Manager, Operations Manager, Project Manager |
| Photographer | Shoot Manager, Gallery Upload |
| Editor | Gallery Manager, Asset Manager |
| Album Designer | Deliverable Manager, Asset Viewer |
| Sales Executive | Sales Manager, CRM Manager |

#### Agency Pack Roles

| Role | Suggested Permission Set |
|---|---|
| Account Manager | Client Manager, Project Manager, Finance Viewer |
| Designer | Project Contributor, Asset Manager |
| Copywriter | Project Contributor |
| Media Buyer | Campaign Manager, Finance Viewer |

#### Podcast Pack Roles

| Role | Suggested Permission Set |
|---|---|
| Producer | Project Manager, Asset Manager, Workflow Manager |
| Host | Project Contributor, Asset Viewer |
| Editor | Asset Manager, Deliverable Manager |

#### Production House Pack Roles

| Role | Suggested Permission Set |
|---|---|
| Producer | Project Manager, Finance Viewer, Operations Manager |
| Director | Project Manager, Shoot Manager |
| Cameraperson | Shoot Contributor, Asset Upload |
| Editor | Asset Manager, Deliverable Manager |

### 6.6 Custom Roles

Organizations may create unlimited custom roles.

Custom roles are assembled by selecting permissions from the platform catalog and optionally linking to one or more Permission Sets.

Custom roles follow the same entity structure as all other roles with `role_type = CUSTOM`.

---

## 7. Permission Set Architecture

### 7.1 PermissionSet Entity

```
PermissionSet

id                     UUID
organization_id        UUID, foreign key to Organization
name                   string
code                   string, unique within organization
description            string
is_system              boolean, true for platform-shipped bundles
is_active              boolean
created_by             UUID
created_at             timestamp
updated_at             timestamp
```

### 7.2 PermissionSetItem Entity

```
PermissionSetItem

id                     UUID
permission_set_id      UUID, foreign key to PermissionSet
permission_id          UUID, foreign key to Permission
added_at               timestamp
added_by               UUID
```

### 7.3 Platform-Shipped Permission Sets

The following permission sets are shipped by the platform and available to all organizations as a starting point.

#### Gallery Manager

```
Gallery.View
Gallery.Create
Gallery.Upload
Gallery.Edit
Gallery.Share
Gallery.Download
Gallery.ViewClientSelection
Asset.View
Asset.Upload
Asset.Download
```

#### Sales Manager

```
Lead.View
Lead.Create
Lead.Edit
Lead.Assign
Lead.Convert
Quote.View
Quote.Create
Quote.Edit
Quote.Send
Client.View
Client.Create
Client.Edit
```

#### Finance Manager

```
Invoice.View
Invoice.Create
Invoice.Edit
Invoice.Send
Invoice.Pay
Invoice.ViewPayments
Expense.View
Expense.Create
Expense.Approve
Quote.View
Quote.Approve
```

#### Operations Manager

```
Shoot.View
Shoot.Create
Shoot.Edit
Shoot.Schedule
Shoot.Complete
Task.View
Task.Create
Task.Edit
Task.Assign
Task.Complete
Project.View
Project.Edit
Project.ChangeStatus
```

#### Project Manager

```
Project.View
Project.Create
Project.Edit
Project.ChangeStatus
Project.AssignTeam
Project.ViewBudget
Task.View
Task.Create
Task.Edit
Task.Assign
Task.Complete
Deliverable.View
Deliverable.Create
Deliverable.Edit
Deliverable.Deliver
```

#### CRM Manager

```
Lead.View
Lead.Create
Lead.Edit
Lead.Delete
Lead.Assign
Lead.Convert
Client.View
Client.Create
Client.Edit
Client.ViewContacts
Client.ManageContacts
Engagement.View
Engagement.Create
Engagement.Edit
```

#### Asset Manager

```
Asset.View
Asset.Upload
Asset.Download
Asset.Delete
Asset.ManageLibrary
```

#### Workflow Manager

```
Workflow.View
Workflow.Create
Workflow.Edit
Workflow.Publish
Workflow.Execute
Workflow.ManualTrigger
Workflow.ViewExecutionLog
```

### 7.4 Custom Permission Sets

Organizations may create custom Permission Sets from the platform permission catalog.

Custom Permission Sets follow the same structure and may be assigned to Roles or directly to Users in a specific scope.

---

## 8. Team Architecture

### 8.1 Team Entity

```
Team

id                     UUID
organization_id        UUID, foreign key to Organization
name                   string
code                   string, unique within organization
description            string
manager_id             UUID, foreign key to User
branch_id              UUID, foreign key to Branch, nullable
is_active              boolean
created_at             timestamp
updated_at             timestamp
```

### 8.2 UserTeam Entity

```
UserTeam

id                     UUID
user_id                UUID, foreign key to User
team_id                UUID, foreign key to Team
role_in_team           UUID, foreign key to Role, nullable
joined_at              timestamp
joined_by              UUID
left_at                timestamp, nullable
```

### 8.3 Team Design Rules

- A user may belong to multiple teams simultaneously.
- Teams may be scoped to a specific branch or span the entire organization.
- Team membership may carry a role override specific to that team context.
- Permissions from all active team memberships are aggregated using a union of grants (no permission is lost by multi-team membership).
- Removing a user from a team revokes all team-derived grants effective immediately.
- Team managers have implicit access to view and manage their own team's membership.

### 8.4 Platform-Suggested Teams

The following teams are included in industry pack templates as advisory defaults.

#### Photography Pack

```
Photography Team        → Photographer, Editor roles
Editing Team            → Editor, Album Designer roles
Operations Team         → Studio Manager, Operations Coordinator roles
Sales Team              → Sales Executive roles
```

#### Agency Pack

```
Creative Team           → Designer, Copywriter roles
Strategy Team           → Account Manager roles
Media Team              → Media Buyer roles
```

#### Podcast Pack

```
Production Team         → Producer, Host, Editor roles
```

#### Production House Pack

```
Production Team         → Producer, Director roles
Technical Team          → Cameraperson, Editor roles
```

---

## 9. Branch Architecture

### 9.1 Branch Access Model

Branch access controls which branches a user can operate within. By default, a user has no branch access until it is explicitly granted.

### 9.2 BranchAccess Entity

```
BranchAccess

id                     UUID
organization_id        UUID, foreign key to Organization
user_id                UUID, foreign key to User
branch_id              UUID, foreign key to Branch
access_level           enum: FULL | READ_ONLY | RESTRICTED
role_override_id       UUID, foreign key to Role, nullable
granted_by             UUID
granted_at             timestamp
revoked_at             timestamp, nullable
revoked_by             UUID, nullable
notes                  string, nullable
```

### 9.3 Branch Access Rules

- Users with organization-level Owner or Admin roles automatically have access to all branches unless explicitly restricted.
- Users with branch-scoped roles or below must have explicit BranchAccess entries for each branch they should access.
- Branch access grants may carry a role override, which narrows or changes the user's effective role within that specific branch.
- Projects belong to a primary branch. A user must have access to the project's primary branch to access the project unless a direct ProjectAccess override is present.
- Supporting branches on a project do not require separate branch access beyond the primary branch grant.
- Branch access revocation is immediate and creates an audit event.

---

## 10. Project Access Architecture

### 10.1 ProjectAccess Entity

```
ProjectAccess

id                     UUID
organization_id        UUID, foreign key to Organization
project_id             UUID, foreign key to Project
user_id                UUID, foreign key to User
access_role            enum: OWNER | MANAGER | CONTRIBUTOR | VIEWER
role_override_id       UUID, foreign key to Role, nullable
permission_set_id      UUID, foreign key to PermissionSet, nullable
granted_by             UUID
granted_at             timestamp
revoked_at             timestamp, nullable
revoked_by             UUID, nullable
notes                  string, nullable
```

### 10.2 Project Access Roles

| Access Role | Description |
|---|---|
| Owner | Full control over the project including deletion and team assignment |
| Manager | Manages tasks, deliverables, finance, and project lifecycle |
| Contributor | Creates and edits content within the project |
| Viewer | Read-only access to permitted project resources |

### 10.3 Project Access Rules

- Project access is evaluated after branch access in the permission resolution chain.
- A ProjectAccess entry overrides the user's organization-level role for the scope of that project.
- ProjectAccess may reference a specific Role or PermissionSet for fine-grained control.
- The Project Owner role may be held by only one user per project at a time. Transfer of ownership requires an audit event.
- Revoking project access takes effect immediately.
- Sub-projects inherit their parent project's access grants unless overridden with an explicit SubProject access grant.

---

## 11. UserRole Architecture

### 11.1 UserRole Entity

```
UserRole

id                     UUID
organization_id        UUID, foreign key to Organization
user_id                UUID, foreign key to User
role_id                UUID, foreign key to Role
scope_type             enum: ORGANIZATION | BRANCH | TEAM | PROJECT
scope_id               UUID, nullable, references branch/team/project based on scope_type
granted_by             UUID
granted_at             timestamp
expires_at             timestamp, nullable
revoked_at             timestamp, nullable
revoked_by             UUID, nullable
notes                  string, nullable
```

### 11.2 Scope Types

| Scope Type | Description |
|---|---|
| ORGANIZATION | Role applies across the entire organization |
| BRANCH | Role applies only within the specified branch |
| TEAM | Role applies only within the context of the specified team |
| PROJECT | Role applies only for the specified project |

---

## 12. Delegation Architecture

### 12.1 Purpose

Delegation allows an authorized user (the delegator) to temporarily transfer a subset of their access rights to another user (the delegate) for a defined period and scope.

Example: A Studio Manager going on leave delegates approval rights for invoices and expense approvals to a Senior Photographer for the duration of the leave.

### 12.2 Delegation Entity

```
Delegation

id                     UUID
organization_id        UUID, foreign key to Organization
delegator_user_id      UUID, foreign key to User
delegate_user_id       UUID, foreign key to User
scope_type             enum: ORGANIZATION | BRANCH | PROJECT | PERMISSION_SET
scope_id               UUID, nullable
permission_set_id      UUID, foreign key to PermissionSet, nullable
role_id                UUID, foreign key to Role, nullable
reason                 string
start_date             date
end_date               date
is_active              boolean, computed from dates and revocation
revoked_at             timestamp, nullable
revoked_by             UUID, nullable
created_at             timestamp
created_by             UUID
```

### 12.3 Delegation Rules

- A user may only delegate permissions they themselves currently hold.
- Delegation cannot elevate privileges — the delegate cannot receive more than the delegator currently has.
- Delegation is time-bound. `start_date` and `end_date` are mandatory.
- The platform must automatically expire delegations on `end_date`.
- Delegations may be revoked before `end_date` by the delegator, an admin, or an owner.
- Delegations require an approval step from an admin or owner where the delegated scope includes finance or approval permissions.
- Every delegation creates an audit event at creation, activation, expiry, and revocation.
- Delegation chains are not permitted. A delegate may not re-delegate received permissions.

---

## 13. Approval Chain Architecture

### 13.1 Purpose

Approval Chains define configurable, multi-step human approval flows for sensitive business actions within CBOS.

Approval Chains are integrated with the Workflow Engine (Document 08) but are governed independently by the authorization system.

### 13.2 ApprovalChain Entity

```
ApprovalChain

id                     UUID
organization_id        UUID, foreign key to Organization
name                   string
code                   string, unique within organization
resource_type          string, e.g. Invoice, Expense, Discount, WorkflowPublication
description            string
is_active              boolean
created_by             UUID
created_at             timestamp
updated_at             timestamp
```

### 13.3 ApprovalChainStep Entity

```
ApprovalChainStep

id                     UUID
approval_chain_id      UUID, foreign key to ApprovalChain
sequence               integer
approver_type          enum: USER | ROLE | TEAM_MANAGER | ORGANIZATION_OWNER
approver_reference_id  UUID, nullable
approval_mode          enum: ANY_ONE | ALL_REQUIRED | MAJORITY
escalation_after_hours integer, nullable
escalation_to_id       UUID, foreign key to User, nullable
is_active              boolean
```

### 13.4 ApprovalDecision Entity

```
ApprovalDecision

id                     UUID
organization_id        UUID, foreign key to Organization
approval_chain_id      UUID, foreign key to ApprovalChain
approval_chain_step_id UUID, foreign key to ApprovalChainStep
resource_type          string
resource_id            UUID
decided_by             UUID, foreign key to User
decision               enum: APPROVED | REJECTED | ESCALATED | DELEGATED
decision_notes         string, nullable
decided_at             timestamp
workflow_execution_id  UUID, nullable
```

### 13.5 Supported Approval Chains

The following approval chains are provided as platform defaults and may be customized or extended by organizations.

| Chain | Resource Type | Default Approvers |
|---|---|---|
| Expense Approval | Expense | Manager → Owner |
| Discount Approval | Quote | Manager → Admin |
| Invoice Approval | Invoice | Finance Manager → Owner |
| Workflow Publication Approval | WorkflowDefinition | Admin |
| Delegation Approval | Delegation | Admin |
| Refund Approval | Payment | Owner |

### 13.6 Approval Chain Rules

- Approval chains are organization-configured and may differ across organizations.
- A step may require one approver (`ANY_ONE`), all listed approvers (`ALL_REQUIRED`), or a majority.
- Escalation is supported when an approver does not act within the configured window.
- Approval decisions produce audit events and may trigger workflow actions on completion.
- Delegation of an approval step is supported but requires an active delegation record.

---

## 14. Audit Architecture

### 14.1 AuditEvent Entity

```
AuditEvent

id                     UUID
organization_id        UUID, foreign key to Organization
event_type             string, categorized audit event code
event_category         enum: ROLE | PERMISSION | ACCESS | DELEGATION | APPROVAL | SECURITY
actor_user_id          UUID, foreign key to User
actor_type             enum: USER | SYSTEM | API | AI
resource_type          string
resource_id            UUID
scope_type             enum: ORGANIZATION | BRANCH | TEAM | PROJECT
scope_id               UUID, nullable
before_state           jsonb, nullable
after_state            jsonb, nullable
ip_address             string, nullable
user_agent             string, nullable
correlation_id         UUID, nullable
event_timestamp        timestamp
notes                  string, nullable
```

### 14.2 Auditable Events

All of the following event types must generate an audit record.

#### Role Events

```
ROLE_CREATED
ROLE_UPDATED
ROLE_DELETED
ROLE_PERMISSION_ADDED
ROLE_PERMISSION_REMOVED
ROLE_ASSIGNED_TO_USER
ROLE_REVOKED_FROM_USER
```

#### Permission Events

```
PERMISSION_SET_CREATED
PERMISSION_SET_UPDATED
PERMISSION_SET_DELETED
PERMISSION_SET_ITEM_ADDED
PERMISSION_SET_ITEM_REMOVED
```

#### Access Events

```
BRANCH_ACCESS_GRANTED
BRANCH_ACCESS_REVOKED
PROJECT_ACCESS_GRANTED
PROJECT_ACCESS_REVOKED
TEAM_MEMBER_ADDED
TEAM_MEMBER_REMOVED
USER_DEACTIVATED
USER_REACTIVATED
```

#### Delegation Events

```
DELEGATION_CREATED
DELEGATION_ACTIVATED
DELEGATION_EXPIRED
DELEGATION_REVOKED
DELEGATION_REJECTED
```

#### Approval Events

```
APPROVAL_REQUESTED
APPROVAL_DECIDED
APPROVAL_ESCALATED
APPROVAL_CHAIN_CREATED
APPROVAL_CHAIN_UPDATED
```

#### Security Events

```
PERMISSION_EVALUATION_DENIED
CROSS_TENANT_ACCESS_ATTEMPT
UNAUTHORIZED_API_ACCESS
FORCE_LOGOUT
```

### 14.3 Audit Rules

- Audit events are append-only and must never be modified or deleted.
- Audit events must be written in the same transaction as the state change they record where technically feasible, or via a guaranteed message queue with exactly-once delivery.
- Audit storage must be organization-isolated.
- Audit data must be retained per the organization's subscription-tier retention policy with a minimum of 12 months.
- Audit data must be exportable in structured format for compliance purposes.
- Real-time alerting on `CROSS_TENANT_ACCESS_ATTEMPT` and `PERMISSION_EVALUATION_DENIED` anomalies must be supported.

---

## 15. Access Scope Inheritance Rules

CBOS supports five access scopes. The resolution order and inheritance rules are:

```
Organization Scope
    └── Branch Scope
            └── Team Scope
                    └── Project Scope
                            └── User Scope (direct override)
```

### Organization Scope

The broadest scope. A role or permission set assigned at organization scope applies across all branches, teams, and projects unless overridden at a narrower scope.

Owner and Admin system roles always operate at organization scope.

### Branch Scope

Applies within a specific branch. Overrides or narrows organization-scope grants for the user within that branch context.

### Team Scope

Applies within the context of a specific team. A role assigned at team scope is effective when the user acts on behalf of that team or within team-owned resources.

### Project Scope

The most specific operational scope. Project access grants take precedence over all broader scope grants for the resources contained within that project.

### User Scope (Direct Override)

An explicit permission set assigned directly to a user in a specific scope, without a role intermediary. Intended for edge cases and should be used sparingly. All user-scope overrides require an audit event and an approval from an admin or owner.

### Inheritance Rules Summary

| Rule | Behavior |
|---|---|
| Organization grants flow down | Unless blocked at a narrower scope |
| Branch grants are additive | Do not remove org-scope grants, may narrow them |
| Project grants override | Project-level role overrides org and branch roles for that project |
| Team grants are additive | All team grants union together; no implicit conflict resolution needed |
| Explicit deny at any scope | Immediately blocks access regardless of broader grants |
| Default deny | No explicit grant at any scope means no access |

---

## 16. Security Rules

### Tenant Isolation

- Every permission evaluation call must begin with an organization boundary check.
- No query, API response, or workflow execution may return data outside the authenticated user's organization.
- Tenant isolation is enforced at the service layer and must be independently validated at the data layer.
- Cross-tenant access attempts must produce an immediate denial, a security audit event, and trigger a real-time alert to platform operators.

### Least Privilege

- Users must be granted the minimum permissions necessary to perform their function.
- Default roles provide read-only or contributor access. Escalated permissions require explicit assignment.
- Time-limited grants must be expired automatically.
- Inactive users must have their active grants suspended on deactivation.

### Principle of Explicit Grant

- Access is denied by default.
- There are no implicit grants except those defined by system roles in the platform catalog.
- Every access grant must have a recorded grantor, timestamp, and scope.

### Permission Evaluation Performance

- Permission evaluation must be performant. Resolution should complete within the API response SLA.
- Active grants may be cached per user session with a TTL not exceeding the session lifetime.
- Role and permission changes must invalidate affected caches immediately.

### API Authorization Requirements

- Every API endpoint must declare its required permission in code.
- Endpoints that return lists must apply permission filters to return only records the user has access to.
- Endpoints must never trust client-supplied `organization_id`. The organization context is always derived from the authenticated token.

### AI Authorization Rules

- AI assistants must act under the authenticated user's permission context.
- AI may not perform actions that the user themselves could not perform.
- AI-initiated actions must produce audit events attributed to both the AI actor and the authorizing user.
- AI may suggest role changes, permission grants, or configuration modifications but may not apply them without explicit human confirmation.

---

## 17. Future Evolution

This RBAC architecture is designed to evolve without structural redesign into the following capabilities.

### ABAC (Attribute-Based Access Control)

The current permission model uses `Resource.Action` codes as the atomic permission unit. The `before_state` / `after_state` jsonb fields in AuditEvent, and the `permission_set_id` on ProjectAccess and UserRole, are forward-compatible with attribute-based conditions.

Future extension: permission evaluation conditions may be enriched with attribute expressions (e.g., `Project.status = ACTIVE`, `User.branch = request.branch`) by introducing a `PermissionCondition` table linked to `RolePermission` without changing the core model.

### Policy-Based Access Control

The `ApprovalChain` and `WorkflowConditionGroup` models are already policy-aware. A `PolicyDefinition` entity may be introduced to externalize permission conditions into configurable policy rules without altering the Role or Permission structures.

### Enterprise SSO

The `User` entity carries a stable `id` and `organization_id`. An `IdentityProvider` entity and a `UserIdentityMapping` entity may be added to the Identity domain to map external SSO identities to CBOS users. JWT claims from SSO tokens would map to CBOS roles through a configurable claim mapping layer.

### SCIM

SCIM provisioning would write to the `User`, `UserRole`, `UserTeam`, and `BranchAccess` entities through the existing service layer. No new schema is required. A SCIM adapter translates SCIM Group → CBOS Team, SCIM Role → CBOS Role.

### LDAP

LDAP group membership maps to CBOS Team membership. LDAP attributes map to User fields. An LDAP sync service would manage `UserTeam` records using the existing architecture.

### Azure Active Directory

Azure AD Groups → CBOS Teams.  
Azure AD App Roles → CBOS RoleTemplates.  
Azure AD Conditional Access Policies → CBOS BranchAccess and ProjectAccess conditions via policy extension.

### Google Workspace

Google Groups → CBOS Teams.  
Google Workspace Admin SDK Directory API → CBOS User provisioning via SCIM-compatible adapter.

### Compliance Evolution

The `AuditEvent` entity and its append-only design already satisfy the foundational requirements for SOC 2 Type II, ISO 27001, and GDPR audit trail mandates. Future compliance certifications require no schema changes, only tooling and reporting additions.

---

## 18. Constitutional Rules

The following rules are the permanent authorization constitution of CBOS. No release, feature, or configuration may violate them.

**Rule 1**
Every permission evaluation must begin with a tenant isolation check. Any request that cannot be attributed to a verified organization_id must be denied.

**Rule 2**
Permissions are platform-controlled. No organization may create, rename, or delete platform permissions.

**Rule 3**
Roles are organization-configurable. Organizations may create, modify, and assign roles from the platform permission catalog.

**Rule 4**
Access is denied by default. There are no implicit grants. Every grant must be explicit, recorded, and traceable.

**Rule 5**
Every access grant, revocation, role assignment, permission change, delegation, and approval decision must produce an immutable audit event.

**Rule 6**
No user may delegate more permissions than they currently hold. Delegation chains are prohibited.

**Rule 7**
No AI actor may perform a permission grant, role assignment, approval decision, or security override without explicit human confirmation.

**Rule 8**
Every API endpoint must declare its required permission. No endpoint may return data outside the authenticated user's organization context.

**Rule 9**
Inactive users have no active permissions. Deactivation takes effect immediately across all scopes.

**Rule 10**
The RBAC model must remain extensible to ABAC, policy engines, SSO, SCIM, LDAP, Azure AD, and Google Workspace without structural redesign of the core permission and role entities.

**Rule 11**
Tenant isolation is enforced at three independent layers: authentication, service, and data. The failure of any one layer must not expose cross-tenant data.

**Rule 12**
The authorization constitution is a living document. Amendments require an architectural decision record, a backward-compatibility analysis, and approval from the Chief Security Architect.

---

*This document is the official authorization constitution of CBOS.*  
*Version 1.0 — Creative Business Operating System*
