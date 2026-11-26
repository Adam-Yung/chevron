// Google's suggestion endpoint, read through a <script> tag (JSONP): it sends no CORS headers, and the page may run from file://.
import fetchFromScriptTag from '../lib/fetchFromScriptTag'

const API = 'https://www.google.com/complete/search'
let calls = 0

/** Parse the `chrome-omni` response shape: [query, texts, descriptions, _, { google:suggesttype, google:suggestrelevance }]. */
export function parseGoogleSuggestions(res) {
  const texts = Array.isArray(res?.[1]) ? res[1] : []
  const meta = res?.[4] ?? {}
  const types = meta['google:suggesttype'] ?? []
  const relevance = meta['google:suggestrelevance'] ?? []
  return texts
    .map((text, i) => ({ suggestion: String(text), type: String(types[i] ?? 'query').toLowerCase(), relevance: Number(relevance[i]) || 0 }))
    // Google's own calculator rows duplicate Chevron's instant answers, which are offline and copyable.
    .filter(s => s.type !== 'calculator' && s.suggestion)
    .map(s => ({ ...s, type: 'autocomplete', navigation: s.type === 'navigation' }))
}

/**
 * @param {string} query
 * @param {string} locale
 */
export default async function googleAutocomplete(query, locale) {
  // Unique per call: two requests in the same millisecond must not share a global callback.
  const callback = `chevronSuggest${Date.now().toString(36)}${(calls++).toString(36)}`
  const params = new URLSearchParams({ q: query, client: 'chrome-omni', hl: locale || 'en', callback })
  return parseGoogleSuggestions(await fetchFromScriptTag(`${API}?${params}`, callback))
}
