// Corrupt JSON must never stop the app booting: the raw text is parked under a backup key and the default value takes over.
function parkCorrupt(name, raw) {
  try { localStorage.setItem(`chevron.corrupt.${name}.${Date.now()}`, raw) } catch { /* storage full or blocked */ }
}

function copy(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value))
}

export default class LocalStorageObject {
  static read(name) {
    return JSON.parse(localStorage.getItem(name))
  }
  static write(name, value) {
    return localStorage.setItem(name, JSON.stringify(value))
  }

  constructor(name, defaultValue) {
    this.name = name
    this.object = this.load(defaultValue)
  }

  load(defaultValue) {
    let raw
    try {
      raw = localStorage.getItem(this.name)
    } catch {
      return copy(defaultValue)
    }
    if (raw === null || raw === undefined) return this.seed(defaultValue)
    try {
      return JSON.parse(raw)
    } catch {
      parkCorrupt(this.name, raw)
      return this.seed(defaultValue)
    }
  }

  seed(defaultValue) {
    try { localStorage.setItem(this.name, JSON.stringify(defaultValue)) } catch { /* in-memory only */ }
    return copy(defaultValue)
  }
}
