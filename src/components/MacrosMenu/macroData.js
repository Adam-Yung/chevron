// Shared data and scoring logic for the macros menu and filter pill.
// Lives in its own module so the eager MacroFilterPill and the lazy
// MacrosMenu chunk can both import it without creating a circular
// dependency or forcing MacrosMenu to be eagerly loaded.

export const pinnedMacros = window.CONFIG.macros.filter(m => m.pinned)

// Ranked prefix+substring scorer. Returns a score > 0 if the macro
// matches the needle; higher score = better match. Caller should
// filter(score > 0) and sort descending.
export function score(macro, needle) {
  const name     = (macro.name     || '').toLowerCase()
  const category = (macro.category || '').toLowerCase()
  const triggers = (macro.triggers || []).map(t => t.toLowerCase())

  if (name === needle)                          return 100
  if (name.startsWith(needle))                  return 80
  if (triggers.includes(needle))                return 70
  if (triggers.some(t => t.startsWith(needle))) return 60
  if (name.includes(needle))                    return 40
  if (category.includes(needle))                return 20
  return 0
}
