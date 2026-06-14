export interface ErrorDetail {
  code: string
  message: string
  field?: string
}

export interface PaginationMeta {
  total: number
  page: number
  page_size: number
  next_cursor: string | null
  has_more: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  meta: PaginationMeta | Record<string, unknown> | null
  errors: ErrorDetail[] | null
  correlation_id: string | null
  timestamp: string
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

export type ID = string
