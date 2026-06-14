export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  clients: {
    all: ['clients'] as const,
    list: (page: number, pageSize: number) => ['clients', 'list', page, pageSize] as const,
    detail: (id: string) => ['clients', 'detail', id] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: (page: number, pageSize: number) => ['projects', 'list', page, pageSize] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
  },
  audit: {
    all: ['audit-events'] as const,
    list: (page: number, pageSize: number, entityType?: string, action?: string) =>
      ['audit-events', 'list', page, pageSize, entityType ?? '', action ?? ''] as const,
  },
}
