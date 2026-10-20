import { describe, expect, it } from 'vitest'
import { canAccess, navForRole } from './nav'

describe('navForRole', () => {
  it('shows workers only operational modules', () => {
    expect(navForRole('worker').map((i) => i.to)).toEqual(['/', '/production', '/livestock'])
  })

  it('hides money from managers', () => {
    expect(navForRole('manager').map((i) => i.to)).not.toContain('/money')
  })

  it('gives owners every module including settings', () => {
    expect(navForRole('owner').map((i) => i.to)).toContain('/settings')
  })

  it('returns nothing without a role', () => {
    expect(navForRole(null)).toEqual([])
  })
})

describe('canAccess', () => {
  it('blocks accountants from settings', () => {
    expect(canAccess('/settings', 'accountant')).toBe(false)
  })

  it('allows accountants into money', () => {
    expect(canAccess('/money', 'accountant')).toBe(true)
  })
})
