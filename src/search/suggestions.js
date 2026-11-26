// Pure helpers that build and order the suggestion list. docs/code/src/search/suggestions.js.md explains the tiers.

const TIER = { answer: 0, macroExact: 1, history: 2, macro: 3, autocomplete: 4 }
const RELEVANCE_TOP = 5000

/**
 * Macros whose triggers start with the query, one entry per macro, using the shortest matching trigger as the text so that
 * selecting the suggestion resolves to that macro.
 * @param {string} query
 * @param {object[]} macros
 */
export function macroSuggestions(query, macros) {
  if (!query) return []
  const results = []
  for (const macro of macros ?? []) {
    const triggers = (macro.triggers ?? []).filter(t => t.startsWith(query)).sort((a, b) => a.length - b.length)
    if (!triggers.length) continue
    const exact = triggers[0] === query
    results.push({ suggestion: triggers[0], label: macro.name, type: 'macro', exact, relevance: exact ? RELEVANCE_TOP : RELEVANCE_TOP - triggers[0].length })
  }
  return results
}

function tierOf(item, isAnswer) {
  if (isAnswer(item.type)) return TIER.answer
  if (item.type === 'macro') return item.exact ? TIER.macroExact : TIER.macro
  if (item.type === 'history') return TIER.history
  return TIER.autocomplete
}

/**
 * Merge suggestion groups: one entry per text (case-insensitive), the better tier wins, ordered by tier then relevance.
 * @param {object[][]} groups
 * @param {(type: string) => boolean} isAnswer
 */
export function mergeSuggestions(groups, isAnswer = () => false) {
  const byText = new Map()
  for (const item of groups.flat()) {
    if (!item?.suggestion) continue
    const key = item.suggestion.toLowerCase()
    const ranked = { ...item, tier: tierOf(item, isAnswer) }
    const existing = byText.get(key)
    if (!existing || ranked.tier < existing.tier) byText.set(key, ranked)
  }
  return [...byText.values()].sort((a, b) => a.tier - b.tier || b.relevance - a.relevance)
}

/** Identity of a suggestion across renders: lists are rebuilt on every keystroke, so object identity cannot be used. */
export const sameSuggestion = (a, b) => Boolean(a && b && a.suggestion === b.suggestion && a.type === b.type)

/**
 * What Enter acts on: the highlighted suggestion; else an instant answer at the top of the list (typing `2+2` then Enter copies 4);
 * else the typed text.
 * @returns {{ suggestion: string, type?: string }}
 */
export function submitTarget(query, selection, list, isAnswer) {
  if (selection) return selection
  const top = list[0]
  if (top && isAnswer(top.type)) return { suggestion: top.suggestion, type: top.type }
  return { suggestion: query.trim() }
}

/**
 * The suggestion `delta` steps from the current selection; past either end returns null, which means "the typed text".
 * @param {object[]} list
 * @param {{ suggestion: string, type: string } | null} selection
 * @param {1 | -1} delta
 */
export function stepSelection(list, selection, delta) {
  if (!list.length) return null
  const current = list.findIndex(s => sameSuggestion(s, selection))
  const start = current === -1 ? (delta > 0 ? -1 : list.length) : current
  const next = start + delta
  return next < 0 || next >= list.length ? null : list[next]
}
