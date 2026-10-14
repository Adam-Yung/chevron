// Pure settings-resolution logic, extracted from Settings.jsx so it can be
// unit-tested and so the hot (already-current-version) path can skip the
// expensive migration + validation work.
//
// Hot path (storedVersion === SETTINGS_VERSION): just deepMerge the stored
// object onto defaults. This runs on every normal page load, so it must be
// as cheap as possible — no migration walk, no full-tree validation.
//
// Cold path (version mismatch or unversioned/pre-versioning store): run the
// version-specific migrations, structurally validate, back up on problems,
// then merge. This happens once after an upgrade, not on every load.

import {
  validateSettings, backupSettings, migrateSettings, SETTINGS_VERSION
} from './settingsMigration'

/**
 * Deep-merge `source` onto a clone of `target` (objects recurse; arrays and
 * primitives from source win). Pure; does not mutate its arguments.
 */
export function deepMerge(target, source) {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] != null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key]) &&
      target[key] != null
    ) {
      result[key] = deepMerge(target[key], source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

/**
 * Resolve the effective settings object from a stored payload.
 *
 * @param {object} raw            parsed localStorage settings (or {})
 * @param {number|undefined} storedVersion  version stamp from storage
 * @param {object} defaults       settings template defaults
 * @returns {{ settings: object, needsVersionWrite: boolean }}
 */
export function resolveSettings(raw, storedVersion, defaults) {
  const upToDate = storedVersion === SETTINGS_VERSION

  // Hot path: current version → skip migration/validation entirely.
  if (upToDate) {
    return { settings: deepMerge(defaults, raw), needsVersionWrite: false }
  }

  // Cold path: migrate, validate, back up on problems, then merge.
  const migrated = migrateSettings({ ...raw }, storedVersion)
  const issues = validateSettings(migrated)
  if (issues.length > 0) {
    if (import.meta.env?.DEV) console.warn('[chevron] Settings validation issues:', issues)
    backupSettings(raw)
    // Fall through — deepMerge with defaults handles the gaps.
  }
  return { settings: deepMerge(defaults, migrated), needsVersionWrite: true }
}
