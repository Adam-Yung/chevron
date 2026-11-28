// Bump SETTINGS_VERSION only when a plain merge over defaults cannot absorb a shape change, and add an idempotent step.

export const SETTINGS_VERSION = 4

// The default before 2026-11-25. Every install persisted it, so a stored 400 counts as the default, not a choice.
const OLD_ANIMATION_SPEED = 400

// Defaults before the Sleeve Patch look. A store from that era holds every value, so these would pin the old look as a "choice".
const OLD_THICKNESS = 15
const OLD_THEME = {
  light: { primary: '#212121', secondary: '#dee1e6', accent: '#3b72ff' },
  dark: { primary: '#f2f2f2', secondary: '#212121', accent: '#ffa00b' }
}
// Which old primary colour each derived colour used to copy.
const FOLLOWED = {
  chevron: 'primary', query: 'primary', suggestions: 'primary', time: 'primary', secondary: 'secondary', background: 'secondary',
  card: 'secondary', primary: 'primary', accent: 'accent', prefix: 'accent', visited: 'accent'
}

const BACKUP_KEY_PREFIX = 'chevron.settings.bak'
const VERSION_KEY = 'chevron.settings.version'

const isObject = value => value !== null && typeof value === 'object'

function themeIssues(themes) {
  const issues = []
  if (!isObject(themes)) return issues
  for (const [name, theme] of Object.entries(themes)) {
    if (!isObject(theme)) {
      issues.push(`Theme "${name}" is not an object.`)
      continue
    }
    for (const scheme of ['light', 'dark']) {
      if (theme[scheme] !== undefined && !isObject(theme[scheme])) issues.push(`Theme "${name}.${scheme}" is not an object.`)
    }
  }
  return issues
}

/** Returns human-readable problems with `stored` (empty array = clean). */
export function validateSettings(stored) {
  if (!isObject(stored) || Array.isArray(stored)) return ['Root is not a plain object.']
  const issues = themeIssues(stored.appearance?.themes)
  const apiKey = stored.weather?.apiKey
  if (apiKey !== undefined && typeof apiKey !== 'string') issues.push(`weather.apiKey is ${typeof apiKey}, expected string.`)
  return issues
}

/** Copies `stored` under a timestamped key so a bad payload is never lost. Storage errors are ignored. */
export function backupSettings(stored) {
  try {
    const key = `${BACKUP_KEY_PREFIX}.${Date.now()}`
    localStorage.setItem(key, JSON.stringify(stored))
    if (import.meta.env.DEV) console.warn('[chevron] Settings backed up under', key)
  } catch { /* private mode or quota: the backup is best effort */ }
}

/** The stored version stamp, or undefined for a store that predates stamping. */
export function getStoredVersion() {
  try {
    const v = localStorage.getItem(VERSION_KEY)
    const n = Number(v)
    return v === null || Number.isNaN(n) ? undefined : n
  } catch {
    return undefined
  }
}

export function writeVersion(version = SETTINGS_VERSION) {
  try { localStorage.setItem(VERSION_KEY, String(version)) } catch { /* version is re-derived next load */ }
}

// performanceMode (opt-out blur) became glassmorphism (opt-in blur), and macroMenu.glassmorphism merged into it.
function migratePerformanceMode(appearance) {
  if ('performanceMode' in appearance) {
    appearance.glassmorphism = !appearance.performanceMode
    delete appearance.performanceMode
  }
  const menu = appearance.macroMenu
  if (!isObject(menu) || menu.glassmorphism === undefined) return
  if (appearance.glassmorphism === undefined) appearance.glassmorphism = menu.glassmorphism
  delete menu.glassmorphism
  if (Object.keys(menu).length === 0) delete appearance.macroMenu
}

function dropOldThemeColors(scheme, old) {
  if (!isObject(scheme)) return
  for (const [name, source] of Object.entries(FOLLOWED)) {
    if (scheme[name] === old[source]) delete scheme[name]
  }
}

function migrateOldLook(stored) {
  if (stored?.chevron?.thickness === OLD_THICKNESS) delete stored.chevron.thickness
  for (const [name, old] of Object.entries(OLD_THEME)) dropOldThemeColors(stored?.appearance?.themes?.default?.[name], old)
}

// Mutates and returns `stored` (callers pass a clone). v2 needed no data step: the storage class obfuscates keys.
export function migrateSettings(stored, fromVersion) {
  const from = fromVersion ?? 0
  if (from < 3 && isObject(stored?.appearance)) migratePerformanceMode(stored.appearance)
  if (from < 4 && stored?.general?.animationSpeed === OLD_ANIMATION_SPEED) delete stored.general.animationSpeed
  if (from < 4) migrateOldLook(stored)
  return stored
}
