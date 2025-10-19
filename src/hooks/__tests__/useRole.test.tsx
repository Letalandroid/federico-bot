import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRole } from '../useRole'

// Mock de Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}))

// Mock del hook useAuth
vi.mock('../useAuth', () => ({
  useAuth: () => ({ user: null })
}))

describe('useRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return empty roles when user is null', () => {
    const { result } = renderHook(() => useRole())

    expect(result.current.roles).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isTechnician).toBe(false)
  })
})
