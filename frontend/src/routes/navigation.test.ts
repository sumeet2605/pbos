import { describe, expect, it } from 'vitest'
import { getPageTitle, getSelectedNavKey } from '@/routes/navigation'

describe('navigation helpers', () => {
  it('maps nested routes to top-level navigation keys', () => {
    expect(getSelectedNavKey('/clients/123')).toBe('/clients')
    expect(getSelectedNavKey('/projects/new')).toBe('/projects')
    expect(getSelectedNavKey('/audit')).toBe('/audit')
  })

  it('returns page titles for key routes', () => {
    expect(getPageTitle('/dashboard')).toBe('Dashboard')
    expect(getPageTitle('/clients/new')).toBe('Create Client')
    expect(getPageTitle('/clients/123/edit')).toBe('Edit Client')
    expect(getPageTitle('/projects/123')).toBe('Project Detail')
    expect(getPageTitle('/projects/123/edit')).toBe('Edit Project')
  })
})
