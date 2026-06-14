# CBOS Industry Pack Architecture

## Business Template Constitution

### Version 1.0

Creative Business Operating System (CBOS)

---

## 1. Purpose

This document defines the official Business Template Architecture for CBOS (Creative Business Operating System).

Its purpose is to establish the complete constitutional framework by which CBOS supports multiple industries, business models, and operational contexts without modifying the CBOS Core Platform.

Every decision described in this document protects three foundational truths:

1. CBOS Core is permanent and cannot be changed by any Business Template.
2. Industry-specific behavior is expressed entirely through templates, metadata, workflows, forms, roles, dashboards, and configurations.
3. The same CBOS Core can simultaneously serve a Photography Studio, a Marketing Agency, a Podcast Studio, and a Production House — and any future industry — without code changes.

This document is the authoritative reference for all architects, engineers, product managers, and business stakeholders working on CBOS extensibility.

---

## 2. Vision

CBOS is built to serve creative and professional service businesses at any scale, across any vertical.

The vision for Business Templates is:

> *Any business that fits the project-centric, client-serving operational model can be onboarded into CBOS by installing a Business Template — not by customizing the platform.*

This vision means:

- A photography studio and a marketing agency run on identical infrastructure.
- A new industry (real estate, architecture, legal services) can be onboarded by authoring a new template, not by deploying new code.
- Templates are discoverable, installable, upgradeable, and removable by platform operators without engineering involvement.
- Organizations may install multiple templates simultaneously if their business spans multiple industries or disciplines.
- The Template Marketplace becomes the primary channel through which CBOS expands industry coverage over time.

The Business Template Architecture is the mechanism by which this vision becomes operational reality.

---

## 3. Core vs Template Architecture

### 3.1 What Is CBOS Core

CBOS Core is the set of permanent, universal platform capabilities that every organization depends on regardless of industry. Core is defined in the Domain Model Constitution (Document 04) and the Entity Model (Document 05).

CBOS Core domains are fixed:

```
Identity
Organizations
CRM
Clients
Engagements
Projects
Operations
Media
Finance
Communications
Workflow
Analytics
AI
Billing
Configuration
```

These domains may not be modified, extended structurally, or bypassed by any Business Template.

### 3.2 What Is a Business Template

A Business Template is a self-contained, versioned, installable package of metadata and configuration that extends CBOS Core behavior for a specific industry or business model.

A Business Template does not add new database tables, modify existing schemas, change core API contracts, or alter core business logic. It operates entirely within the extensibility surface that CBOS Core exposes through the Configuration Engine and Workflow Engine.

### 3.3 Architecture Separation Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        CBOS CORE PLATFORM                        │
│                                                                  │
│  Identity   Organizations   CRM   Clients   Engagements          │
│  Projects   Operations   Media   Finance   Communications        │
│  Workflow   Analytics   AI   Billing   Configuration             │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │             Configuration Engine                          │   │
│  │  ProjectTypes  Fields  Statuses  Forms  Workflows  Roles  │   │
│  └─────────────────────────┬─────────────────────────────────┘   │
│                            │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐   │
│  │              Template Registry                            │   │
│  │     Receives, validates and installs Business Templates   │   │
│  └─────────────────────────┬─────────────────────────────────┘   │
└────────────────────────────┼─────────────────────────────────────┘
                             │
           ┌─────────────────┼──────────────────┐
           │                 │                  │
    ┌──────▼──────┐  ┌───────▼───────┐  ┌──────▼──────┐
    │ Photography │  │   Marketing   │  │   Podcast   │
    │   Studio    │  │    Agency     │  │   Studio    │
    │  Template   │  │   Template    │  │  Template   │
    └─────────────┘  └───────────────┘  └─────────────┘
