import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import Inventory from '../Inventory'

// Mock de Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}))

// Mock del hook useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, userProfile: null, loading: false })
}))

// Mock del hook useToast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}))

// Mock del componente ProductModal
vi.mock('@/components/Inventory/ProductModal', () => ({
  ProductModal: () => <div data-testid="product-modal">Product Modal</div>
}))

describe('Inventory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render inventory component without crashing', async () => {
    await act(async () => {
      render(<Inventory />)
    })
    
    // Should render without throwing errors
    expect(document.body).toBeInTheDocument()
  })
})
