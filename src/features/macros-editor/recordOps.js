// Engines, engine query types and macro commands are all `{ [key]: body }` maps whose key order is user-visible, so every
// edit rebuilds the object in place instead of deleting and re-adding keys (which would move the entry to the end).

export function uniqueKey(record, base) {
  let key = base
  for (let n = 1; record && key in record; n++) key = base + n
  return key
}

export function replaceValue(record, key, next) {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, k === key ? next : v]))
}

export function removeKey(record, key) {
  return Object.fromEntries(Object.entries(record).filter(([k]) => k !== key))
}

// Returns the record unchanged when the new key is empty or already taken, so a half-typed key cannot overwrite a sibling.
export function renameKey(record, oldKey, newKey) {
  if (!newKey || newKey === oldKey || newKey in record) return record
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k === oldKey ? newKey : k, v]))
}
