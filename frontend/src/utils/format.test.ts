import { describe, expect, it } from 'vitest'
import { formatIdentifier, formatStatusLabel } from '@/utils/format'

describe('format helpers', () => {
  it('formats long identifiers safely', () => {
    expect(formatIdentifier('1234567890abcdef')).toBe('12345678…cdef')
    expect(formatIdentifier(null)).toBe('—')
  })

  it('formats status labels for display', () => {
    expect(formatStatusLabel('client_create')).toBe('Client Create')
    expect(formatStatusLabel('active')).toBe('Active')
  })
})
