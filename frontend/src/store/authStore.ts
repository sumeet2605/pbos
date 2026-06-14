import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { TokenResponse, UserResponse } from '@/generated/client'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  organizationSlug: string
  user: UserResponse | null
  setTokens: (tokens: TokenResponse, organizationSlug: string) => void
  setUser: (user: UserResponse | null) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      organizationSlug: '',
      user: null,
      setTokens: (tokens, organizationSlug) =>
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          organizationSlug,
        }),
      setUser: (user) => set({ user }),
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          organizationSlug: '',
          user: null,
        }),
    }),
    {
      name: 'cbos-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        organizationSlug: state.organizationSlug,
        user: state.user,
      }),
    }
  )
)

export const selectIsAuthenticated = (state: AuthState) => Boolean(state.accessToken)
