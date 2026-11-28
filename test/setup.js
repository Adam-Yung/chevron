import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// This jsdom has no Storage, and many modules read or write it at import time.
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

// Stands in for public/config.js: settings/schema.js reads window.CONFIG.engines when it is imported.
if (!window.CONFIG) {
  window.CONFIG = {
    engines: { google: { name: 'Google', url: 'https://www.google.com/search?q=' } },
    macros: [],
    commands: {}
  }
}

// jsdom lacks matchMedia; this stub matches nothing.
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
