export function pretty(value) {
  return JSON.stringify(value, null, 2)
}

export function normaliseConfig(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  return {
    macros: Array.isArray(source.macros) ? source.macros : [],
    commands: Array.isArray(source.commands) ? source.commands : [],
    engines: source.engines && typeof source.engines === 'object' && !Array.isArray(source.engines) ? source.engines : {}
  }
}

function shapeProblem(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'The top level must be an object like { "macros": [], "commands": [], "engines": {} }.'
  if (!Array.isArray(value.macros)) return '"macros" must be an array.'
  if (!Array.isArray(value.commands)) return '"commands" must be an array.'
  if (!value.engines || typeof value.engines !== 'object' || Array.isArray(value.engines)) return '"engines" must be an object.'
  return null
}

// A missing key is an error rather than "empty": normalising it away would let a half-typed edit autosave an empty section.
export function parseRawConfig(text) {
  let value
  try {
    value = JSON.parse(text)
  } catch (err) {
    return { config: null, error: `Invalid JSON: ${err.message}` }
  }
  const problem = shapeProblem(value)
  if (problem) return { config: null, error: problem }
  return { config: normaliseConfig(value), error: null }
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

export function summarise(cfg) {
  const { macros, commands, engines } = normaliseConfig(cfg)
  return `${plural(macros.length, 'macro')}, ${plural(commands.length, 'command')}, ${plural(Object.keys(engines).length, 'engine')}.`
}

// An imported file may omit sections (older exports): those keep their current value instead of being emptied.
export function importConfig(current, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { config: null, error: shapeProblem(value) }
  const merged = { ...current, macros: value.macros ?? current.macros, commands: value.commands ?? current.commands, engines: value.engines ?? current.engines }
  const problem = shapeProblem(merged)
  return problem ? { config: null, error: problem } : { config: normaliseConfig(merged), error: null }
}
