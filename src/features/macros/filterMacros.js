// Ranking for the sites-menu filter: whole-name and trigger matches beat substrings, which beat category matches.

/** @returns {number} 0 when the macro does not match */
export function scoreMacro(macro, needle) {
  const name = (macro.name || '').toLowerCase()
  const triggers = (macro.triggers || []).map(t => t.toLowerCase())
  if (name === needle) return 100
  if (name.startsWith(needle)) return 80
  if (triggers.includes(needle)) return 70
  if (triggers.some(t => t.startsWith(needle))) return 60
  if (name.includes(needle)) return 40
  return (macro.category || '').toLowerCase().includes(needle) ? 20 : 0
}

/** The macros matching `filter`, best first; all of them, in config order, for an empty filter. */
export function filterMacros(macros, filter) {
  const needle = filter.trim().toLowerCase()
  if (!needle) return macros
  return macros
    .map((macro, index) => ({ macro, index, score: scoreMacro(macro, needle) }))
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(m => m.macro)
}

/** `KeyG` -> `G`, `Digit1` -> `1`: the letter shown on a card's key hint. */
export function keyLabel(code) {
  return typeof code === 'string' ? code.replace(/^(Key|Digit)/, '') : ''
}
