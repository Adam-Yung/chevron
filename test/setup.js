import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// jsdom in this environment does not expose a Storage implementation, so
// provide an in-memory localStorage/sessionStorage polyfill for the many
// modules (Settings, History, config) that read/write it at import time.
function createMemoryStorage() {
  let store = {}
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
    clear: () => { store = {} },
    key: (i) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length }
  }
}

if (!window.localStorage) {
  Object.defineProperty(window, 'localStorage', { value: createMemoryStorage(), configurable: true })
}
if (!window.sessionStorage) {
  Object.defineProperty(window, 'sessionStorage', { value: createMemoryStorage(), configurable: true })
}

// jsdom lacks matchMedia; several components query it (reduced-motion,
// pointer:coarse). Provide a minimal stub that defaults to "no match".
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
}

afterEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})
