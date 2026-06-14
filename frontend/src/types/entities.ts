export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginPayload {
  email: string
  password: string
  organization_slug: string
}

export interface User {
  id: string
  organization_id: string
  email: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  organization_id: string
  name: string
  code: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  organization_id: string
  client_id: string
  name: string
  code: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface AuditEvent {
  id: string
  organization_id: string
  entity_type: string
  entity_id: string
  action: string
  actor_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ClientFormValues {
  name: string
  code: string
  description?: string
  status: string
}

export interface ProjectFormValues {
  client_id: string
  name: string
  code: string
  description?: string
  status: string
}

export interface AuditEventFilters {
  entityType?: string
  action?: string
}
