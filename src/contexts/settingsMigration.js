// Phase 8.5: Versioned settings migration guard.
//
// Problem: settings persisted in localStorage can drift from the current
// template shape (old keys missing, old keys renamed, forbidden URLs in
// stored config, etc.). If the stored shape is trusted verbatim it can
// crash the app silently or leave the user with a half-broken state.
//
// Strategy: "safe load" — assign stored values on top of fresh defaults
// (already done via assignDeep), then run a lightweight structural check.
// On mismatch we back up the old payload, log the problem, and continue
// with fresh defaults rather than crashing.
//
// Version bumping: whenever the template shape changes in a breaking way,
// increment SETTINGS_VERSION. The migration will detect the mismatch and
// run the appropriate fixer.

export const SETTINGS_VERSION = 2

const BACKUP_KEY_PREFIX = 'chevron.settings.bak'
const VERSION_KEY = 'chevron.settings.version'

/**
 * Validate that `stored` contains no obviously corrupt values.
 * Returns an array of human-readable issues (empty = clean).
 */
export function validateSettings(stored) {
  const issues = []

  // Must be a plain object
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
    issues.push('Root is not a plain object.')
    return issues
  }

  // Appearance themes must exist and have at least one entry
  const themes = stored?.appearance?.themes
  if (themes && typeof themes === 'object') {
    for (const [name, theme] of Object.entries(themes)) {
      if (!theme || typeof theme !== 'object') {
        issues.push(`Theme "${name}" is not an object.`)
        continue
      }
      for (const scheme of ['light', 'dark']) {
        if (theme[scheme] !== undefined && typeof theme[scheme] !== 'object') {
          issues.push(`Theme "${name}.${scheme}" is not an object.`)
        }
      }
    }
  }

  // Weather API key should be a string (not an object from a weird merge)
  const apiKey = stored?.weather?.apiKey
  if (apiKey !== undefined && typeof apiKey !== 'string') {
    issues.push(`weather.apiKey is ${typeof apiKey}, expected string.`)
  }

  return issues
}

/**
 * Backup `stored` to localStorage under a timestamped key.
 * Silently ignores storage errors (private mode, quota exceeded, etc.).
 */
export function backupSettings(stored) {
  try {
    const key = `${BACKUP_KEY_PREFIX}.${Date.now()}`
    localStorage.setItem(key, JSON.stringify(stored))
    if (import.meta.env.DEV) console.warn('[chevron] Settings backed up under', key)
  } catch {
    // ignore
  }
}

/**
 * Read the stored settings version (undefined = pre-versioning).
 */
export function getStoredVersion() {
  try {
    const v = localStorage.getItem(VERSION_KEY)
    return v === null ? undefined : Number(v)
  } catch {
    return undefined
  }
}

/**
 * Persist the current version stamp.
 */
export function writeVersion(version = SETTINGS_VERSION) {
  try {
    localStorage.setItem(VERSION_KEY, String(version))
  } catch {
    // ignore
  }
}

/**
 * Run version-specific migrations on the stored settings object.
 * Each migration mutates `stored` in place (it's a plain object clone)
 * and returns the patched version.
 *
 * Add cases here as the schema evolves. Keep each case idempotent.
 */
export function migrateSettings(stored, fromVersion) {
  if (fromVersion === undefined) {
    if (import.meta.env.DEV) console.info('[chevron] Stamping settings with version', SETTINGS_VERSION)
  }

  // v1 → v2: API keys are now obfuscated at rest via OBF1: prefix.
  // The Settings localStorage class handles obfuscation/deobfuscation
  // transparently. If an incompatible legacy OBF1: value was stored,
  // deobfuscate() returns '' so the user re-enters the key once.
  // No explicit data transform needed here — just bump the version.

  return stored
}
