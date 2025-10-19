import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock data
export const mockUser = {
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
}

export const mockProfile = {
  id: 'test-user-id',
  user_id: 'test-user-id',
  full_name: 'Test User',
  role: 'tecnico',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockEquipment = [
  {
    id: '1',
    name: 'Laptop Dell',
    description: 'Laptop para desarrollo',
    brand: 'Dell',
    model: 'Inspiron 15',
    serial_number: 'DL123456',
    quantity: 10,
    available_quantity: 8,
    state: 'disponible',
    category_id: '1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    categories: {
      name: 'Computadoras',
    },
  },
  {
    id: '2',
    name: 'Proyector Epson',
    description: 'Proyector para aulas',
    brand: 'Epson',
    model: 'PowerLite 1781W',
    serial_number: 'EP789012',
    quantity: 5,
    available_quantity: 3,
    state: 'en_uso',
    category_id: '2',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    categories: {
      name: 'Proyectores',
    },
  },
]

export const mockCategories = [
  {
    id: '1',
    name: 'Computadoras',
    description: 'Equipos de cómputo',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Proyectores',
    description: 'Equipos de proyección',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

export const mockMovements = [
  {
    id: '1',
    equipment_id: '1',
    action: 'create',
    old_values: null,
    new_values: mockEquipment[0],
    changed_by: 'test-user-id',
    created_at: '2024-01-01T00:00:00Z',
    equipment: {
      name: 'Laptop Dell',
    },
    profiles: {
      full_name: 'Test User',
    },
  },
]

// Mock handlers
export const handlers = [
  // Auth endpoints
  http.post('https://zapgeipozaiufwcyhvfa.supabase.co/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: mockUser,
    })
  }),

  http.post('https://zapgeipozaiufwcyhvfa.supabase.co/auth/v1/signup', () => {
    return HttpResponse.json({
      user: mockUser,
      session: {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: mockUser,
      },
    })
  }),

  http.post('https://zapgeipozaiufwcyhvfa.supabase.co/auth/v1/logout', () => {
    return HttpResponse.json({})
  }),

  // Database endpoints
  http.get('https://zapgeipozaiufwcyhvfa.supabase.co/rest/v1/equipment*', () => {
    return HttpResponse.json(mockEquipment)
  }),

  http.post('https://zapgeipozaiufwcyhvfa.supabase.co/rest/v1/equipment', () => {
    return HttpResponse.json(mockEquipment[0])
  }),

  http.patch('https://zapgeipozaiufwcyhvfa.supabase.co/rest/v1/equipment*', () => {
    return HttpResponse.json(mockEquipment[0])
  }),

  http.delete('https://zapgeipozaiufwcyhvfa.supabase.co/rest/v1/equipment*', () => {
    return HttpResponse.json({})
  }),

  http.get('https://zapgeipozaiufwcyhvfa.supabase.co/rest/v1/categories*', () => {
    return HttpResponse.json(mockCategories)
  }),

  http.get('https://zapgeipozaiufwcyhvfa.supabase.co/rest/v1/profiles*', () => {
    return HttpResponse.json([mockProfile])
  }),

  http.get('https://zapgeipozaiufwcyhvfa.supabase.co/rest/v1/equipment_history*', () => {
    return HttpResponse.json(mockMovements)
  }),

  http.post('https://zapgeipozaiufwcyhvfa.supabase.co/rest/v1/equipment_history', () => {
    return HttpResponse.json(mockMovements[0])
  }),
]

export const server = setupServer(...handlers)
