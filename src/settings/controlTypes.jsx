import { FiChevronDown } from 'react-icons/fi'
import { SettingType } from './settingType'
import NumberField from './NumberField'
import styles from './controlStyles'

function optionElements(list) {
  if (Array.isArray(list)) return list.map(option => <option key={option} value={option}>{option}</option>)
  return Object.entries(list).map(([val, description]) => <option key={val} value={val}>{description}</option>)
}

// A string `list` names another setting whose keys are the options (the theme picker lists appearance.themes).
function resolveList(list, path, current) {
  if (typeof list === 'object') return list
  if (typeof list === 'string') return Object.keys(SettingType.getOtherSetting(path, list, current) ?? {})
  throw new Error('unknown `list` type')
}

export class List extends SettingType {
  constructor(defaultValue, list, ...rest) {
    super(defaultValue, ...rest)
    this.list = list
  }

  display(value, path, current) {
    return (
      <div style={styles.selectWrapper}>
        <select style={styles.select} value={value.formatted} onChange={e => this.onChange(e.target.value)}>
          {optionElements(resolveList(this.list, path, current))}
        </select>
        <span style={styles.selectArrow}><FiChevronDown size="0.9em" /></span>
      </div>
    )
  }
}

// `positions` is [off, on]; the stored value is whichever position is selected, so a string-valued switch (_self/_blank) works too.
export class Switch extends SettingType {
  constructor(defaultValue, positions = [false, true], ...rest) {
    super(defaultValue, ...rest)
    this.positions = positions
  }

  display(value) {
    const checked = value.raw === this.positions[1]
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        style={{ ...styles.switchTrack, ...(checked ? styles.switchTrackChecked : {}) }}
        onClick={() => this.onChange(checked ? this.positions[0] : this.positions[1])}>
        <span style={{ ...styles.switchThumb, ...(checked ? styles.switchThumbChecked : {}) }} />
      </button>
    )
  }
}

export class Range extends SettingType {
  constructor(defaultValue, options = {}, ...rest) {
    super(defaultValue, ...rest)
    this.min = options.min ?? 0
    this.max = options.max ?? 100
    this.step = options.step ?? 1
  }

  display(value) {
    const suffix = this.format?.replaceAll('{@}', '') || ''
    return (
      <div style={styles.numberWrapper}>
        <NumberField value={value.raw} min={this.min} max={this.max} step={this.step} onCommit={this.onChange} />
        {suffix && <span style={styles.suffix}>{suffix}</span>}
      </div>
    )
  }
}

export class Input extends SettingType {
  constructor(defaultValue, placeholder, ...rest) {
    super(defaultValue, ...rest)
    this.placeholder = placeholder
  }

  display(value) {
    return (
      <input
        type="text"
        style={styles.input}
        placeholder={this.placeholder}
        value={value.raw}
        onChange={e => this.onChange(e.target.value)} />
    )
  }
}
