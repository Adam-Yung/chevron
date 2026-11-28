// Adds entries to the text of public/icons.js. Pure: the caller reads and writes the file.

const isPresent = (source, entry) => source.includes(`  ${entry.name}:`)

// Null when the text has no closing brace; `content` is null when every entry is already there.
export function mergeIcons(source, entries) {
  const closingBrace = source.lastIndexOf('}')
  if (closingBrace === -1) return null

  const skipped = entries.filter(e => isPresent(source, e)).map(e => e.name)
  const added = entries.filter(e => !isPresent(source, e))
  if (skipped.length > 0 && added.length === 0) return { skipped, content: null }

  const before = source.slice(0, closingBrace).trimEnd()
  const after = source.slice(closingBrace)
  const needsComma = before.endsWith("'") || before.endsWith('"') || before.endsWith(',')

  const lines = added.map(({ name, svg }) => `  ${name}: '${svg.replace(/'/g, "\\'")}'`)
  const insertion = (needsComma ? ',\n' : '\n') + lines.join(',\n') + '\n'

  return { skipped, content: before + insertion + after }
}