```

### 3.4 The Core-Template Contract

The contract between CBOS Core and Business Templates is governed by the following rules:

| Concern | CBOS Core Responsibility | Business Template Responsibility |
|---|---|---|
| Data persistence | Core entities and schemas | Uses core entities via FieldValues and ProjectTypes |
| Authentication | Core identity and sessions | Assigns template-defined roles |
| Billing | Subscription management | None |
| Event bus | Emits and routes domain events | Subscribes through workflow triggers |
| Workflow execution | Runs workflow definitions | Authors workflow definitions |
| API contracts | Exposes versioned APIs | Consumes APIs via configuration |
| UI framework | Provides form, dashboard, and navigation infrastructure | Authors form definitions and dashboard layouts |
| Multi-tenancy | Enforces organization isolation | Scoped to installing organization |

---

## 4. Business Template Model

### 4.1 Overview

A Business Template is modeled as a hierarchical package of related configuration entities. The root entity is `BusinessTemplate`. Every element in the template traces back to it.

### 4.2 Entity Definitions

#### BusinessTemplate

The root record representing the template as a product.

```
id
name
code                       (unique, URL-safe slug, e.g. photography-studio)
description
industry_category
author
author_type                (PLATFORM | PARTNER | ORGANIZATION)
min_cbos_version
max_cbos_version
current_published_version_id
created_at
updated_at
```

#### TemplateVersion

A versioned, immutable snapshot of the template's full configuration payload.

```
id
template_id
version_number             (semantic version: major.minor.patch)
release_notes
status                     (DRAFT | PUBLISHED | DEPRECATED | ARCHIVED)
definition_json            (full template payload as structured JSON)
published_at
published_by
deprecated_at
archived_at
is_breaking_change
migration_script_id        (reference to TemplateMigration, nullable)
```

#### TemplateModule

A named logical grouping within a template. One template may contain multiple modules (e.g., Sales Module, Production Module, Finance Module).

```
id
template_version_id
name
code
description
is_required
install_order
```

#### TemplateEntity

Declares which core CBOS entity a template contributes configuration against (e.g., Project, Lead, Task).

```
id
template_module_id
core_entity_name           (must reference an existing CBOS core entity)
label_override             (optional: how the entity is relabeled in this industry)
```

#### TemplateField

Defines a custom field to be registered against a core entity via the Configuration Engine's FieldDefinition mechanism.

```
id
template_entity_id
field_name
field_label
field_type
required
default_value
validation_rules
sort_order
is_system_required         (true = cannot be removed by org admin)
```

#### TemplateWorkflow

Defines a workflow to be registered in the Workflow Engine for the installing organization.

```
id
template_module_id
name
code
description
scope_type                 (ORGANIZATION | PROJECT | ENTITY)
scope_entity
trigger_type               (ENTITY_EVENT | SCHEDULED | MANUAL | API)
definition_json            (triggers, conditions, actions in workflow schema)
```

#### TemplateForm

Defines a form to be registered via the Configuration Engine's FormDefinition mechanism.

```
id
template_module_id
name
code
description
entity_name
fields_json                (ordered form fields referencing TemplateField codes)
```

#### TemplateRole

Defines a role to be created in the installing organization.

```
id
template_module_id
name
code
description
permission_set_code
is_system_role             (true = cannot be deleted by org admin)
```

#### TemplateDashboard

Defines a dashboard layout to be created in the installing organization.

```
id
template_module_id
name
code
audience_role_code
layout_json                (widget placements and data bindings)
```

#### TemplateReport

Defines a report template to be made available in the installing organization.

```
id
template_module_id
name
code
description
report_type
query_definition_json
default_filters_json
```

#### TemplateAutomation

Defines a pre-configured automation rule to be registered in the Workflow Engine.

```
id
template_module_id
name
code
trigger_event
condition_json
action_json
is_active_on_install
```

### 4.3 Entity Relationships

```
BusinessTemplate
│
└── TemplateVersion (1:N)
     │
     └── TemplateModule (1:N)
          │
          ├── TemplateEntity (1:N)
          │    └── TemplateField (1:N)
          │
          ├── TemplateWorkflow (1:N)
          │
          ├── TemplateForm (1:N)
          │    └── references TemplateField codes
          │
          ├── TemplateRole (1:N)
          │    └── references PermissionSet codes
          │
          ├── TemplateDashboard (1:N)
          │    └── references TemplateRole codes
          │
          ├── TemplateReport (1:N)
          │
          └── TemplateAutomation (1:N)
