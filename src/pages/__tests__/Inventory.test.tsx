import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Inventory from '../Inventory'
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
const mockToast = vi.fn()
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}))

// Mock del componente ProductModal
vi.mock('@/components/Inventory/ProductModal', () => ({
  ProductModal: ({ isOpen, onClose, product, onSave }: any) => 
    isOpen ? (
      <div data-testid="product-modal">
        <button onClick={onClose}>Close Modal</button>
        <button onClick={() => { onSave(); onClose(); }}>Save</button>
        {product && <span>Editing: {product.name}</span>}
      </div>
    ) : null
}))

describe('Inventory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: createMockUser(),
      userProfile: createMockProfile(),
      loading: false
    })
  })

  it('should render inventory title and description', () => {
    render(<Inventory />)
    
    expect(screen.getByText('Inventario')).toBeInTheDocument()
    expect(screen.getByText('Gestiona los equipos tecnológicos de la institución')).toBeInTheDocument()
  })

  it('should show loading state initially', () => {
    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    render(<Inventory />)
    
    // Should show loading skeleton
    expect(screen.getByText('Inventario')).toBeInTheDocument()
  })

  it('should display equipment list', async () => {
    const mockEquipment = [
      createMockEquipment({
        id: '1',
        name: 'Laptop Dell',
        description: 'Laptop para desarrollo',
        brand: 'Dell',
        model: 'Inspiron 15',
        serial_number: 'DL123456',
        quantity: 10,
        available_quantity: 8,
        state: 'disponible',
        categories: { name: 'Computadoras' }
      }),
      createMockEquipment({
        id: '2',
        name: 'Proyector Epson',
        description: 'Proyector para aulas',
        brand: 'Epson',
        model: 'PowerLite 1781W',
        serial_number: 'EP789012',
        quantity: 5,
        available_quantity: 3,
        state: 'en_uso',
        categories: { name: 'Proyectores' }
      })
    ]

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockResolvedValue({ data: mockEquipment, error: null })
    
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    render(<Inventory />)

    await waitFor(() => {
      expect(screen.getByText('Laptop Dell')).toBeInTheDocument()
      expect(screen.getByText('Proyector Epson')).toBeInTheDocument()
      expect(screen.getByText('Laptop para desarrollo')).toBeInTheDocument()
      expect(screen.getByText('Proyector para aulas')).toBeInTheDocument()
    })

    expect(screen.getByText('Computadoras')).toBeInTheDocument()
    expect(screen.getByText('Proyectores')).toBeInTheDocument()
    expect(screen.getByText('Dell')).toBeInTheDocument()
    expect(screen.getByText('Epson')).toBeInTheDocument()
    expect(screen.getByText('DL123456')).toBeInTheDocument()
    expect(screen.getByText('EP789012')).toBeInTheDocument()
  })

  it('should filter equipment by search term', async () => {
    const mockEquipment = [
      createMockEquipment({
        id: '1',
        name: 'Laptop Dell',
        brand: 'Dell',
        model: 'Inspiron 15'
      }),
      createMockEquipment({
        id: '2',
        name: 'Proyector Epson',
        brand: 'Epson',
        model: 'PowerLite 1781W'
      })
    ]

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockResolvedValue({ data: mockEquipment, error: null })
    
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    render(<Inventory />)

    await waitFor(() => {
      expect(screen.getByText('Laptop Dell')).toBeInTheDocument()
      expect(screen.getByText('Proyector Epson')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Buscar por nombre, marca o modelo...')
    await userEvent.type(searchInput, 'Dell')

    expect(screen.getByText('Laptop Dell')).toBeInTheDocument()
    expect(screen.queryByText('Proyector Epson')).not.toBeInTheDocument()
  })

  it('should filter equipment by state', async () => {
    const mockEquipment = [
      createMockEquipment({
        id: '1',
        name: 'Laptop Dell',
        state: 'disponible'
      }),
      createMockEquipment({
        id: '2',
        name: 'Proyector Epson',
        state: 'en_uso'
      })
    ]

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockResolvedValue({ data: mockEquipment, error: null })
    
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    render(<Inventory />)

    await waitFor(() => {
      expect(screen.getByText('Laptop Dell')).toBeInTheDocument()
      expect(screen.getByText('Proyector Epson')).toBeInTheDocument()
    })

    const stateFilter = screen.getByRole('combobox')
    await userEvent.click(stateFilter)
    
    const disponibleOption = screen.getByText('Disponible')
    await userEvent.click(disponibleOption)

    expect(screen.getByText('Laptop Dell')).toBeInTheDocument()
    expect(screen.queryByText('Proyector Epson')).not.toBeInTheDocument()
  })

  it('should open modal when add equipment button is clicked', async () => {
    const mockEquipment = []

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockResolvedValue({ data: mockEquipment, error: null })
    
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    render(<Inventory />)

    await waitFor(() => {
      expect(screen.getByText('Agregar Equipo')).toBeInTheDocument()
    })

    const addButton = screen.getByText('Agregar Equipo')
    await userEvent.click(addButton)

    expect(screen.getByTestId('product-modal')).toBeInTheDocument()
  })

  it('should open modal with equipment data when edit button is clicked', async () => {
    const mockEquipment = [
      createMockEquipment({
        id: '1',
        name: 'Laptop Dell',
        state: 'disponible'
      })
    ]

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockResolvedValue({ data: mockEquipment, error: null })
    
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    render(<Inventory />)

    await waitFor(() => {
      expect(screen.getByText('Laptop Dell')).toBeInTheDocument()
    })

    const editButton = screen.getByRole('button', { name: /edit/i })
    await userEvent.click(editButton)

    expect(screen.getByTestId('product-modal')).toBeInTheDocument()
    expect(screen.getByText('Editing: Laptop Dell')).toBeInTheDocument()
  })

  it('should open delete dialog when delete button is clicked', async () => {
    const mockEquipment = [
      createMockEquipment({
        id: '1',
        name: 'Laptop Dell',
        state: 'disponible'
      })
    ]

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockResolvedValue({ data: mockEquipment, error: null })
    
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    render(<Inventory />)

    await waitFor(() => {
      expect(screen.getByText('Laptop Dell')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /trash/i })
    await userEvent.click(deleteButton)

    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument()
    expect(screen.getByText(/Esta acción no se puede deshacer/)).toBeInTheDocument()
  })

  it('should delete equipment when confirmed', async () => {
    const mockEquipment = [
      createMockEquipment({
        id: '1',
        name: 'Laptop Dell',
        state: 'disponible'
      })
    ]

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    const mockInsert = vi.fn()
    const mockDelete = vi.fn()
    const mockEq = vi.fn()
    
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockResolvedValue({ data: mockEquipment, error: null })
    mockInsert.mockResolvedValue({ error: null })
    mockDelete.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ error: null })
    
    mockSupabase.from
      .mockReturnValueOnce({ select: mockSelect }) // Initial fetch
      .mockReturnValueOnce({ insert: mockInsert }) // Log movement
      .mockReturnValueOnce({ delete: mockDelete }) // Delete equipment
      .mockReturnValueOnce({ select: mockSelect }) // Refetch after delete

    render(<Inventory />)

    await waitFor(() => {
      expect(screen.getByText('Laptop Dell')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /trash/i })
    await userEvent.click(deleteButton)

    const confirmButton = screen.getByRole('button', { name: /eliminar/i })
    await userEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        equipment_id: '1',
        action: 'delete',
        old_values: expect.any(Object),
        changed_by: expect.any(String)
      })
      expect(mockEq).toHaveBeenCalledWith('id', '1')
    })
  })

  it('should display correct state badges', async () => {
    const mockEquipment = [
      createMockEquipment({ id: '1', name: 'Available', state: 'disponible' }),
      createMockEquipment({ id: '2', name: 'In Use', state: 'en_uso' }),
      createMockEquipment({ id: '3', name: 'Maintenance', state: 'mantenimiento' }),
      createMockEquipment({ id: '4', name: 'Damaged', state: 'dañado' }),
      createMockEquipment({ id: '5', name: 'Retired', state: 'baja' })
    ]

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockResolvedValue({ data: mockEquipment, error: null })
    
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    render(<Inventory />)

    await waitFor(() => {
      expect(screen.getByText('Disponible')).toBeInTheDocument()
      expect(screen.getByText('En Uso')).toBeInTheDocument()
      expect(screen.getByText('Mantenimiento')).toBeInTheDocument()
      expect(screen.getByText('Dañado')).toBeInTheDocument()
      expect(screen.getByText('Baja')).toBeInTheDocument()
    })
  })

  it('should handle fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockRejectedValue(new Error('Database error'))
    
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    render(<Inventory />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching equipment:', expect.any(Error))
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "No se pudo cargar el inventario",
        variant: "destructive",
      })
    })

    consoleSpy.mockRestore()
  })

  it('should display equipment count in description', async () => {
    const mockEquipment = [
      createMockEquipment({ id: '1', name: 'Equipment 1' }),
      createMockEquipment({ id: '2', name: 'Equipment 2' })
    ]

    const mockSelect = vi.fn()
    const mockOrder = vi.fn()
    
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockResolvedValue({ data: mockEquipment, error: null })
    
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    render(<Inventory />)

    await waitFor(() => {
      expect(screen.getByText('2 equipos encontrados')).toBeInTheDocument()
    })
  })
})
