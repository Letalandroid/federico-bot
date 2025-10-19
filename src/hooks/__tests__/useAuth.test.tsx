import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth, AuthProvider } from '../useAuth'
import { createMockUser, createMockProfile } from '@/test/utils/test-utils'

// Mock de Supabase
const mockSupabase = {
  auth: {
    onAuthStateChange: vi.fn(),
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}))

// Mock del hook useToast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should throw error when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')
  })

  it('should initialize with loading state', () => {
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
    expect(result.current.session).toBe(null)
    expect(result.current.userProfile).toBe(null)
  })

  it('should handle successful sign in', async () => {
    const mockUser = createMockUser()
    const mockSession = { user: mockUser, access_token: 'token' }
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    const signInResult = await result.current.signIn('test@example.com', 'password')

    expect(signInResult.error).toBe(null)
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
  })

  it('should handle sign in error', async () => {
    const mockError = { message: 'Invalid credentials' }
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: mockError })

    const { result } = renderHook(() => useAuth(), { wrapper })

    const signInResult = await result.current.signIn('test@example.com', 'wrongpassword')

    expect(signInResult.error).toBe(mockError)
  })

  it('should handle successful sign up', async () => {
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    mockSupabase.auth.signUp.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth(), { wrapper })

    const signUpResult = await result.current.signUp('test@example.com', 'password', 'Test User')

    expect(signUpResult.error).toBe(null)
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      options: {
        emailRedirectTo: expect.stringContaining('/'),
        data: {
          full_name: 'Test User',
        }
      }
    })
  })

  it('should handle sign up error', async () => {
    const mockError = { message: 'Email already registered' }
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    mockSupabase.auth.signUp.mockResolvedValue({ error: mockError })

    const { result } = renderHook(() => useAuth(), { wrapper })

    const signUpResult = await result.current.signUp('test@example.com', 'password', 'Test User')

    expect(signUpResult.error).toBe(mockError)
  })

  it('should handle sign out', async () => {
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    mockSupabase.auth.signOut.mockResolvedValue(undefined)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await result.current.signOut()

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('should fetch user profile when user is authenticated', async () => {
    const mockUser = createMockUser()
    const mockProfile = createMockProfile()
    const mockSession = { user: mockUser, access_token: 'token' }
    
    const mockSelect = vi.fn()
    const mockEq = vi.fn()
    const mockSingle = vi.fn()
    
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSingle.mockResolvedValue({ data: mockProfile, error: null })
    
    mockSupabase.from.mockReturnValue({ select: mockSelect })
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      // Simular cambio de estado de autenticación
      setTimeout(() => callback('SIGNED_IN', mockSession), 0)
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    await waitFor(() => {
      expect(result.current.userProfile).toEqual(mockProfile)
    })
  })

  it('should create default profile when profile does not exist', async () => {
    const mockUser = createMockUser()
    const mockSession = { user: mockUser, access_token: 'token' }
    
    const mockSelect = vi.fn()
    const mockEq = vi.fn()
    const mockSingle = vi.fn()
    const mockInsert = vi.fn()
    
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    mockInsert.mockResolvedValue({ error: null })
    
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'profiles') {
        return { select: mockSelect, insert: mockInsert }
      }
      return { select: mockSelect }
    })
    
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } })
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      setTimeout(() => callback('SIGNED_IN', mockSession), 0)
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        id: mockUser.id,
        user_id: mockUser.id,
        full_name: mockUser.email?.split('@')[0] || 'Usuario',
        role: 'tecnico',
        is_active: true
      })
    })
  })
})
