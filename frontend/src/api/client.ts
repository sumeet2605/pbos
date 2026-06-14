import { v4 as uuidv4 } from 'uuid'
import { refreshApiV1AuthRefreshPost } from '@/generated/client'
import { client as generatedClient } from '@/generated/client/client.gen'
import type { ErrorDetail, TokenResponse } from '@/generated/client'
import { useAuthStore } from '@/store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const RETRY_HEADER = 'x-cbos-retried'

generatedClient.setConfig({
  baseUrl: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  responseStyle: 'data',
  throwOnError: true,
  auth: () => useAuthStore.getState().accessToken ?? undefined,
})

generatedClient.interceptors.request.use(async (request: Request) => {
  const headers = new Headers(request.headers)
  headers.set('X-Correlation-ID', uuidv4())
  return new Request(request, { headers })
})

let refreshPromise: Promise<string | null> | null = null

generatedClient.interceptors.response.use(async (response: Response, request: Request) => {
  if (
    response.status !== 401 ||
    isAuthRoute(request.url) ||
    request.headers.get(RETRY_HEADER) === '1'
  ) {
    return response
  }

  const { refreshToken, organizationSlug, clearSession } = useAuthStore.getState()
  if (!refreshToken) {
    clearSession()
    redirectToLogin()
    return response
  }

  try {
    const accessToken = await refreshAccessToken(refreshToken, organizationSlug)
    if (!accessToken) {
      clearSession()
      redirectToLogin()
      return response
    }

    const headers = new Headers(request.headers)
    headers.set('Authorization', 'Bearer ' + accessToken)
    headers.set(RETRY_HEADER, '1')
    const retriedResponse = await fetch(new Request(request, { headers }))
    if (retriedResponse.status === 401) {
      clearSession()
      redirectToLogin()
      return retriedResponse
    }

    return retriedResponse
  } catch {
    clearSession()
    redirectToLogin()
    return response
  }
})

function isAuthRoute(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout')
}

function redirectToLogin(): void {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

async function refreshAccessToken(refreshToken: string, organizationSlug: string): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await refreshApiV1AuthRefreshPost({
        body: { refresh_token: refreshToken },
        responseStyle: 'data',
        throwOnError: true,
      })
      const tokens = unwrapData<TokenResponse>(response)
      useAuthStore.getState().setTokens(tokens, organizationSlug)
      return tokens.access_token
    })().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export function unwrapData<T>(result: {
  data: { success?: boolean; data?: T | null; errors?: Array<ErrorDetail> | null }
}): T {
  if (!result.data.success || result.data.data == null) {
    throw new Error(result.data.errors?.[0]?.message ?? 'Request failed')
  }

  return result.data.data
}

export function unwrapPaginated<
  T extends { meta: unknown; errors?: Array<ErrorDetail> | null; success?: boolean; data?: unknown },
>(result: { data: T }
): T {
  if (!result.data.success) {
    throw new Error(result.data.errors?.[0]?.message ?? 'Request failed')
  }

  return result.data
}

export function getApiErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.errors[0]?.message ?? 'Request failed.'
  }

  if (isValidationError(error)) {
    return error.detail[0]?.msg ?? 'Validation failed.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

function isApiError(error: unknown): error is { errors: Array<ErrorDetail> } {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'errors' in error &&
      Array.isArray((error as { errors?: unknown }).errors)
  )
}

function isValidationError(error: unknown): error is { detail: Array<{ msg?: string }> } {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'detail' in error &&
      Array.isArray((error as { detail?: unknown }).detail)
  )
}

export { generatedClient }
