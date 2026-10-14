import { describe, it, expect } from 'vitest'

// Smoke test to confirm the Vitest + jsdom harness is wired up correctly.
describe('test harness', () => {
  it('runs in a jsdom environment', () => {
    expect(typeof window).toBe('object')
    expect(typeof localStorage).toBe('object')
  })
})
