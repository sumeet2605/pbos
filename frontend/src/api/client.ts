import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { v4 as uuidv4 } from 'uuid'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export interface APIResponse<T> {
  success: boolean
  data: T | null
  meta: Record<string, unknown> | null
  errors: { code: string; message: string; field?: string }[] | null
  correlation_id: string | null
  timestamp: string
}

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor: attach auth token and correlation ID
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    config.headers['X-Correlation-ID'] = uuidv4()
    return config
  })

  // Response interceptor: handle 401
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  return instance
}

export const apiClient = createApiClient()

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response: AxiosResponse<APIResponse<T>> = await apiClient.get(url, config)
  if (!response.data.success || response.data.data === null) {
    throw new Error(response.data.errors?.[0]?.message ?? 'Request failed')
  }
  return response.data.data
}

export async function apiPost<T, B = unknown>(
  url: string,
  body: B,
  config?: AxiosRequestConfig
): Promise<T> {
  const response: AxiosResponse<APIResponse<T>> = await apiClient.post(url, body, config)
  if (!response.data.success || response.data.data === null) {
    throw new Error(response.data.errors?.[0]?.message ?? 'Request failed')
  }
  return response.data.data
}

export async function apiPatch<T, B = unknown>(
  url: string,
  body: B,
  config?: AxiosRequestConfig
): Promise<T> {
  const response: AxiosResponse<APIResponse<T>> = await apiClient.patch(url, body, config)
  if (!response.data.success || response.data.data === null) {
    throw new Error(response.data.errors?.[0]?.message ?? 'Request failed')
  }
  return response.data.data
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response: AxiosResponse<APIResponse<T>> = await apiClient.delete(url, config)
  if (!response.data.success || response.data.data === null) {
    throw new Error(response.data.errors?.[0]?.message ?? 'Request failed')
  }
  return response.data.data
}
