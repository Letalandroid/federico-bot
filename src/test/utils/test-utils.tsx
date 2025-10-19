import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthProvider } from '@/hooks/useAuth'
import { TooltipProvider } from '@/components/ui/tooltip'

// Mock de Supabase para testing
const mockSupabase = {
  auth: {
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
    getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    signInWithPassword: vi.fn(() => Promise.resolve({ error: null })),
    signUp: vi.fn(() => Promise.resolve({ error: null })),
    signOut: vi.fn(() => Promise.resolve()),
    getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}

// Mock del módulo de Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}))

// Mock del hook useToast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Helper para crear un usuario mock
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  identities: [],
  factors: [],
  ...overrides,
})

// Helper para crear un perfil mock
export const createMockProfile = (overrides = {}) => ({
  id: 'test-user-id',
  user_id: 'test-user-id',
  full_name: 'Test User',
  role: 'tecnico',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Helper para crear equipo mock
export const createMockEquipment = (overrides = {}) => ({
  id: '1',
  name: 'Test Equipment',
  description: 'Test Description',
  brand: 'Test Brand',
  model: 'Test Model',
  serial_number: 'TEST123',
  quantity: 1,
  available_quantity: 1,
  state: 'disponible' as const,
  category_id: '1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  categories: {
    name: 'Test Category',
  },
  ...overrides,
})

// Helper para crear categoría mock
export const createMockCategory = (overrides = {}) => ({
  id: '1',
  name: 'Test Category',
  description: 'Test Description',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})
