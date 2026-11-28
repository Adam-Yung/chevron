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

/** Ranked history matches for a query; entries are { q: text, n: uses, t: last use }. */
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

const sameText = (a, b) => a.toLowerCase() === b.toLowerCase()

function load(storage) {
  try {
    return migrate(JSON.parse(storage.getItem(HISTORY_KEY)))
  } catch {
    return []
  }
}

// The entries array is replaced, never mutated: React reads it as an immutable snapshot.
class HistoryStore {
  entries = null
  listeners = new Set()

  constructor(storage, now) {
    this.storage = storage
    this.now = now
  }

  // snapshot and subscribe are handed to useSyncExternalStore unbound, hence arrow fields.
  snapshot = () => (this.entries ??= load(this.storage))

  subscribe = listener => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  add(query) {
    const q = query?.trim()
    if (!q) return
    const previous = this.snapshot().find(e => sameText(e.q, q))
    this.commit([{ q, n: (previous?.n ?? 0) + 1, t: this.now() }, ...this.without(q)].slice(0, HISTORY_LIMIT))
  }

  remove(query) {
    const next = this.without(query ?? '')
    if (next.length === this.snapshot().length) return false
    this.commit(next)
    return true
  }

  suggest(query, limit) {
    return suggestFrom(this.snapshot(), query, limit, this.now())
  }

  // Another tab wrote history: drop the cache so the next read sees it.
  invalidate() {
    this.entries = null
    this.notify()
  }

  without(q) {
    return this.snapshot().filter(e => !sameText(e.q, q))
  }

  commit(next) {
    this.entries = next
    try { this.storage.setItem(HISTORY_KEY, JSON.stringify(next)) } catch { /* full or blocked storage: keep the in-memory copy */ }
    this.notify()
  }

  notify() {
    for (const listener of this.listeners) listener()
  }
}

/** @param {{ storage?: Storage, now?: () => number }} [deps] */
export function createHistory({ storage = globalThis.localStorage, now = Date.now } = {}) {
  return new HistoryStore(storage, now)
}

export const history = createHistory()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => { if (e.key === HISTORY_KEY) history.invalidate() })
}
