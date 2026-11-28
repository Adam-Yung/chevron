// Immutable edits of the editor's arrays (macros, commands, trigger chips, gradient colours).

export function replaceAt(list, index, value) {
  return list.map((item, i) => (i === index ? value : item))
}

export function patchAt(list, index, change) {
  return list.map((item, i) => (i === index ? { ...item, ...change } : item))
}

export function removeAt(list, index) {
  return list.filter((_, i) => i !== index)
}

export function swapAt(list, a, b) {
  const next = [...list]
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}
