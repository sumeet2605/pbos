import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { useAuthStore } from '@/store/authStore'
import { AuthTokens } from '@/types/entities'
import { ApiResponse, PaginatedResult, PaginationMeta } from '@/types/common'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

type RetriableRequestConfig = AxiosRequestConfig & { _retry?: boolean }

type QueuedRequest = {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const apiClient = createApiClient()

let isRefreshing = false
let queuedRequests: QueuedRequest[] = []

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  instance.interceptors.request.use((config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      config.headers.Authorization = `******
    }
    config.headers['X-Correlation-ID'] = uuidv4()
    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse<unknown>>) => {
      const originalRequest = error.config as RetriableRequestConfig | undefined

      if (
        !originalRequest ||
        error.response?.status !== 401 ||
        originalRequest._retry ||
        isAuthRoute(originalRequest.url)
      ) {
        return Promise.reject(error)
      }

      const { refreshToken, organizationSlug, setTokens, clearSession } = useAuthStore.getState()
      if (!refreshToken) {
        clearSession()
        redirectToLogin()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queuedRequests.push({
            resolve: (token) => {
              applyAuthHeader(originalRequest, token)
              resolve(instance(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const tokens = await refreshAccessToken(refreshToken)
        setTokens(tokens, organizationSlug)
        flushQueuedRequests(tokens.access_token)
        applyAuthHeader(originalRequest, tokens.access_token)
        return instance(originalRequest)
      } catch (refreshError) {
        rejectQueuedRequests(refreshError)
        clearSession()
        redirectToLogin()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
  )

  return instance
}

function isAuthRoute(url?: string): boolean {
  return url?.includes('/auth/login') === true || url?.includes('/auth/refresh') === true
}

function applyAuthHeader(config: AxiosRequestConfig, token: string): void {
  config.headers = config.headers ?? {}
  ;(config.headers as Record<string, string>).Authorization = `******
}

function flushQueuedRequests(token: string): void {
  queuedRequests.forEach((request) => request.resolve(token))
  queuedRequests = []
}

function rejectQueuedRequests(error: unknown): void {
  queuedRequests.forEach((request) => request.reject(error))
  queuedRequests = []
}

function redirectToLogin(): void {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

function unwrapResponse<T>(response: AxiosResponse<ApiResponse<T>>): {
  data: T
  meta: ApiResponse<T>['meta']
} {
  if (!response.data.success || response.data.data === null) {
    throw new Error(response.data.errors?.[0]?.message ?? 'Request failed')
  }

  return {
    data: response.data.data,
    meta: response.data.meta,
  }
}

async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const response = await authClient.post<ApiResponse<AuthTokens>>('/auth/refresh', {
    refresh_token: refreshToken,
  })
  return unwrapResponse(response).data
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    return error.response?.data?.errors?.[0]?.message ?? error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, config)
  return unwrapResponse(response).data
}

export async function apiGetPaginated<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<PaginatedResult<T>> {
  const response = await apiClient.get<ApiResponse<T[]>>(url, config)
  const payload = unwrapResponse(response)
  return {
    data: payload.data,
    meta: payload.meta as PaginationMeta,
  }
}

export async function apiPost<T, B = unknown>(
  url: string,
  body: B,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, body, config)
  return unwrapResponse(response).data
}

export async function publicPost<T, B = unknown>(
  url: string,
  body: B,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await authClient.post<ApiResponse<T>>(url, body, config)
  return unwrapResponse(response).data
}

export { apiClient }
