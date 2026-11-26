// Remote suggestions with a small in-memory cache, so backspacing and retyping cost no requests and the list never flashes empty.
import googleAutocomplete from './googleAutocomplete'

const LIMIT = 200
const cache = new Map()
const keyOf = (query, locale) => `${locale}\u0000${query}`

function remember(key, items) {
  cache.delete(key)
  cache.set(key, items)
  if (cache.size > LIMIT) cache.delete(cache.keys().next().value)
}

/** Cached suggestions for exactly this query, or null. */
export function peekAutocomplete(query, locale) {
  return cache.get(keyOf(query, locale)) ?? null
}

/**
 * While the request for a longer query is in flight, the cached answer for its longest typed prefix, narrowed to entries that
 * still match, keeps the list stable instead of blinking.
 */
export function prefixFallback(query, locale) {
  const lower = query.toLowerCase()
  for (let end = query.length - 1; end > 0; end--) {
    const items = cache.get(keyOf(query.slice(0, end), locale))
    if (items) return items.filter(s => s.suggestion.toLowerCase().startsWith(lower))
  }
  return []
}

export async function fetchAutocomplete(query, locale, fetcher = googleAutocomplete) {
  const cached = peekAutocomplete(query, locale)
  if (cached) return cached
  const items = await fetcher(query, locale)
  remember(keyOf(query, locale), items)
  return items
}

export function clearAutocompleteCache() {
  cache.clear()
}
