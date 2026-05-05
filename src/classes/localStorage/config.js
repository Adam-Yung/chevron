/**
 * Versioned config (macros + commands + engines) loader / saver.
 *
 * Design:
 *  - Source-of-truth on first run: `window.CONFIG` from /public/config.js.
 *  - User edits live in `localStorage["chevron.config"]` as a versioned
 *    JSON blob: `{ version: 1, macros, commands, engines }`.
 *  - On every read, we validate the URL schemes inside macros/engines.
 *    Anything starting with javascript: / data: / vbscript: is rejected
 *    so a hand-edited JSON or a malicious paste can't inject a script
 *    URL into a macro template.
 *  - Edits never make a network request — this whole module works
 *    offline by design.
 */

export const CONFIG_STORAGE_KEY = 'chevron.config'
export const CONFIG_SCHEMA_VERSION = 1

const FORBIDDEN_URL_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'file:']

function isForbiddenUrl(value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trim().toLowerCase()
  return FORBIDDEN_URL_SCHEMES.some(s => trimmed.startsWith(s))
}

/**
 * Walk an object/array tree and return a list of dotted paths whose
 * value looks like a forbidden URL. Used to validate user-pasted JSON
 * before we hand it to the macro lookup.
 */
export function findForbiddenUrls(value, path = '') {
  const out = []
  if (value == null) return out
  if (Array.isArray(value)) {
    value.forEach((v, i) => out.push(...findForbiddenUrls(v, `${path}[${i}]`)))
  } else if (typeof value === 'object') {
    for (const k of Object.keys(value)) {
      out.push(...findForbiddenUrls(value[k], path ? `${path}.${k}` : k))
    }
  } else if (isForbiddenUrl(value)) {
    out.push(path)
  }
  return out
}

/**
 * Read the bundled config from `window.CONFIG`. Defensive in case
 * `public/config.js` failed to load (e.g. corrupted file): returns an
 * empty-but-valid shape so the rest of the app doesn't crash.
 */
export function readBundledConfig() {
  const raw = (typeof window !== 'undefined' && window.CONFIG) || {}
  return {
    macros: Array.isArray(raw.macros) ? raw.macros : [],
    commands: Array.isArray(raw.commands) ? raw.commands : [],
    engines: (raw.engines && typeof raw.engines === 'object') ? raw.engines : {}
  }
}

/**
 * Read the persisted user config, validate it, fall back to bundled.
 * Never throws — bad data is logged + ignored.
 */
export function loadConfig() {
  const bundled = readBundledConfig()
  let stored = null
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (raw) stored = JSON.parse(raw)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[Chevron] chevron.config is corrupt, ignoring:', err)
  }

  if (!stored || typeof stored !== 'object') return bundled

  // Versioned wrapper. v1 stores the same shape as window.CONFIG.
  const version = stored.version
  const candidate = {
    macros: Array.isArray(stored.macros) ? stored.macros : bundled.macros,
    commands: Array.isArray(stored.commands) ? stored.commands : bundled.commands,
    engines: (stored.engines && typeof stored.engines === 'object') ? stored.engines : bundled.engines
  }

  // URL-scheme guardrail.
  const bad = findForbiddenUrls(candidate)
  if (bad.length > 0) {
    // eslint-disable-next-line no-console
    console.warn('[Chevron] chevron.config contains forbidden URL schemes; falling back to bundled config. Offending paths:', bad)
    return bundled
  }

  if (version !== CONFIG_SCHEMA_VERSION) {
    // Future: run a migration step here. For now, accept any v that
    // matches the v1 shape (we already validated the shape above).
    // eslint-disable-next-line no-console
    console.info('[Chevron] chevron.config has unknown version, accepting v1 shape:', version)
  }

  return candidate
}

/**
 * Validate-and-save. Returns `{ ok: true }` on success, or
 * `{ ok: false, reason }` on validation failure. Never throws.
 */
export function saveConfig(next) {
  if (!next || typeof next !== 'object')
    return { ok: false, reason: 'config must be an object' }

  const candidate = {
    macros: Array.isArray(next.macros) ? next.macros : [],
    commands: Array.isArray(next.commands) ? next.commands : [],
    engines: (next.engines && typeof next.engines === 'object') ? next.engines : {}
  }

  const bad = findForbiddenUrls(candidate)
  if (bad.length > 0)
    return { ok: false, reason: `Forbidden URL scheme(s) at: ${bad.join(', ')}` }

  const wrapped = {
    version: CONFIG_SCHEMA_VERSION,
    ...candidate
  }

  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(wrapped))
    // Mirror onto window.CONFIG so all the existing consumers
    // (getMacro, MacrosMenu, useParseQuery) see the new value
    // immediately without a reload.
    if (typeof window !== 'undefined') window.CONFIG = candidate
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: err.message || 'localStorage write failed' }
  }
}

/**
 * Drop the persisted override and reload `window.CONFIG` from the
 * bundled source.
 */
export function resetConfig() {
  try { localStorage.removeItem(CONFIG_STORAGE_KEY) } catch { /* ignore */ }
  const bundled = readBundledConfig()
  if (typeof window !== 'undefined') window.CONFIG = bundled
  return bundled
}

/**
 * Boot helper: applies any persisted override onto window.CONFIG
 * before the rest of the app reads from it. Call this once, very
 * early (before mounting React).
 */
export function applyPersistedConfigToWindow() {
  if (typeof window === 'undefined') return
  const cfg = loadConfig()
  window.CONFIG = cfg
}
