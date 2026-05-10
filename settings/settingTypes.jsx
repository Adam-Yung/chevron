import ColorPicker from '../src/components/Settings/ColorPicker/ColorPicker'
import { FiChevronDown } from 'react-icons/fi'
import { getPropertyByPath, setPropertyByPath } from '../src/functions/dataUtils/propertyByPath'
import copyObj from '../src/functions/dataUtils/copyObj'

const styles = {
  select: {
    minWidth: 100,
    padding: '5px 10px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.05)',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: '0.85em',
    cursor: 'pointer',
    appearance: 'none',
  },
  selectWrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  },
  selectArrow: {
    position: 'absolute',
    right: 8,
    pointerEvents: 'none',
    opacity: 0.6,
  },
  switchLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  switchTrack: {
    position: 'relative',
    width: 40,
    height: 22,
    borderRadius: 11,
    background: 'rgba(255,255,255,0.15)',
    transition: 'background 0.2s ease',
  },
  switchTrackChecked: {
    background: 'var(--primary, #3b82f6)',
  },
  switchThumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    transition: 'transform 0.2s ease',
  },
  switchThumbChecked: {
    transform: 'translateX(18px)',
  },
  input: {
    padding: '5px 10px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.05)',
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: '0.85em',
    minWidth: 80,
  },
  numberWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  suffix: {
    fontSize: '0.8em',
    opacity: 0.6,
  },
  alertDanger: {
    padding: '8px 12px',
    borderRadius: 8,
    background: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    fontSize: '0.85em',
  },
}

export class SettingType {
  _dependants = null

  constructor(defaultValue, options={}) {
    this.defaultValue = defaultValue ?? undefined
    this.format = typeof options.format === 'string' ? options.format : null
    this.scale = typeof options.scale === 'number' ? options.scale : null
    this.description = typeof options.description === 'string' ? options.description : null
  }

  static getOtherSetting(location, destination, current) {
    let targetPath = ''
    if (destination.slice(0, destination.indexOf('.')) === '_parent_') {
      targetPath = location
      destination.split('.').forEach(token => {
        if (token === '_parent_') {
          targetPath = targetPath.slice(0, targetPath.lastIndexOf('.'))
        } else {
          targetPath += '.' + token
        }
      })
    } else {
      targetPath = destination
    }

    return getPropertyByPath(current, targetPath)
  }

  set dependants(value) {
    this._dependants = value
    Object.values(this._dependants).forEach(dependant => {
      if (dependant.defaultValue === undefined || dependant.defaultValue === null)
        dependant.defaultValue = this.defaultValue
    })
  }
  get dependants() {
    return this._dependants
  }

  render(current, path, onChange) {
    if (typeof onChange === 'function')
      this.selfOnChange = value => onChange(c => {
          const copy = copyObj(c)
          setPropertyByPath(copy, path, value)
          return copy
        })

    let value = getPropertyByPath(current, path)

    const scaled = typeof value === 'number' && typeof this.scale === 'number'
      ? this.scale * value
      : value
    const formatted = this.format
      ? this.format.replaceAll('{@}', scaled)
      : scaled

    return this.display({
      raw: value,
      scaled,
      formatted
    },
    path,
    current)
  }

