import { apiGet, apiGetPaginated, apiPost, publicPost } from '@/api/client'
import {
  AuditEvent,
  AuditEventFilters,
  AuthTokens,
  Client,
  ClientFormValues,
  LoginPayload,
  Project,
  ProjectFormValues,
  User,
} from '@/types/entities'
import { PaginatedResult } from '@/types/common'

interface PaginationParams {
  page?: number
  pageSize?: number
}

export function buildPaginationParams({ page = 1, pageSize = 10 }: PaginationParams): {
  skip: number
  limit: number
} {
  return {
    skip: (page - 1) * pageSize,
    limit: pageSize,
  }
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  return publicPost<AuthTokens, LoginPayload>('/auth/login', payload)
}

export async function fetchCurrentUser(): Promise<User> {
  return apiGet<User>('/auth/me')
}

export async function listClients(params: PaginationParams = {}): Promise<PaginatedResult<Client>> {
  return apiGetPaginated<Client>('/clients', {
    params: buildPaginationParams(params),
  })
}

export async function getClient(id: string): Promise<Client> {
  return apiGet<Client>(`/clients/${id}`)
}

export async function createClient(payload: ClientFormValues): Promise<Client> {
  return apiPost<Client, ClientFormValues>('/clients', payload)
}

export async function listProjects(
  params: PaginationParams = {}
): Promise<PaginatedResult<Project>> {
  return apiGetPaginated<Project>('/projects', {
    params: buildPaginationParams(params),
  })
}

export async function getProject(id: string): Promise<Project> {
  return apiGet<Project>(`/projects/${id}`)
}

export async function createProject(payload: ProjectFormValues): Promise<Project> {
  return apiPost<Project, ProjectFormValues>('/projects', payload)
}

export async function listAuditEvents(
  params: PaginationParams & AuditEventFilters = {}
): Promise<PaginatedResult<AuditEvent>> {
  const { entityType, action, ...pagination } = params
  return apiGetPaginated<AuditEvent>('/audit-events', {
    params: {
      ...buildPaginationParams(pagination),
      ...(entityType ? { entity_type: entityType } : {}),
      ...(action ? { action } : {}),
    },
  })
}