```

### 4.4 Installation Binding

When a template is installed into an organization, each template entity produces a bound organization-scoped configuration record:

| Template Entity | Produces Core Configuration Record |
|---|---|
| TemplateField | FieldDefinition (scoped to organization_id) |
| TemplateWorkflow | WorkflowDefinition + WorkflowVersion (PUBLISHED) |
| TemplateForm | FormDefinition |
| TemplateRole | Role |
| TemplateDashboard | DashboardConfiguration |
| TemplateReport | ReportDefinition |
| TemplateAutomation | WorkflowDefinition (automation-type, auto-published) |

All produced records carry:

- `organization_id` of the installing organization
- `template_id` and `template_version_id` as provenance references
- `installed_by` and `installed_at` audit fields

---

## 5. Template Components

A Business Template contributes the following capabilities to an organization. In every case, the contribution is made through CBOS Core's Configuration and Workflow engines — not through new code or schema modifications.

### 5.1 Project Types

Templates define the set of project categories relevant to the industry.

Each ProjectType registers into the Configuration Engine's `ProjectType` entity scoped to the installing organization.

Examples:
- Photography Studio: Wedding, Maternity, Newborn, Family, Corporate Shoot
- Marketing Agency: Campaign, Content Production, Social Media Management
- Podcast Studio: Episode, Season, Interview
- Production House: Commercial, Documentary, Event Production

### 5.2 Custom Fields

Templates define additional fields for core entities such as Project, Lead, Task, Client, and Deliverable.

Each field registers into `FieldDefinition` using the supported field types: text, textarea, number, currency, date, datetime, boolean, select, multi_select, image, file, json.

Custom field values are stored in `FieldValue` records, preserving the core entity schema.

### 5.3 Statuses

Templates define custom lifecycle statuses for entities such as Project, Lead, Task, and Deliverable.

Each status registers into `StatusDefinition` scoped to the organization, allowing industry-specific state machines without altering core entity states.

### 5.4 Forms

Templates define structured data collection forms using the Configuration Engine's `FormDefinition` and `FormField` entities.

Forms reference both core entity fields and template-defined custom fields. Form submissions are recorded in `FormSubmission`.

### 5.5 Workflows

Templates define business process workflows using the Workflow Engine's `WorkflowDefinition` and `WorkflowVersion` entities.

Each workflow definition is installed as a Published version, immediately available for the organization. Workflows may be scoped at organization, project, or entity level.

### 5.6 Roles

Templates define industry-specific roles that are registered in the Identity domain's `Role` entity, scoped to the installing organization.

### 5.7 Permission Sets

Templates define permission bundles aligned to template roles, registered as `PermissionSet` and `PermissionSetItem` records.

### 5.8 Dashboards

Templates define dashboard layouts that reference template roles as intended audiences. Dashboard widget data binds to existing CBOS Core data through safe, organization-scoped queries.

### 5.9 Reports

Templates define pre-built reports relevant to the industry, using `ReportDefinition` records that query through CBOS Core's Analytics domain.

### 5.10 Automations

Templates define pre-configured automation rules that trigger on domain events and execute actions through the Workflow Engine. Automations may be activated or deactivated by organization administrators post-installation.

### 5.11 Notifications

Templates define notification templates (email, SMS, in-app) triggered by workflow actions.

Notification content is defined in template automation configuration and delivered through CBOS Core's Communications domain.

### 5.12 Documents

Templates define document templates (contracts, proposals, delivery confirmations) using template metadata. Documents are generated through CBOS Core's document generation capabilities and are stored as Assets linked to Projects.

---

## 6. Template Lifecycle

Every template version moves through a defined lifecycle. The platform enforces valid transitions and prevents invalid state changes.

### 6.1 Lifecycle States

```
DRAFT → PUBLISHED → DEPRECATED → ARCHIVED
```

#### DRAFT

- Editable by template authors
- Not installable by organizations
- Testable in sandbox environments
- May be rolled back to DRAFT from PUBLISHED only if no organizations have installed that version

#### PUBLISHED

- Immutable once published
- Installable by organizations
- Only one version per template may be PUBLISHED at a time
- Supersedes the previously PUBLISHED version upon publishing

#### DEPRECATED

- No longer available for new installations
- Existing installations continue to function
- Organizations are notified of available upgrade versions
- Deprecated versions remain installable only by explicit override with administrator acknowledgement

#### ARCHIVED

- No longer functional for new installations
- Existing installations that have not upgraded receive operational warnings
- Historical record retained for audit and rollback support

### 6.2 Rollback

Rollback is the act of returning an installing organization to a prior template version.

Rollback rules:

- Rollback creates a new installation event referencing the prior version
- All configuration records produced by the newer version are removed or reverted to prior-version definitions
- Active workflow executions on the current version complete before rollback takes effect (configurable drain period)
- Rollback must be performed by an authorized platform operator or organization administrator with explicit confirmation
- Every rollback creates an audit event including actor, timestamp, reason, and version transition

### 6.3 Upgrade

Upgrade is the act of migrating an organization from an installed template version to a newer PUBLISHED version.

Upgrade rules:

- Non-breaking upgrades (minor and patch versions) may be applied automatically with organization consent
- Breaking upgrades (major version changes) require explicit administrator acknowledgement and migration review
- The upgrade process validates that all required fields and configuration in the new version can be resolved
- Existing organization customizations applied on top of template configuration are preserved where compatible
- Conflicts between new template configuration and existing organization customizations are surfaced for resolution before the upgrade completes

### 6.4 Migration Between Versions

For major version migrations:

- A `TemplateMigration` record defines the transformation rules from version N to version N+1
- Migration rules describe field renames, workflow substitutions, role mapping changes, and form schema changes
- Migration is applied in a staged environment before production
- Migration may be rolled back within a defined window if post-migration validation fails

---

## 7. Template Installation Process

### 7.1 Installation Actors

- Platform Operator: installs templates onto organizations from the Template Registry
- Organization Administrator: initiates installation from the Template Marketplace within their organization
- Automated Pipeline: installs templates as part of organization onboarding flows

### 7.2 Installation Steps

```
Step 1: Template Discovery
         Organization administrator browses Template Marketplace
         or Platform Operator selects template for organization

