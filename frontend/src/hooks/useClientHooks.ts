import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient, deleteClient, getClient, listClients, updateClient } from '@/api/services'
import { queryKeys } from '@/api/queryKeys'
import type { ClientCreate, ClientUpdate } from '@/generated/client'

export function useClientsQuery(page: number, pageSize: number) {
  return useQuery({
    queryKey: queryKeys.clients.list(page, pageSize),
    queryFn: () => listClients({ page, pageSize }),
  })
}

export function useClientQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => getClient(id),
    enabled: Boolean(id),
  })
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientCreate) => createClient(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.audit.all })
    },
  })
}

export function useUpdateClientMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientUpdate) => updateClient(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(id) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.audit.all })
    },
  })
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.audit.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}
