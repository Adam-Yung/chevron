import LocalStorageObject from './localStorageObject'
import { obfuscate, deobfuscate } from './obfuscate'

// Paths holding API keys, obfuscated at rest so they are not casually readable in devtools.
const SENSITIVE_PATHS = [
  ['query', 'AI', 'apiKey'],
  ['weather', 'apiKey']
]

function getNestedValue(obj, path) {
  let cur = obj
  for (const key of path) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = cur[key]
  }
  return cur
}

function setNestedValue(obj, path, value) {
  let cur = obj
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    if (cur[key] == null || typeof cur[key] !== 'object') cur[key] = {}
    cur = cur[key]
  }
  cur[path[path.length - 1]] = value
}

function transformSensitiveFields(settings, fn) {
  if (!settings || typeof settings !== 'object') return settings
  const clone = JSON.parse(JSON.stringify(settings))
  for (const path of SENSITIVE_PATHS) {
    const val = getNestedValue(clone, path)
    if (val && typeof val === 'string') {
      setNestedValue(clone, path, fn(val))
    }
  }
  return clone
}

export default class Settings extends LocalStorageObject {
  static objectName = 'settings'
  static get initialState() {
    return {}
  }
  
  constructor() {
    super(Settings.objectName, Settings.initialState)
    if (this.object) {
      this.object = transformSensitiveFields(this.object, deobfuscate)
    }
  }

  set(newSettings) {
    this.object = newSettings
    const toStore = transformSensitiveFields(newSettings, obfuscate)
    // A full or blocked store must not throw out of a timer or pagehide handler; settings stay live in memory.
    try { LocalStorageObject.write(Settings.objectName, toStore) } catch (err) { console.warn('[chevron] settings not saved:', err) }
  }
}