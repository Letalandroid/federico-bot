import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { server } from './mocks/server'

// Suppress React Router warnings
const originalConsoleWarn = console.warn
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('React Router Future Flag Warning') || 
     args[0].includes('v7_startTransition') ||
     args[0].includes('v7_relativeSplatPath'))
  ) {
    return
  }
  originalConsoleWarn(...args)
}

// Suppress React error boundaries warnings in tests
const originalConsoleError = console.error
console.error = (...args) => {
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('Error: useAuth must be used within an AuthProvider') ||
     args[0].includes('The above error occurred in the <TestComponent> component'))
  ) {
    return
  }
  originalConsoleError(...args)
}

// Establecer el servidor de mocks antes de todas las pruebas
beforeAll(() => server.listen())

// Restablecer cualquier request handler que hayamos agregado durante las pruebas
afterEach(() => server.resetHandlers())

// Limpiar después de que todas las pruebas terminen
afterAll(() => server.close())

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock de ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock de IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
