export const CONFIG_STORAGE_KEY = 'chevron.config'
export const CONFIG_SCHEMA_VERSION = 1
// Consumers that copied window.CONFIG at import (sites menu, macro suggestions) listen for this to refresh after an edit.
export const CONFIG_EVENT = 'chevron:config'

const FORBIDDEN_URL_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'file:']

function isForbiddenUrl(value) {
  if (typeof value !== 'string') return false
  const trimmed = value.trim().toLowerCase()
  return FORBIDDEN_URL_SCHEMES.some(s => trimmed.startsWith(s))
}

function isObject(value) {
  return value != null && typeof value === 'object'
}

// Walks a tree and returns the dotted paths whose value is a forbidden URL, so pasted JSON is rejected before macro lookup.
export function findForbiddenUrls(value, path = '') {
  if (value == null) return []
  if (Array.isArray(value)) return value.flatMap((v, i) => findForbiddenUrls(v, `${path}[${i}]`))
  if (isObject(value)) {
    return Object.keys(value).flatMap(k => findForbiddenUrls(value[k], path ? `${path}.${k}` : k))
  }
  return isForbiddenUrl(value) ? [path] : []
}

// Tolerates a missing or broken public/config.js: an empty valid shape keeps the app alive.
export function readBundledConfig() {
  const raw = (typeof window !== 'undefined' && window.CONFIG) || {}
  return {
    macros: Array.isArray(raw.macros) ? raw.macros : [],
    commands: Array.isArray(raw.commands) ? raw.commands : [],
    engines: isObject(raw.engines) ? raw.engines : {}
  }
}

function readStored() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.warn('[Chevron] chevron.config is corrupt, ignoring:', err)
    return null
  }
}

// One backup per distinct bad config: a new-tab page loads many times a day, and a backup per load would fill localStorage.
function backupBadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY) ?? ''
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('chevron.config.bak.') && localStorage.getItem(key) === raw) return
    }
    localStorage.setItem(`chevron.config.bak.${Date.now()}`, raw)
  } catch { /* storage full or blocked: the backup is best effort */ }
}

// Reads the persisted user config, validates it, falls back to bundled. Never throws.
export function loadConfig() {
  const bundled = readBundledConfig()
  const stored = readStored()
  if (!isObject(stored)) return bundled

  const candidate = {
    macros: Array.isArray(stored.macros) ? stored.macros : bundled.macros,
    commands: Array.isArray(stored.commands) ? stored.commands : bundled.commands,
    engines: isObject(stored.engines) ? stored.engines : bundled.engines
  }

  const bad = findForbiddenUrls(candidate)
  if (bad.length === 0) return candidate
  console.warn('[Chevron] chevron.config contains forbidden URL schemes; falling back to bundled config. Offending paths:', bad)
  backupBadConfig()
  return bundled
}

function publish(config) {
  window.CONFIG = config
  window.dispatchEvent(new Event(CONFIG_EVENT))
}

// Validates and saves. Returns { ok: true } or { ok: false, reason }. Never throws.
export function saveConfig(next) {
  if (!isObject(next)) return { ok: false, reason: 'config must be an object' }

  const candidate = {
    macros: Array.isArray(next.macros) ? next.macros : [],
    commands: Array.isArray(next.commands) ? next.commands : [],
    engines: isObject(next.engines) ? next.engines : {}
  }

  const bad = findForbiddenUrls(candidate)
  if (bad.length > 0) return { ok: false, reason: `Forbidden URL scheme(s) at: ${bad.join(', ')}` }

  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ version: CONFIG_SCHEMA_VERSION, ...candidate }))
  } catch (err) {
    return { ok: false, reason: err.message || 'localStorage write failed' }
  }
  // Mirrored onto window.CONFIG so existing consumers see the edit without a reload.
  publish(candidate)
  return { ok: true }
}

// Drops the persisted override and restores the bundled config.
export function resetConfig() {
  try { localStorage.removeItem(CONFIG_STORAGE_KEY) } catch { /* nothing to remove if storage is blocked */ }
  const bundled = readBundledConfig()
  publish(bundled)
  return bundled
}

// Boot helper: applies a persisted override to window.CONFIG before React mounts.
export function applyPersistedConfigToWindow() {
  if (typeof window === 'undefined') return
  window.CONFIG = loadConfig()
}
