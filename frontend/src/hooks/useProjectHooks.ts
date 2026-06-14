import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProject, deleteProject, getProject, listProjects, updateProject } from '@/api/services'
import { queryKeys } from '@/api/queryKeys'
import type { ProjectCreate, ProjectUpdate } from '@/generated/client'

export function useProjectsQuery(page: number, pageSize: number) {
  return useQuery({
    queryKey: queryKeys.projects.list(page, pageSize),
    queryFn: () => listProjects({ page, pageSize }),
  })
}

export function useProjectQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => getProject(id),
    enabled: Boolean(id),
  })
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProjectCreate) => createProject(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.audit.all })
    },
  })
}

export function useUpdateProjectMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProjectUpdate) => updateProject(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(id) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.audit.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.audit.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })
    },
  })
}
