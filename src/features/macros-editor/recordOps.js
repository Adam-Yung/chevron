// Key order of these `{ [key]: body }` maps is user-visible: delete and re-add would move an entry, so edits rebuild in place.

export function uniqueKey(record, base) {
  let key = base
  for (let n = 1; record && key in record; n++) key = base + n
  return key
}

export function replaceValue(record, key, next) {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, k === key ? next : v]))
}

export function patchValue(record, key, change) {
  return replaceValue(record, key, { ...record[key], ...change })
}

export function removeKey(record, key) {
  return Object.fromEntries(Object.entries(record).filter(([k]) => k !== key))
}

// Returns the record unchanged when the new key is empty or already taken, so a half-typed key cannot overwrite a sibling.
export function renameKey(record, oldKey, newKey) {
  if (!newKey || newKey === oldKey || newKey in record) return record
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k === oldKey ? newKey : k, v]))
}
