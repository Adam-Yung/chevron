import { describe, it, expect } from 'vitest'
import { workboxOptions } from './serviceWorker.js'

const ignored = param => workboxOptions('/chevron/').ignoreURLParametersMatching.some(re => re.test(param))

describe('workboxOptions', () => {
  it('matches config.js?v=… and icons.js?v=… to their precached copies, so they load offline', () => {
    expect(ignored('v')).toBe(true)
  })

  it('keeps Workbox’s default tracking-parameter rules', () => {
    expect(ignored('utm_source')).toBe(true)
    expect(ignored('fbclid')).toBe(true)
  })

  it('does not ignore unrelated parameters', () => {
    expect(ignored('version')).toBe(false)
    expect(ignored('q')).toBe(false)
  })

  it('falls back to the app shell under the deploy base', () => {
    expect(workboxOptions('/chevron/').navigateFallback).toBe('/chevron/index.html')
  })
})
