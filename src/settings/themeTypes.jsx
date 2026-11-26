import ColorPicker from '../features/settings-panel/ColorPicker/ColorPicker'
import { SettingType } from './settingType'

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
        'background', 'seam'
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
      }
    },
    // Two threads: `thread` sews the felt badges, which are always dyed dark; `seam` sews the chevron, which is pale on a dark
    // theme, so it follows the cloth.
    {
      name: 'thread'
    },
    {
      name: 'seam'
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
      accent: '#3b72ff',
      thread: '#efe6cc'
    },
    dark: {
      primary: '#f2f2f2',
      secondary: '#212121',
      accent: '#ffa00b',
      thread: '#e9dfc4'
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
