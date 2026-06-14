export interface PaginationMeta {
  total: number
  page: number
  page_size: number
  next_cursor: string | null
  has_more: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: PaginationMeta
}

export interface UUID {
  readonly _brand: 'UUID'
}

export type ID = string