Step 2: Version Selection
         System presents PUBLISHED version(s) available for installation
         Administrator selects target version

Step 3: Pre-Installation Validation
         System validates:
           - min_cbos_version compatibility
           - No conflicting field codes with existing templates
           - No conflicting role codes with existing roles
           - No conflicting workflow codes with existing workflows

Step 4: Conflict Resolution (if required)
         Administrator resolves any conflicts identified in Step 3
         or accepts platform-suggested resolution strategies

Step 5: Dry Run
         System simulates installation and presents a preview of
         all configuration records that will be created

Step 6: Installation Confirmation
         Administrator confirms installation

Step 7: Installation Execution
         System creates all configuration records scoped to organization_id
         Records are stamped with template_id, template_version_id,
         installed_by, and installed_at

Step 8: Post-Installation Validation
         System verifies all expected configuration records exist
         and are valid

Step 9: Activation
         Installed project types, workflows, forms, roles, and
         dashboards become active for the organization

Step 10: Installation Audit Event
          System records the complete installation event
```

### 7.3 Installation Idempotency

Installation is idempotent. Re-running an installation for the same template version on the same organization must produce the same state without duplicating records.

### 7.4 Partial Installation

Installations are transactional. If any step fails, all created records are rolled back. The organization's configuration state must never be left in a partially-installed condition.

### 7.5 Multi-Template Co-installation

Multiple templates may be installed in a single organization simultaneously, subject to conflict validation. Templates with overlapping role or workflow codes must declare their namespacing strategy in `TemplateModule` configuration.

---

## 8. Template Versioning

### 8.1 Version Number Scheme

Template versions follow semantic versioning:

```
major.minor.patch

