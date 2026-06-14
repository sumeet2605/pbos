import { useQuery } from '@tanstack/react-query'
import { listAuditEvents, type AuditEventFilters } from '@/api/services'
import { queryKeys } from '@/api/queryKeys'

export function useAuditEventsQuery(page: number, pageSize: number, filters: AuditEventFilters = {}) {
  return useQuery({
    queryKey: queryKeys.audit.list(page, pageSize, filters.entityType, filters.action),
    queryFn: () =>
      listAuditEvents({
        page,
        pageSize,
        entityType: filters.entityType,
        action: filters.action,
      }),
  })
}
