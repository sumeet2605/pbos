import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logout } from '@/api/services'

const { logoutApiV1AuthLogoutPost } = vi.hoisted(() => ({
  logoutApiV1AuthLogoutPost: vi.fn(),
}))

vi.mock('@/generated/client', async () => {
  const actual = await vi.importActual<typeof import('@/generated/client')>('@/generated/client')
  return {
    ...actual,
    logoutApiV1AuthLogoutPost,
  }
})

describe('auth services', () => {
  beforeEach(() => {
    logoutApiV1AuthLogoutPost.mockReset()
  })

  it('calls logout endpoint with refresh token payload', async () => {
    logoutApiV1AuthLogoutPost.mockResolvedValue({ data: null })

    await logout('refresh-token-123')

    expect(logoutApiV1AuthLogoutPost).toHaveBeenCalledWith({
      body: { refresh_token: 'refresh-token-123' },
      responseStyle: 'data',
      throwOnError: true,
    })
  })
})
