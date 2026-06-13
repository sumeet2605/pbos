# CBOS Entity Model

## Version 1.0

## Identity Domain

### User
Attributes:
- id
- organization_id
- first_name
- last_name
- email
- phone
- status
- created_at

Relationships:
- belongs to Organization
- belongs to Team
- has many Roles

### Role
- id
- organization_id
- name
- description

### Permission
- id
- code
- description

---

## Organization Domain

### Organization
Attributes:
- id
- name
- slug
- industry_type
- timezone
- currency
- subscription_plan

Relationships:
- has many Branches
- has many Teams
- has many Users
- has many Clients

### Branch
- id
- organization_id
- name
- address
- city
- state
- country

### Team
- id
- organization_id
- name
- manager_id

---

## CRM Domain

### Lead
Attributes:
- id
- organization_id
- source
- name
- email
- phone
- status
- assigned_to

States:
NEW
CONTACTED
QUALIFIED
PROPOSAL
WON
LOST

### Opportunity
- id
- lead_id
- estimated_value
- probability
- expected_close_date

---

## Client Domain

### Client
Attributes:
- id
- organization_id
- type
- name
- email
- phone

Relationships:
- has many Contacts
- has many Engagements

### Contact
- id
- client_id
- name
- email
- phone
- designation

---

## Engagement Domain

### Engagement
Attributes:
- id
- client_id
- title
- status
- start_date
- end_date

Relationships:
- has many Projects

---

## Project Domain

### Project
Attributes:
- id
- engagement_id
- branch_id
- project_code
- project_name
- project_type
- status
- start_date
- due_date

Relationships:
- has many SubProjects
- has many Tasks
- has many Shoots
- has many Galleries
- has many Deliverables
- has many Invoices

States:
DRAFT
PLANNED
ACTIVE
ON_HOLD
COMPLETED
ARCHIVED

### SubProject
- id
- parent_project_id
- name
- status

### Task
- id
- project_id
- assigned_to
- priority
- due_date
- status

---

## Photography Domain

### Shoot
- id
- project_id
- shoot_date
- location
- photographer_id
- status

### ShootSetup
- id
- shoot_id
- setup_name
- theme

### Asset
- id
- project_id
- file_name
- storage_path
- mime_type
- size

---

## Gallery Domain

### Gallery
- id
- project_id
- gallery_type
- visibility
- expiry_date

### GalleryImage
- id
- gallery_id
- asset_id
- favorite_count

### Selection
- id
- gallery_id
- selected_by
- selected_at

---

## Deliverable Domain

### Deliverable
- id
- project_id
- type
- version
- delivery_date
- status

---

## Finance Domain

### Quote
- id
- client_id
- project_id
- amount
- status

### Invoice
- id
- project_id
- invoice_number
- amount
- gst_amount
- status

### Payment
- id
- invoice_id
- amount
- payment_mode
- transaction_reference

### Expense
- id
- project_id
- category
- amount

---

## Marketing Domain

### Campaign
- id
- organization_id
- name
- channel
- budget

### CampaignLead
- id
- campaign_id
- lead_id

---

## Communication Domain

### Conversation
- id
- project_id
- client_id
- channel

### Message
- id
- conversation_id
- sender
- content
- sent_at

---

## Workflow Domain

### Workflow
- id
- organization_id
- name
- trigger_type

### WorkflowExecution
- id
- workflow_id
- status
- started_at
- completed_at

---

## AI Domain

### CopilotSession
- id
- organization_id
- user_id
- context_type

### AIRecommendation
- id
- session_id
- recommendation_type
- confidence_score

---

## Subscription Domain

### Subscription
- id
- organization_id
- plan
- status
- renewal_date

---

## Cardinality Summary
Organization -> Clients (1:N)
Client -> Engagements (1:N)
Engagement -> Projects (1:N)
Project -> SubProjects (1:N)
Project -> Tasks (1:N)
Project -> Shoots (1:N)
Project -> Galleries (1:N)
Project -> Deliverables (1:N)
Project -> Invoices (1:N)
Invoice -> Payments (1:N)
Gallery -> Images (1:N)
Workflow -> Executions (1:N)

## Golden Rule
Every business activity in CBOS must ultimately connect back to a Project.