  onChange = value => {
    if (this._dependants)
      Object.values(this._dependants).forEach(dependant => dependant.onChange(value))

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

export class List extends SettingType {
  constructor(defaultValue, list, ...rest) {
    super(defaultValue, ...rest)
    this.list = list
  }

  display(value, path, current) {
    let list
    switch (typeof this.list) {
      case 'object':
        list = this.list
        break
      case 'string':
        list = Object.keys(SettingType.getOtherSetting(path, this.list, current))
        break
      default: throw new Error('unknown `list` type')
    }

    let options
    if (Array.isArray(list))
      options = list.map(option => (
        <option key={option} value={option}>
          {option}
        </option>))
    else
      options = Object.entries(list).map(([val, description]) => (
        <option key={val} value={val}>
          {description}
        </option>))

    return (
      <div style={styles.selectWrapper}>
        <select
          style={styles.select}
          value={value.formatted}
          onChange={e => this.onChange(e.target.value)}>
            { options }
        </select>
        <span style={styles.selectArrow}><FiChevronDown size="0.9em"/></span>
      </div>
    )
  }
}
export class Switch extends SettingType {
  constructor(defaultValue, positions=[false, true], ...rest) {
    super(defaultValue, ...rest)
    this.positions = positions
  }

  display(value) {
    const checked = value.raw === this.positions[1]
    return (
      <label style={styles.switchLabel}>
        {typeof value.raw === 'string' && <span style={{ fontSize: '0.85em', opacity: 0.7 }}>{value.raw}</span>}
        <span
          style={{ ...styles.switchTrack, ...(checked ? styles.switchTrackChecked : {}) }}
          onClick={() => this.onChange(checked ? this.positions[0] : this.positions[1])}>
          <span style={{ ...styles.switchThumb, ...(checked ? styles.switchThumbChecked : {}) }}/>
        </span>
      </label>
    )
  }
}
export class Range extends SettingType {
  constructor(defaultValue, options={}, ...rest) {
    super(defaultValue, ...rest)
    this.min = options.min ?? 0
    this.max = options.max ?? 100
    this.step = options.step ?? 1
  }

  display(value) {
    const suffix = this.format?.replaceAll('{@}', '') || ''
    return (
      <div style={styles.numberWrapper}>
        <input
          type='number'
          style={styles.input}
          value={value.raw}
          min={this.min}
          max={this.max}
          step={this.step}
          onChange={e => this.onChange(Number(e.target.value))}/>
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
        type='text'
        style={styles.input}
        placeholder={this.placeholder}
        value={value.raw}
        onChange={e => this.onChange(e.target.value)}/>
    )
  }
}
export class Color extends SettingType {
  constructor(defaultValue, contrast=null, ...rest) {
    super(defaultValue, ...rest)
    this.contrast = contrast
  }

  display(value, path, current) {
    let contrast = null
    if (this.contrast) {
      contrast = {
        name: this.contrast.name,
        isBackground: this.contrast.isBackground,
        color: SettingType.getOtherSetting(path, this.contrast.path, current)
      }
    }

    return (
      <ColorPicker
        value={value.raw}
        contrast={contrast}
        dependants={this.dependants && Object.keys(this.dependants)}
        onChange={this.onChange}/>
    )
  }
}
export class Palette {
  constructor(structure, colors) {
    for (const {name, contrast } of structure) {
      const color = colors[name]
      this[name] = new Color(color, contrast)
    }

    for (const { name, dependants } of structure)
      if (dependants)
        this[name].dependants = dependants.reduce((acc, current) => ({...acc, [current]: this[current] }), {})
  }
}
export class Theme {
  static structure = [
    {
      name: 'primary',
      contrast: {
        name: 'secondary',
        isBackground: true,
        path: '_parent_.secondary'
      },
      dependants: [
        'chevron', 'query', 'suggestions', 'time'
      ]
    },
    {
      name: 'secondary',
      contrast: {
        name: 'primary',
        isBackground: false,
        path: '_parent_.primary'
      },
      dependants: [
        'background'
      ]
    },
    {
      name: 'accent',
      contrast: {
        name: 'secondary',
        isBackground: true,
        path: '_parent_.secondary'
      },
      dependants: [
        'prefix', 'visited'
      ]
    },
    {
      name: 'chevron',
      contrast: {
        name: 'background',
        isBackground: true,
        path: '_parent_.background'
      }
    },
    {
      name: 'query',
      contrast: {
        name: 'background',
        isBackground: true,
        path: '_parent_.background'
      }
    },
    {
      name: 'suggestions',
      contrast: {
        name: 'background',
        isBackground: true,
        path: '_parent_.background'
      }
    },
    {
      name: 'time',
      contrast: {
        name: 'background',
        isBackground: true,
        path: '_parent_.background'
      }
    },
    {
      name: 'background',
      contrast: {
        name: 'primary',
        isBackground: false,
        path: '_parent_.primary'
      },
      dependants: [
        'card'
      ]
    },
    {
      name: 'card'
    },
    {
      name: 'prefix',
      contrast: {
        name: 'background',
        isBackground: true,
        path: '_parent_.background'
      }
    },
    {
      name: 'visited',
      contrast: {
        name: 'background',
        isBackground: true,
        path: '_parent_.background'
      }
    }
  ]
  static defaultColors = {
    light: {
      primary: '#212121',
      secondary: '#dee1e6',
      accent: '#3b72ff'
    },
    dark: {
      primary: '#f2f2f2',
      secondary: '#212121',
      accent: '#ffa00b'
    }
  }

  constructor(colors) {
    const light = colors?.light
      ? { ...Theme.defaultColors.light, ...colors.light }
      : Theme.defaultColors.light
    const dark = colors?.dark
      ? { ...Theme.defaultColors.dark, ...colors.dark }
      : Theme.defaultColors.dark
    this.light = new Palette(Theme.structure, light)
    this.dark  = new Palette(Theme.structure, dark)
  }
}
