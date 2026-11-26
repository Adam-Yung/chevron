import { getPropertyByPath } from '../lib/propertyByPath'
import styles from './controlStyles'

/**
 * Base of every schema entry: holds the default, the display options and the change plumbing, and renders itself through
 * `display()`, which subclasses override. `dependants` are other entries that follow this one's value (derived theme colours).
 */
export class SettingType {
  _dependants = null

  constructor(defaultValue, options = {}) {
    this.defaultValue = defaultValue ?? undefined
    this.format = typeof options.format === 'string' ? options.format : null
    this.scale = typeof options.scale === 'number' ? options.scale : null
    this.description = typeof options.description === 'string' ? options.description : null
    this.label = typeof options.label === 'string' ? options.label : null
  }

  // `_parent_.x` paths are relative to the setting being drawn, so a theme colour can name its sibling without knowing the theme.
  static getOtherSetting(location, destination, current) {
    if (destination.slice(0, destination.indexOf('.')) !== '_parent_') return getPropertyByPath(current, destination)
    let targetPath = location
    for (const token of destination.split('.')) {
      targetPath = token === '_parent_' ? targetPath.slice(0, targetPath.lastIndexOf('.')) : targetPath + '.' + token
    }
    return getPropertyByPath(current, targetPath)
  }

  set dependants(value) {
    this._dependants = value
    Object.values(value).forEach(dependant => {
      if (dependant.defaultValue === undefined || dependant.defaultValue === null) dependant.defaultValue = this.defaultValue
    })
  }
  get dependants() {
    return this._dependants
  }

  render(current, path, onChange) {
    if (typeof onChange === 'function') this.selfOnChange = value => onChange(c => setAtPath(c, path, value))

    const raw = getPropertyByPath(current, path)
    const scaled = typeof raw === 'number' && typeof this.scale === 'number' ? this.scale * raw : raw
    const formatted = this.format ? this.format.replaceAll('{@}', scaled) : scaled
    return this.display({ raw, scaled, formatted }, path, current)
  }

  onChange = value => {
    if (this._dependants) Object.values(this._dependants).forEach(dependant => dependant.onChange(value))
    this.selfOnChange?.(value)
  }

  display(value) {
    return (
      <div style={styles.alertDanger}>
        Can&#39;t display this property correctly! The current value is <strong>{String(value.raw)}</strong>
      </div>
    )
  }
}

// Copies only the objects along `path`, so every untouched branch keeps its identity and memoised readers skip re-rendering.
export function setAtPath(root, path, value) {
  const keys = path.split('.')
  const next = { ...root }
  let cursor = next
  for (const key of keys.slice(0, -1)) {
    cursor[key] = { ...cursor[key] }
    cursor = cursor[key]
  }
  cursor[keys[keys.length - 1]] = value
  return next
}
