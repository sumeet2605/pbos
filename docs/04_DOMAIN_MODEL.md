# CBOS Domain Model Constitution

## Version 1.0

Creative Business Operating System (CBOS)

## Purpose
This document is the constitutional foundation of CBOS. Every database table, API, UI screen, workflow, AI agent, mobile feature, and integration must comply with this document.

## Vision
CBOS is a multi-tenant operating system for creative businesses managing Sales, Projects, Operations, Media, Finance, Marketing, Communications, Analytics and AI.

## Core Principles
1. Everything belongs to an Organization.
2. Projects are the center of the business.
3. Support Photography, Videography, Agencies, Production Houses and future creative businesses.
4. Multi-tenancy is mandatory.
5. Domain boundaries are sacred.

## Ubiquitous Language
- Organization: Paying customer of CBOS
- Branch: Physical or logical operating unit
- Client: Buyer of services
- Engagement: Business relationship with a client
- Project: Unit of execution
- Sub Project: One-level child project
- Deliverable: Output produced for a client

## Bounded Contexts
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
Marketing
Workflow
Analytics
AI
Billing

## Aggregate Roots
Organization
Client
Engagement
Project
Invoice
Campaign
Workflow
Subscription

## Entity Hierarchy
Organization
 ├── Branch
 ├── Team
 ├── Client
 │    └── Engagement
 │         └── Project
 │              └── Sub Project
 │                   ├── Task
 │                   ├── Shoot
 │                   ├── Gallery
 │                   ├── Deliverable
 │                   ├── Invoice
 │                   ├── Payment
 │                   ├── Asset
 │                   ├── Workflow
 │                   └── Communication
 ├── Marketing Campaign
 ├── Subscription
 └── Analytics

## Domain Events
CRM: LeadCreated, LeadAssigned, LeadConverted, QuoteCreated, QuoteAccepted
Client: ClientCreated, ClientUpdated
Engagement: EngagementCreated, EngagementClosed
Project: ProjectCreated, ProjectStarted, ProjectCompleted, ProjectArchived
Operations: ShootScheduled, ShootCompleted, LocationAssigned
Media: GalleryCreated, GalleryDelivered, SelectionCompleted
Finance: InvoiceGenerated, InvoicePaid, PaymentReceived, RefundIssued
Communications: MessageSent, MessageDelivered, CampaignExecuted

## Ownership Rules
- Every entity must contain organization_id.
- Every Project belongs to one Engagement.
- Every Engagement belongs to one Client.
- Every Client belongs to one Organization.

## Multi-Tenant Rules
- No cross-organization reads.
- No cross-organization writes.
- No cross-organization reporting.
- All queries must be organization scoped.

## AI Constitution
AI may recommend, suggest, predict and summarize.
AI may not delete data, issue refunds, send payments or modify finance records without human approval.

## Future Expansion Rules
Support future industries through Industry Packs:
- Photography Pack
- Videography Pack
- Agency Pack
- Production Pack

## Architectural Laws
1. No direct database access from UI.
2. No cross-domain table ownership.
3. Every state change generates a domain event.
4. Every API is organization scoped.
5. Project remains the primary business aggregate.

## Constitutional Statement
CBOS shall remain Project-Centric, Multi-Tenant, Event-Driven, AI-Augmented and Industry-Extensible.