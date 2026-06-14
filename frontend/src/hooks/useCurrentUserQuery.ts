import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCurrentUser } from '@/api/services'
import { queryKeys } from '@/api/queryKeys'
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore'

export function useCurrentUserQuery() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const setUser = useAuthStore((state) => state.setUser)

  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchCurrentUser,
    enabled: isAuthenticated,
    retry: false,
  })

  useEffect(() => {
    if (query.data) {
      setUser(query.data)
    }
  }, [query.data, setUser])

  return query
}
