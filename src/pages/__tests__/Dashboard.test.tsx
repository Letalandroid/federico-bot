import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '../Dashboard'
import { createMockUser, createMockProfile, createMockEquipment } from '@/test/utils/test-utils'

// Mock de Supabase
const mockSupabase = {
  from: vi.fn(),
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}))

// Mock del hook useAuth
const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}))

// Mock del hook useToast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: createMockUser(),
      userProfile: createMockProfile(),
      loading: false
    })
  })

  it('should render dashboard title and description', () => {
    render(<Dashboard />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Resumen general del inventario de equipos tecnológicos')).toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    const mockLimit = vi.fn()
    
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockReturnValue({ limit: mockLimit })
    mockLimit.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    render(<Dashboard />)
    
    // Should show loading skeletons
    expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0)
  })

  it('should display equipment statistics', async () => {
    const mockEquipment = [
      createMockEquipment({ state: 'disponible', quantity: 10, available_quantity: 8 }),
      createMockEquipment({ state: 'en_uso', quantity: 5, available_quantity: 2 }),
      createMockEquipment({ state: 'mantenimiento', quantity: 3, available_quantity: 0 }),
      createMockEquipment({ state: 'dañado', quantity: 2, available_quantity: 0 }),
      createMockEquipment({ state: 'disponible', quantity: 1, available_quantity: 1 }), // Low stock
    ]

    const mockMovements = [
      {
        id: '1',
        action: 'create',
        created_at: '2024-01-01T00:00:00Z',
        equipment: { name: 'Test Equipment' },
        profiles: { full_name: 'Test User' }
      }
    ]

    const mockUsers = [
      { is_active: true },
      { is_active: true },
      { is_active: false }
    ]

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    const mockLimit = vi.fn()
    const mockEq = vi.fn()
    
    mockSelect
      .mockReturnValueOnce({ order: mockOrder }) // equipment query
      .mockReturnValueOnce({ order: mockOrder }) // movements query
      .mockReturnValueOnce({}) // users query
    
    mockOrder
      .mockReturnValueOnce({ limit: mockLimit }) // movements query
      .mockReturnValueOnce({}) // equipment query
    
    mockLimit.mockResolvedValue({ data: mockMovements, error: null })
    
    mockSupabase.from
      .mockReturnValueOnce({ select: mockSelect }) // equipment
      .mockReturnValueOnce({ select: mockSelect }) // movements
      .mockReturnValueOnce({ select: mockSelect }) // users

    // Mock equipment query
    mockSelect.mockResolvedValueOnce({ data: mockEquipment, error: null })
    // Mock movements query
    mockSelect.mockResolvedValueOnce({ data: mockMovements, error: null })
    // Mock users query
    mockSelect.mockResolvedValueOnce({ data: mockUsers, error: null })

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument() // Total equipment
    })

    expect(screen.getByText('2')).toBeInTheDocument() // Available equipment
    expect(screen.getByText('1')).toBeInTheDocument() // In use equipment
    expect(screen.getByText('1')).toBeInTheDocument() // Maintenance equipment
    expect(screen.getByText('1')).toBeInTheDocument() // Damaged equipment
    expect(screen.getByText('1')).toBeInTheDocument() // Low stock equipment
    expect(screen.getByText('2')).toBeInTheDocument() // Active users
  })

  it('should display stat cards with correct information', async () => {
    const mockEquipment = [createMockEquipment()]
    const mockMovements = []
    const mockUsers = []

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    const mockLimit = vi.fn()
    
    mockSelect
      .mockReturnValueOnce({ order: mockOrder })
      .mockReturnValueOnce({ order: mockOrder })
      .mockReturnValueOnce({})
    
    mockOrder
      .mockReturnValueOnce({ limit: mockLimit })
      .mockReturnValueOnce({})
    
    mockLimit.mockResolvedValue({ data: mockMovements, error: null })
    
    mockSupabase.from
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelect })

    mockSelect
      .mockResolvedValueOnce({ data: mockEquipment, error: null })
      .mockResolvedValueOnce({ data: mockMovements, error: null })
      .mockResolvedValueOnce({ data: mockUsers, error: null })

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Total de Equipos')).toBeInTheDocument()
      expect(screen.getByText('Equipos Disponibles')).toBeInTheDocument()
      expect(screen.getByText('Equipos en Mantenimiento')).toBeInTheDocument()
      expect(screen.getByText('Equipos Dañados')).toBeInTheDocument()
      expect(screen.getByText('Bajo Stock')).toBeInTheDocument()
      expect(screen.getByText('Usuarios Activos')).toBeInTheDocument()
    })
  })

  it('should display recent movements', async () => {
    const mockEquipment = []
    const mockMovements = [
      {
        id: '1',
        action: 'create',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        equipment: { name: 'Test Equipment' },
        profiles: { full_name: 'Test User' }
      },
      {
        id: '2',
        action: 'update',
        created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        equipment: { name: 'Another Equipment' },
        profiles: { full_name: 'Another User' }
      }
    ]
    const mockUsers = []

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    const mockLimit = vi.fn()
    
    mockSelect
      .mockReturnValueOnce({ order: mockOrder })
      .mockReturnValueOnce({ order: mockOrder })
      .mockReturnValueOnce({})
    
    mockOrder
      .mockReturnValueOnce({ limit: mockLimit })
      .mockReturnValueOnce({})
    
    mockLimit.mockResolvedValue({ data: mockMovements, error: null })
    
    mockSupabase.from
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelect })

    mockSelect
      .mockResolvedValueOnce({ data: mockEquipment, error: null })
      .mockResolvedValueOnce({ data: mockMovements, error: null })
      .mockResolvedValueOnce({ data: mockUsers, error: null })

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Actividad Reciente')).toBeInTheDocument()
      expect(screen.getByText('Creado: Test Equipment')).toBeInTheDocument()
      expect(screen.getByText('Actualizado: Another Equipment')).toBeInTheDocument()
    })
  })

  it('should display no recent activity when no movements', async () => {
    const mockEquipment = []
    const mockMovements = []
    const mockUsers = []

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    const mockLimit = vi.fn()
    
    mockSelect
      .mockReturnValueOnce({ order: mockOrder })
      .mockReturnValueOnce({ order: mockOrder })
      .mockReturnValueOnce({})
    
    mockOrder
      .mockReturnValueOnce({ limit: mockLimit })
      .mockReturnValueOnce({})
    
    mockLimit.mockResolvedValue({ data: mockMovements, error: null })
    
    mockSupabase.from
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelect })

    mockSelect
      .mockResolvedValueOnce({ data: mockEquipment, error: null })
      .mockResolvedValueOnce({ data: mockMovements, error: null })
      .mockResolvedValueOnce({ data: mockUsers, error: null })

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('No hay actividad reciente')).toBeInTheDocument()
    })
  })

  it('should handle errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    const mockLimit = vi.fn()
    
    mockSelect
      .mockReturnValueOnce({ order: mockOrder })
      .mockReturnValueOnce({ order: mockOrder })
      .mockReturnValueOnce({})
    
    mockOrder
      .mockReturnValueOnce({ limit: mockLimit })
      .mockReturnValueOnce({})
    
    mockLimit.mockResolvedValue({ data: [], error: null })
    
    mockSupabase.from
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelect })

    mockSelect
      .mockRejectedValueOnce(new Error('Database error'))
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    render(<Dashboard />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching dashboard stats:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('should have clickable stat cards with links', async () => {
    const mockEquipment = [createMockEquipment()]
    const mockMovements = []
    const mockUsers = []

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    const mockLimit = vi.fn()
    
    mockSelect
      .mockReturnValueOnce({ order: mockOrder })
      .mockReturnValueOnce({ order: mockOrder })
      .mockReturnValueOnce({})
    
    mockOrder
      .mockReturnValueOnce({ limit: mockLimit })
      .mockReturnValueOnce({})
    
    mockLimit.mockResolvedValue({ data: mockMovements, error: null })
    
    mockSupabase.from
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelect })

    mockSelect
      .mockResolvedValueOnce({ data: mockEquipment, error: null })
      .mockResolvedValueOnce({ data: mockMovements, error: null })
      .mockResolvedValueOnce({ data: mockUsers, error: null })

    render(<Dashboard />)

    await waitFor(() => {
      const inventoryLink = screen.getByRole('link', { name: /total de equipos/i })
      expect(inventoryLink).toHaveAttribute('href', '/inventory')
    })
  })
})
