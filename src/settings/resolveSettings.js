import {
  validateSettings, backupSettings, migrateSettings, SETTINGS_VERSION
} from './settingsMigration'

const COLOR_SCHEMES = ['auto', 'light', 'dark']
const UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype']

const isPlain = value => value !== null && typeof value === 'object' && !Array.isArray(value)

function sameKind(want, got) {
  if (Array.isArray(want)) return Array.isArray(got)
  if (typeof want === 'number') return typeof got === 'number' && Number.isFinite(got)
  return typeof want === typeof got
}

// A value whose type disagrees with the default is dropped and its path recorded in `issues`; unknown keys pass through.
function mergeChecked(target, source, issues, path) {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (UNSAFE_KEYS.includes(key)) continue
    const where = path ? `${path}.${key}` : key
    const want = target[key]
    const got = source[key]
    if (want === undefined) result[key] = got
    else if (isPlain(want) && isPlain(got)) result[key] = mergeChecked(want, got, issues, where)
    else if (isPlain(want) || !sameKind(want, got)) issues.push(where)
    else result[key] = got
  }
  return result
}

// Pure: objects recurse, arrays and primitives from `source` win, wrong-typed values are dropped.
export function deepMerge(target, source) {
  return mergeChecked(target, isPlain(source) ? source : {}, [], '')
}

// The app reads settings.appearance.themes[activeTheme][scheme] unguarded, so the merged result must always satisfy that.
function repairAppearance(merged, defaults) {
  const appearance = merged.appearance
  const fallback = defaults.appearance.themes.default
  const themes = {}
  for (const [name, theme] of Object.entries(appearance.themes)) {
    if (!isPlain(theme)) continue
    themes[name] = {
      ...theme,
      light: { ...fallback.light, ...(isPlain(theme.light) ? theme.light : {}) },
      dark: { ...fallback.dark, ...(isPlain(theme.dark) ? theme.dark : {}) }
    }
  }
  if (!themes.default) themes.default = fallback
  const activeTheme = themes[appearance.activeTheme] ? appearance.activeTheme : 'default'
  const colorScheme = COLOR_SCHEMES.includes(appearance.colorScheme) ? appearance.colorScheme : 'auto'
  return { ...merged, appearance: { ...appearance, themes, activeTheme, colorScheme } }
}

function mergeOntoDefaults(raw, defaults) {
  const issues = []
  const merged = mergeChecked(defaults, isPlain(raw) ? raw : {}, issues, '')
  if (!isPlain(raw)) issues.push('root')
  return { settings: repairAppearance(merged, defaults), issues }
}

// Persisting only what differs lets a changed default reach every user who never touched that setting.
export function pickChanged(defaults, current) {
  const out = {}
  for (const key of Object.keys(current)) {
    const want = defaults?.[key]
    const got = current[key]
    if (isPlain(want) && isPlain(got)) {
      const nested = pickChanged(want, got)
      if (Object.keys(nested).length > 0) out[key] = nested
    } else if (JSON.stringify(want) !== JSON.stringify(got)) {
      out[key] = got
    }
  }
  return out
}

// Never throws, whatever the stored payload looks like. Returns `{ settings, needsVersionWrite }`.
// A current version only merges (this runs on every load); an older or unstamped one is migrated and validated first.
export function resolveSettings(raw, storedVersion, defaults) {
  if (storedVersion === SETTINGS_VERSION) {
    const { settings, issues } = mergeOntoDefaults(raw, defaults)
    if (issues.length > 0) reportIssues(raw, issues)
    return { settings, needsVersionWrite: false }
  }

  const migrated = isPlain(raw) ? migrateSettings(structuredClone(raw), storedVersion) : raw
  const found = validateSettings(migrated)
  const { settings, issues } = mergeOntoDefaults(migrated, defaults)
  const all = [...found, ...issues]
  if (all.length > 0) reportIssues(raw, all)
  return { settings, needsVersionWrite: true }
}

function reportIssues(raw, issues) {
  if (import.meta.env?.DEV) console.warn('[chevron] Settings validation issues:', issues)
  backupSettings(raw)
}
