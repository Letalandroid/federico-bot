import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('should handle conditional classes', () => {
      expect(cn('px-2', true && 'py-1', false && 'text-red')).toBe('px-2 py-1')
    })

    it('should handle undefined and null values', () => {
      expect(cn('px-2', undefined, null, 'py-1')).toBe('px-2 py-1')
    })

    it('should handle empty strings', () => {
      expect(cn('px-2', '', 'py-1')).toBe('px-2 py-1')
    })

    it('should handle arrays of classes', () => {
      expect(cn(['px-2', 'py-1'], 'text-center')).toBe('px-2 py-1 text-center')
    })

    it('should handle objects with boolean values', () => {
      expect(cn({
        'px-2': true,
        'py-1': false,
        'text-center': true
      })).toBe('px-2 text-center')
    })

    it('should handle mixed inputs', () => {
      expect(cn(
        'px-2',
        ['py-1', 'text-sm'],
        {
          'text-center': true,
          'text-red': false
        },
        'font-bold'
      )).toBe('px-2 py-1 text-sm text-center font-bold')
    })

    it('should deduplicate conflicting classes', () => {
      expect(cn('px-2 px-4')).toBe('px-4')
      expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500')
    })

    it('should handle Tailwind CSS conflicts correctly', () => {
      expect(cn('p-2 p-4 p-6')).toBe('p-6')
      expect(cn('m-2 m-4')).toBe('m-4')
      expect(cn('w-full w-1/2')).toBe('w-1/2')
    })

    it('should return empty string for no inputs', () => {
      expect(cn()).toBe('')
    })

    it('should handle only falsy values', () => {
      expect(cn(false, null, undefined, '')).toBe('')
    })
  })
})
