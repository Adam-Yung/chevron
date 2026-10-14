import { describe, it, expect, vi } from 'vitest'
import { deepMerge, resolveSettings } from './resolveSettings'
import { SETTINGS_VERSION } from './settingsMigration'
import * as migration from './settingsMigration'

describe('deepMerge', () => {
  it('fills gaps from defaults without mutating inputs', () => {
    const defaults = { a: 1, nested: { x: 1, y: 2 } }
    const stored = { nested: { y: 99 } }
    const out = deepMerge(defaults, stored)
    expect(out).toEqual({ a: 1, nested: { x: 1, y: 99 } })
    // inputs untouched
    expect(defaults).toEqual({ a: 1, nested: { x: 1, y: 2 } })
    expect(stored).toEqual({ nested: { y: 99 } })
  })

  it('replaces arrays wholesale (does not merge element-wise)', () => {
    expect(deepMerge({ list: [1, 2, 3] }, { list: [9] })).toEqual({ list: [9] })
  })
})

describe('resolveSettings', () => {
  const defaults = { appearance: { glassmorphism: false }, general: { locale: 'en' } }

  it('HOT PATH: current version skips migration + validation', () => {
    const migrateSpy = vi.spyOn(migration, 'migrateSettings')
    const validateSpy = vi.spyOn(migration, 'validateSettings')

    const { settings, needsVersionWrite } = resolveSettings(
      { general: { locale: 'fr' } }, SETTINGS_VERSION, defaults
    )

    expect(migrateSpy).not.toHaveBeenCalled()
    expect(validateSpy).not.toHaveBeenCalled()
    expect(needsVersionWrite).toBe(false)
    // still merges stored onto defaults
    expect(settings).toEqual({ appearance: { glassmorphism: false }, general: { locale: 'fr' } })

    migrateSpy.mockRestore()
    validateSpy.mockRestore()
  })

  it('COLD PATH: version mismatch runs migration and flags a version write', () => {
    const migrateSpy = vi.spyOn(migration, 'migrateSettings')
    const { needsVersionWrite } = resolveSettings({}, 1, defaults)
    expect(migrateSpy).toHaveBeenCalled()
    expect(needsVersionWrite).toBe(true)
    migrateSpy.mockRestore()
  })

  it('COLD PATH: undefined (pre-versioning) store triggers migration', () => {
    const migrateSpy = vi.spyOn(migration, 'migrateSettings')
    const { needsVersionWrite } = resolveSettings({}, undefined, defaults)
    expect(migrateSpy).toHaveBeenCalled()
    expect(needsVersionWrite).toBe(true)
    migrateSpy.mockRestore()
  })

  it('COLD PATH: applies the v2->v3 performanceMode->glassmorphism migration', () => {
    // Simulate a v2 store where performanceMode=false meant blur was ON.
    const { settings } = resolveSettings(
      { appearance: { performanceMode: false } }, 2, defaults
    )
    expect(settings.appearance.glassmorphism).toBe(true)
    expect(settings.appearance).not.toHaveProperty('performanceMode')
  })
})
