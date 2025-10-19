import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRole } from '../useRole'
import { createMockUser } from '@/test/utils/test-utils'

// Mock de Supabase
const mockSupabase = {
  from: vi.fn(),
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}))

// Mock del hook useAuth
const mockUseAuth = vi.fn()
vi.mock('../useAuth', () => ({
  useAuth: () => mockUseAuth()
}))

describe('useRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return empty roles when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useRole())

    expect(result.current.roles).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isTechnician).toBe(false)
  })

  it('should fetch roles when user is authenticated', async () => {
    const mockUser = createMockUser()
    const mockRoles = [
      { role: 'administrador' },
      { role: 'tecnico' }
    ]

    const mockSelect = vi.fn()
    const mockEq = vi.fn()
    
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: mockRoles, error: null })
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    mockUseAuth.mockReturnValue({ user: mockUser })

    const { result } = renderHook(() => useRole())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.roles).toEqual(['administrador', 'tecnico'])
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isTechnician).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledWith('user_roles')
    expect(mockSelect).toHaveBeenCalledWith('role')
    expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id)
  })

  it('should handle empty roles response', async () => {
    const mockUser = createMockUser()

    const mockSelect = vi.fn()
    const mockEq = vi.fn()
    
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: [], error: null })
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    mockUseAuth.mockReturnValue({ user: mockUser })

    const { result } = renderHook(() => useRole())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.roles).toEqual([])
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isTechnician).toBe(false)
  })

  it('should handle roles fetch error', async () => {
    const mockUser = createMockUser()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const mockSelect = vi.fn()
    const mockEq = vi.fn()
    
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: null, error: new Error('Database error') })
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    mockUseAuth.mockReturnValue({ user: mockUser })

    const { result } = renderHook(() => useRole())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.roles).toEqual([])
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isTechnician).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching roles:', expect.any(Error))

    consoleSpy.mockRestore()
  })

  it('should correctly identify admin role', async () => {
    const mockUser = createMockUser()
    const mockRoles = [{ role: 'administrador' }]

    const mockSelect = vi.fn()
    const mockEq = vi.fn()
    
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: mockRoles, error: null })
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    mockUseAuth.mockReturnValue({ user: mockUser })

    const { result } = renderHook(() => useRole())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.roles).toEqual(['administrador'])
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isTechnician).toBe(false)
    expect(result.current.hasRole('administrador')).toBe(true)
    expect(result.current.hasRole('tecnico')).toBe(false)
  })

  it('should correctly identify technician role', async () => {
    const mockUser = createMockUser()
    const mockRoles = [{ role: 'tecnico' }]

    const mockSelect = vi.fn()
    const mockEq = vi.fn()
    
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: mockRoles, error: null })
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    mockUseAuth.mockReturnValue({ user: mockUser })

    const { result } = renderHook(() => useRole())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.roles).toEqual(['tecnico'])
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isTechnician).toBe(true)
    expect(result.current.hasRole('administrador')).toBe(false)
    expect(result.current.hasRole('tecnico')).toBe(true)
  })

  it('should handle multiple roles', async () => {
    const mockUser = createMockUser()
    const mockRoles = [
      { role: 'administrador' },
      { role: 'tecnico' }
    ]

    const mockSelect = vi.fn()
    const mockEq = vi.fn()
    
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: mockRoles, error: null })
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    mockUseAuth.mockReturnValue({ user: mockUser })

    const { result } = renderHook(() => useRole())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.roles).toEqual(['administrador', 'tecnico'])
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isTechnician).toBe(true)
    expect(result.current.hasRole('administrador')).toBe(true)
    expect(result.current.hasRole('tecnico')).toBe(true)
  })

  it('should refetch roles when user changes', async () => {
    const mockUser1 = createMockUser({ id: 'user1' })
    const mockUser2 = createMockUser({ id: 'user2' })
    const mockRoles1 = [{ role: 'tecnico' }]
    const mockRoles2 = [{ role: 'administrador' }]

    const mockSelect = vi.fn()
    const mockEq = vi.fn()
    
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq
      .mockResolvedValueOnce({ data: mockRoles1, error: null })
      .mockResolvedValueOnce({ data: mockRoles2, error: null })
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    mockUseAuth.mockReturnValue({ user: mockUser1 })

    const { result, rerender } = renderHook(() => useRole())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.roles).toEqual(['tecnico'])

    // Cambiar usuario
    mockUseAuth.mockReturnValue({ user: mockUser2 })
    rerender()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.roles).toEqual(['administrador'])
    expect(mockEq).toHaveBeenCalledTimes(2)
  })
})
