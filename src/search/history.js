// Search history: what the user searched, ranked by how often and how recently. docs/code/src/search/history.js.md.

export const HISTORY_KEY = 'history'
export const HISTORY_LIMIT = 1000
const DAY_MS = 86_400_000

// The old format was [{ id: query, type }]; entries keep their order and start with one use and no date.
function migrate(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map(e => (typeof e?.q === 'string' ? e : { q: e?.id, n: 1, t: 0 }))
    .filter(e => typeof e.q === 'string' && e.q.trim())
}

function matchRank(entry, needle, tokens) {
  const text = entry.q.toLowerCase()
  if (text === needle) return 0
  if (text.startsWith(needle)) return 3
  const words = text.split(/\s+/)
  if (tokens.every(t => words.some(w => w.startsWith(t)))) return 2
  return text.includes(needle) ? 1 : 0
}

function frecency(entry, now) {
  const ageDays = entry.t ? (now - entry.t) / DAY_MS : 365
  return Math.log2(1 + entry.n) + 1 / (1 + ageDays / 7)
}

/**
 * Ranked history matches for a query.
 * @param {ReadonlyArray<{ q: string, n: number, t: number }>} entries
 */
export function suggestFrom(entries, query, limit = 5, at = Date.now()) {
  const needle = query?.trim().toLowerCase()
  if (!needle || limit <= 0) return []
  const tokens = needle.split(/\s+/)
  return entries
    .map(entry => ({ entry, rank: matchRank(entry, needle, tokens) }))
    .filter(m => m.rank > 0)
    .map(m => ({ suggestion: m.entry.q, type: 'history', relevance: m.rank * 10 + frecency(m.entry, at) }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
}

/**
 * The entries array is replaced, never mutated, on every change: React reads it as an immutable snapshot.
 * @param {{ storage?: Storage, now?: () => number }} [deps]
 */
export function createHistory({ storage = globalThis.localStorage, now = Date.now } = {}) {
  let entries = null
  const listeners = new Set()

  const snapshot = () => {
    if (entries) return entries
    try {
      entries = migrate(JSON.parse(storage.getItem(HISTORY_KEY)))
    } catch {
      entries = []
    }
    return entries
  }

  const commit = next => {
    entries = next
    try { storage.setItem(HISTORY_KEY, JSON.stringify(entries)) } catch { /* full or blocked storage: keep the in-memory copy */ }
    for (const listener of listeners) listener()
  }

  const without = q => snapshot().filter(e => e.q.toLowerCase() !== q.toLowerCase())

  return {
    snapshot,

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    add(query) {
      const q = query?.trim()
      if (!q) return
      const previous = snapshot().find(e => e.q.toLowerCase() === q.toLowerCase())
      commit([{ q, n: (previous?.n ?? 0) + 1, t: now() }, ...without(q)].slice(0, HISTORY_LIMIT))
    },

    remove(query) {
      const next = without(query ?? '')
      if (next.length === snapshot().length) return false
      commit(next)
      return true
    },

    suggest: (query, limit) => suggestFrom(snapshot(), query, limit, now()),

    // Another tab wrote history: drop the cache so the next read sees it.
    invalidate() {
      entries = null
      for (const listener of listeners) listener()
    }
  }
}

export const history = createHistory()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => { if (e.key === HISTORY_KEY) history.invalidate() })
}
