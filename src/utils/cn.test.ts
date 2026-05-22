import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('homepage cn utility', () => {
  it('merges truthy classes and Tailwind background conflicts', () => {
    expect(cn('bg-blue-500', null, undefined, 'bg-green-500')).toBe('bg-green-500')
  })
})