major: breaking changes (schema changes, role removals, workflow restructuring)
minor: additive changes (new fields, new workflows, new forms, new roles)
patch: non-breaking corrections (label changes, description updates, default value fixes)
```

### 8.2 Version Immutability

Once a template version reaches PUBLISHED status, its `definition_json` is immutable.

No modification may be applied to a published version. All changes require authoring a new version.

### 8.3 Version History

All template versions are retained indefinitely. The Template Registry maintains a complete version history for:

- Rollback support
- Audit trail
- Compliance verification
- Support and debugging

### 8.4 Version Compatibility Matrix

The Template Registry maintains a compatibility matrix recording:

- Which CBOS Core version range each template version supports
- Which prior template versions each version can upgrade from directly
- Whether migration scripts are required

### 8.5 Breaking Change Policy

A major version increment is required when any of the following changes occur:

- A field is removed or its type is changed
- A workflow is removed or its trigger contract changes
- A role is removed
- A required permission is removed
- A module is restructured in a way that changes installation-time behavior

---

## 9. Multi-Tenant Rules

All template behavior must comply with CBOS Core multi-tenant rules.

### 9.1 Installation Scoping

Every configuration record produced by a template installation carries the `organization_id` of the installing organization. No template record may reference another organization's data.

### 9.2 Template Registry Isolation

The Template Registry itself is a platform-level service. Templates in the registry are not organization-owned. They are platform assets or partner-contributed assets.

The distinction is:

| Scope | Entity | Owner |
|---|---|---|
| Platform | BusinessTemplate, TemplateVersion | CBOS Platform |
| Organization | FieldDefinition, WorkflowDefinition, Role, FormDefinition | Installing Organization |

### 9.3 Cross-Organization Template Prohibition

A template may not reference data, workflows, users, clients, or projects from any other organization. Every workflow, automation, and form definition installed from a template operates exclusively within the organization boundary.

### 9.4 Reporting Isolation

Template-defined reports may only query data belonging to the installing organization. No cross-organization analytics may be exposed through template reports.

### 9.5 Template Removal

When a template is uninstalled from an organization:

- All template-produced configuration records are deactivated or removed per the uninstall policy
- Historical data (field values, workflow executions, form submissions) created while the template was active is retained for audit and compliance purposes
- Active projects of template-defined project types must be migrated or completed before the template may be fully removed

---

## 10. Security Rules

### 10.1 Template Authorship

Templates authored by Platform must be reviewed and approved through the platform governance process before publication.

Templates authored by Partners must pass automated security validation before publication.

Templates authored by Organizations are scoped to that organization only and do not appear in the shared Template Marketplace.

### 10.2 Installation Authorization

Only users with the `TemplateAdmin` permission may install or uninstall templates within an organization.

Only Platform Operators may publish, deprecate, or archive templates in the Template Registry.

### 10.3 Permission Scope Restriction

Template-defined roles may not grant permissions that exceed the permission scope available to the installing organization's subscription plan.

Template-defined roles may not grant platform-level administrative permissions.

### 10.4 Workflow Security

Template workflows are subject to the same security rules as organization-authored workflows as defined in the Workflow Engine Architecture (Document 08):

- Finance mutation actions require approval gates
- Sensitive communications require authorized actors
- External API callbacks must use least-privilege service identities

### 10.5 Field Data Security

Custom fields defined by templates that collect personally identifiable information must be flagged with `is_pii: true` in the field definition. The platform applies masking, access control, and retention policies to PII-flagged fields.

### 10.6 Audit Requirements

Every template installation, upgrade, rollback, and uninstall event must be recorded with:

- Actor (user ID and role)
- Timestamp
- Organization ID
- Template ID and version
- Action type
- Outcome (success or failure with reason)

---

## 11. Future Expansion Strategy

### 11.1 New Industry Onboarding

Adding support for a new industry requires only the authoring and publishing of a new Business Template. No CBOS Core changes are required, provided the new industry fits the project-centric, client-serving model.

New industry templates may be created by:
- The CBOS Platform team
- Certified partner agencies
- Organizations for their own use

### 11.2 Template Marketplace

The Template Marketplace is the discovery and distribution channel for Business Templates.

Future marketplace capabilities:

- Ratings and reviews by installing organizations
- Template categories and tags
- Featured templates for common industries
- Partner-certified templates with support SLAs
- AI-generated template recommendations based on organization profile

### 11.3 AI-Assisted Template Authoring

AI capabilities will be extended to assist template authors in:

- Generating initial template scaffolds from a plain-language industry description
- Identifying missing workflows or forms based on industry best practices
- Suggesting field types based on data patterns
- Validating template completeness before publication

### 11.4 Template Composition

Future support for template composition will allow organizations to install a base template and layered extension templates simultaneously, each contributing non-conflicting modules.

### 11.5 Template Analytics

The platform will provide template authors with anonymized, aggregate analytics on:

- Installation volume by template and version
- Most-used and least-used template components
- Upgrade adoption rates
- Common customization patterns applied post-installation

This enables continuous template improvement without requiring platform changes.

---

## 12. Example Templates

### 12.1 Photography Studio Template

**Template Code:** `photography-studio`
**Industry Category:** Photography

#### Project Types

| Code | Name |
|---|---|
| wedding | Wedding |
| maternity | Maternity |
| newborn | Newborn |
| family | Family |
| corporate-shoot | Corporate Shoot |

#### Roles

| Code | Name | Description |
|---|---|---|
| photographer | Photographer | Leads shoot execution |
| editor | Editor | Post-production editing |
| studio-manager | Studio Manager | Operations and scheduling |
| sales-executive | Sales Executive | Lead management and bookings |

#### Workflows

**Lead to Booking Workflow**

```
Lead Created
↓
Consultation Scheduled
↓
Proposal Sent
↓
Booking Confirmed
↓
Contract Signed
↓
Advance Invoice Sent
```

**Shoot Workflow**

```
Shoot Planned
↓
Location Confirmed
↓
Equipment Assigned
↓
Shoot Executed
↓
Raw Assets Uploaded
↓
Shoot Completed
```

**Editing Workflow**

```
Assets Received
↓
Culling Completed
↓
Editing In Progress
↓
Internal Review
↓
Client Proof Ready
```

**Delivery Workflow**

```
Client Proof Approved
↓
Final Gallery Created
↓
Gallery Delivered to Client
↓
Final Invoice Sent
↓
Delivery Confirmed
↓
Project Closed
```

#### Forms

| Code | Name | Entity |
|---|---|---|
| client-intake | Client Intake | Client |
| shoot-planning | Shoot Planning | Project |
| delivery-confirmation | Delivery Confirmation | Deliverable |

#### Custom Fields (Project)

| Field | Type |
|---|---|
| shoot_date | date |
| shoot_location | text |
| photographer_notes | textarea |
| no_of_edited_images | number |
| delivery_format | select |
| raw_images_retained | boolean |

#### Dashboards

| Code | Name | Audience Role |
|---|---|---|
| studio-dashboard | Studio Dashboard | studio-manager |
| photographer-dashboard | Photographer Dashboard | photographer |
| sales-dashboard | Sales Dashboard | sales-executive |

---

### 12.2 Marketing Agency Template

**Template Code:** `marketing-agency`
**Industry Category:** Marketing

#### Project Types

| Code | Name |
|---|---|
| campaign | Campaign |
| content-production | Content Production |
| social-media-management | Social Media Management |

#### Roles

| Code | Name | Description |
|---|---|---|
| account-manager | Account Manager | Client relationship and project oversight |
| designer | Designer | Visual creative production |
| copywriter | Copywriter | Content and copy production |
| media-buyer | Media Buyer | Paid media planning and execution |

#### Workflows

**Proposal Workflow**

```
Brief Received
↓
Internal Discovery
↓
Proposal Drafted
↓
Internal Approval
↓
Proposal Sent to Client
↓
Client Approved / Rejected
```

**Approval Workflow**

```
Creative Submitted
↓
Account Manager Review
↓
Client Review
↓
Revision Requested / Approved
↓
Final Sign-Off
```

**Production Workflow**

```
Brief Confirmed
↓
Asset Production
↓
Quality Review
↓
Client Delivery
↓
Campaign Launch
↓
Performance Review
```

#### Forms

| Code | Name | Entity |
|---|---|---|
| creative-brief | Creative Brief | Project |
| campaign-intake | Campaign Intake | Engagement |

#### Custom Fields (Project)

| Field | Type |
|---|---|
| campaign_budget | currency |
| target_audience | textarea |
| campaign_channels | multi_select |
| campaign_start_date | date |
| campaign_end_date | date |
| kpi_target | text |

#### Dashboards

| Code | Name | Audience Role |
|---|---|---|
| campaign-dashboard | Campaign Dashboard | account-manager |
| client-dashboard | Client Dashboard | account-manager |

---

### 12.3 Podcast Studio Template

**Template Code:** `podcast-studio`
**Industry Category:** Audio Production

#### Project Types

| Code | Name |
|---|---|
| episode | Episode |
| season | Season |
| interview | Interview |

#### Roles

| Code | Name | Description |
|---|---|---|
| producer | Producer | Show production oversight |
| host | Host | Recording and guest coordination |
| editor | Editor | Audio editing and post-production |

#### Workflows

**Recording Workflow**

```
Episode Planned
↓
Guest Confirmed
↓
Recording Scheduled
↓
Recording Completed
↓
Raw Audio Uploaded
```

**Editing Workflow**

```
Raw Audio Received
↓
Editing In Progress
↓
Internal Review
↓
Producer Approved
↓
Master Audio Ready
```

**Publishing Workflow**

```
Show Notes Written
↓
Artwork Uploaded
↓
Platform Upload Scheduled
↓
Episode Published
↓
Social Promotion Triggered
```

#### Forms

| Code | Name | Entity |
|---|---|---|
| guest-intake | Guest Intake | Client |
| episode-planning | Episode Planning | Project |

#### Custom Fields (Project)

| Field | Type |
|---|---|
| episode_number | number |
| season_number | number |
| guest_name | text |
| recording_date | date |
| duration_minutes | number |
| sponsor_name | text |

#### Dashboards

| Code | Name | Audience Role |
|---|---|---|
| publishing-dashboard | Publishing Dashboard | producer |
| production-dashboard | Production Dashboard | editor |

---

### 12.4 Production House Template

**Template Code:** `production-house`
**Industry Category:** Video Production

#### Project Types

| Code | Name |
|---|---|
| commercial | Commercial |
| documentary | Documentary |
| event-production | Event Production |

#### Roles

| Code | Name | Description |
|---|---|---|
| producer | Producer | Overall production oversight |
| director | Director | Creative and on-set direction |
| cameraperson | Cameraperson | Camera operation |
| editor | Editor | Post-production editing |

#### Workflows

**Pre-Production Workflow**

```
Brief Received
↓
Script / Treatment Developed
↓
Location Scouting
↓
Crew Assigned
↓
Equipment Reserved
↓
Call Sheet Issued
```

**Production Workflow**

```
Shoot Day Confirmed
↓
On-Site Setup
↓
Principal Photography
↓
Raw Footage Uploaded
↓
Director Sign-Off
```

**Post-Production Workflow**

```
Raw Footage Received
↓
Offline Edit
↓
Client Review Cut
↓
Revisions Applied
↓
Color Grading
↓
Audio Mix
↓
Final Delivery
```

#### Forms

| Code | Name | Entity |
|---|---|---|
| production-brief | Production Brief | Project |
| location-checklist | Location Checklist | Project |

#### Custom Fields (Project)

| Field | Type |
|---|---|
| shoot_days | number |
| crew_size | number |
| location_name | text |
| shoot_format | select |
| delivery_format | select |
| aspect_ratio | select |

#### Dashboards

| Code | Name | Audience Role |
|---|---|---|
| production-dashboard | Production Dashboard | producer |

---

### 12.5 Multi-Industry Validation

The following table validates that the same CBOS Core can simultaneously support all four example industries without requiring new core entities:

| Capability | CBOS Core Entity Used | Photography | Agency | Podcast | Production |
|---|---|---|---|---|---|
| Project categorization | ProjectType (Config Engine) | ✓ | ✓ | ✓ | ✓ |
| Client management | Client | ✓ | ✓ | ✓ | ✓ |
| Sales pipeline | Lead, Opportunity | ✓ | ✓ | ✓ | ✓ |
| Booking / engagement | Engagement | ✓ | ✓ | ✓ | ✓ |
| Project execution | Project | ✓ | ✓ | ✓ | ✓ |
| Task management | Task | ✓ | ✓ | ✓ | ✓ |
| Industry-specific fields | FieldDefinition | ✓ | ✓ | ✓ | ✓ |
| File / media management | Asset, Gallery | ✓ | ✓ | ✓ | ✓ |
| Invoicing | Invoice, Payment | ✓ | ✓ | ✓ | ✓ |
| Workflows | WorkflowDefinition | ✓ | ✓ | ✓ | ✓ |
| Approvals | WorkflowApproval | ✓ | ✓ | ✓ | ✓ |
| Communication | Conversation, Message | ✓ | ✓ | ✓ | ✓ |
| Forms | FormDefinition | ✓ | ✓ | ✓ | ✓ |
| Roles | Role | ✓ | ✓ | ✓ | ✓ |
| Dashboards | DashboardConfiguration | ✓ | ✓ | ✓ | ✓ |

**Validation Result: CONFIRMED.**

All four industries operate on the same CBOS Core entities. No new core entities are required. Industry differentiation is expressed entirely through template-installed configuration.

---

## 13. Architectural Laws

The following laws are the constitutional rules governing the Business Template Architecture. They are permanent and non-negotiable.

### Law 1: Core Is Inviolable

No Business Template may modify, extend the schema of, or bypass any CBOS Core domain entity, API contract, or business rule.

### Law 2: Templates Are Configuration

A Business Template is a package of metadata and configuration. It is not code. It contains no executable logic outside of workflow definitions expressed through the Workflow Engine's configuration schema.

### Law 3: Templates Are Scoped to Organizations

Every configuration record produced by a template installation belongs exclusively to the installing organization. No template produces platform-level records.

### Law 4: Templates Are Versioned and Immutable

Published template versions are immutable. All changes require a new version. Version history is permanent.

### Law 5: Templates May Not Cross Tenant Boundaries

No template definition, workflow, field, form, role, or dashboard may reference, access, or expose data from any organization other than the installing organization.

### Law 6: Templates Are Additive

Templates add configuration to an organization. They do not remove or override core configuration. In the event of conflict between a template and a core configuration, core configuration takes precedence.

### Law 7: Multiple Templates May Coexist

An organization may install multiple templates simultaneously. Template authors must declare all configuration codes in their templates to enable conflict detection.

### Law 8: Upgrades Must Preserve Organization Customizations

When a template is upgraded, organization-level customizations applied on top of template-provided configuration must be preserved where compatible. Incompatible customizations must be surfaced for resolution before the upgrade completes.

### Law 9: Rollback Must Be Safe

Every template installation must be reversible. The platform must be capable of returning an organization to any prior installed version without data loss of business records.

### Law 10: Security Is Non-Negotiable

Template-defined roles may not grant permissions that exceed the installing organization's subscription entitlements. Template-defined workflows must comply with all Workflow Engine security rules. Templates may not embed secrets, credentials, or platform-bypassing logic of any kind.

### Law 11: The Project Remains Central

All template-defined operational behavior must connect to CBOS Core's Project entity as its primary operational anchor. Templates may not introduce parallel business execution hierarchies that bypass the Project aggregate.

### Law 12: AI May Assist, Not Govern

AI may assist in template authoring, suggest optimizations, and recommend configurations. AI may not autonomously publish templates, modify installed configurations, or alter role permissions without human authorization.

---

## Constitutional Statement

The Business Template Architecture shall allow CBOS to serve every creative and professional service industry through installable, versioned, organization-scoped templates that express all industry-specific behavior through metadata and configuration, while the CBOS Core Platform remains permanent, universal, and unchanged.

---

*Document Version: 1.0*
*Status: Approved for Implementation*
*Authority: Chief Platform Architect*
