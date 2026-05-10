import * as types from './settingTypes'

const searchEngines = {}
for (const key in window.CONFIG.engines)
  searchEngines[key] = window.CONFIG.engines[key].name

const template = {
  general: {
    /* TODO
      mode: new types.List('chevron', ['chevron', 'legacy']),
    */
    // from confing.engines (keys)
    searchEngine: new types.List('google', searchEngines, { description: 'Default search engine used when nothing else matches.' }),
    searchHistory: new types.Switch(true, undefined, { description: 'Remember recent queries and surface them as suggestions.' }),
    quickRedirect: new types.Switch(false, undefined, { description: 'Submit immediately when an exact macro match is found — no Enter required.' }),
    animationSpeed: new types.Range(
      400,
      { min: 0, max: 5000, step: 50 },
      { format: '{@}ms', description: 'Master speed for chevron / menu animations. Lower is snappier.' }
    ),
    /**
     * languages: https://serpapi.com/google-languages
     * countries: https://serpapi.com/google-countries
     * locale parameter is used by autocomplete engine and other components
     */
    locale: new types.Input('en', '[language]-[COUNTRY]', { description: 'Locale used by autocomplete and search engines (e.g. en, en-US, ja-JP).' }),
    tabTitle: new types.Input('Chevron', undefined, { description: 'Browser tab title.' }),
    // hidden
    redirectTarget: new types.Switch('_self', ['_self', '_blank'], { description: 'Open results in the same tab (_self) or a new one (_blank).' })
  },
  appearance: {
    colorScheme: new types.List('auto', ['auto', 'light', 'dark'], { description: 'Follow OS preference, or pin to light / dark.' }),
    activeTheme: new types.List('default', 'appearance.themes', { description: 'Currently applied theme.' }),
    themes: {
      default: new types.Theme(),

      // A deep navy + electric cyan pair — feels like a late-night terminal.
      midnight: new types.Theme({
        light: { primary: '#0a0f1e', secondary: '#e8edf5', accent: '#00c8ff' },
        dark:  { primary: '#cce8ff', secondary: '#0a0f1e', accent: '#00c8ff' }
      }),

      // Warm cream paper with forest green ink — calm, readable, analog.
      forest: new types.Theme({
        light: { primary: '#1a2e1a', secondary: '#f4f0e6', accent: '#3d8b37' },
        dark:  { primary: '#c8e6c0', secondary: '#1a2e1a', accent: '#5cb85c' }
      }),

      // Rich burgundy and warm ivory — like a leather-bound notebook.
      burgundy: new types.Theme({
        light: { primary: '#2d0a1a', secondary: '#faf6f0', accent: '#9b1a3a' },
        dark:  { primary: '#f5d0d8', secondary: '#2d0a1a', accent: '#e05070' }
      }),

      // Slate grey with a vivid violet pop — modern, minimal, focused.
      slate: new types.Theme({
        light: { primary: '#1e1e2e', secondary: '#eff0f4', accent: '#7c3aed' },
        dark:  { primary: '#e2e0f0', secondary: '#1e1e2e', accent: '#a78bfa' }
      }),

      // Warm sand and terracotta — earthy, Mediterranean, sun-soaked.
      dune: new types.Theme({
        light: { primary: '#3b2a1a', secondary: '#fdf5e6', accent: '#c0622a' },
        dark:  { primary: '#f5e0c8', secondary: '#2a1a0e', accent: '#e8844a' }
      }),

      // True OLED black with neon rose — maximum contrast, cyberpunk edge.
      noir: new types.Theme({
        light: { primary: '#0d0d0d', secondary: '#f5f5f5', accent: '#ff2d6b' },
        dark:  { primary: '#f5f5f5', secondary: '#000000', accent: '#ff2d6b' }
      }),
    },
    // hidden; TODO: realistic
    style: new types.List('default', ['default']),
    macroMenu: {
      glassmorphism: new types.Switch(false, undefined, { description: 'Frost the macros menu backdrop with a blur effect. Disable on slow GPUs.' })
    },
    gestures: {
      enableSwipe:    new types.Switch(true, undefined, { description: 'Swipe up to open the macros menu, swipe down to close.' }),
      enableTrackpad: new types.Switch(true, undefined, { description: 'Trackpad scroll paginates the macros menu horizontally.' })
    }
  },
  chevron: {
    thickness: new types.Range(
      15,
      { min: 1, max: 50 },
      { format: '{@}px', description: 'Stroke thickness of the central chevron.' }
    ),
    size: new types.Range(
      20,
      undefined,
      { format: '{@}%', description: 'Overall size of the chevron relative to viewport.' }
    ),
    quickLook: {
      marquee: new types.Switch(true, undefined, { description: 'Scroll long search-suggestion text on hover.' }),
      showMacrosLabel: new types.Switch(false, undefined, { description: 'Show the macro label next to its icon in quick-look.' }),
      // hidden
      topCurvature: new types.Range(
        0.3,
        { min: 0, max: 1, step: 0.1 }
      ),
      // hidden
      bottomCurvature: new types.Range(
        0.4,
        { min: 0, max: 1, step: 0.1 }
      )
    }
  },
  query: {
    forceSearchEngineOnCtrl: new types.Switch(true, undefined, { description: 'Hold Ctrl on submit to bypass macros and use the search engine.' }),
    notifyAboutForcedSearchEngine: new types.Switch(true, undefined, { description: 'Show a small notice when Ctrl forces the search engine.' }),
    field: {
      fontSize: new types.Range(
        5,
        { min: 0.1, max: 20, step: 0.1 },
        { format: '{@}em', description: 'Font size of the main search input.' }
      ),
      caret: new types.Switch(false, undefined, { description: 'Show the blinking text caret in the search field.' })
    },
    suggestions: {
      fontSize: new types.Range(
        1.8,
        { min: 0.1, max: 10, step: 0.1 },
        { format: '{@}em', description: 'Font size of the suggestion list.' }
      ),
      autocompleteLimit: new types.Range(
        10,
        { min: 0, max: 50 },
        { description: 'Max number of autocomplete suggestions to fetch.' }
      ),
      historyLimit: new types.Range(
        5,
        { min: 0, max: 50 },
        { description: 'Max number of past queries to surface.' }
      )
    },
    AI: {
      enabled: new types.Switch(true, undefined, { description: 'Enable double-Space to send the current query to an AI provider.' }),
      provider: new types.List('openai', { openai: 'OpenAI', ollama: 'Ollama (local)' }, { description: 'Which AI backend to call.' }),
      baseURL: new types.Input('', 'http://localhost:11434  (Ollama)', { description: 'Optional endpoint override. Required for Ollama; blank for hosted OpenAI.' }),
      model: new types.Input('', 'e.g. llama3, gpt-4o-mini', { description: 'Model id sent in the request. Required for Ollama; blank uses gpt-3.5-turbo for OpenAI.' }),
      apiKey: new types.Input('', 'API key (OpenAI). Leave blank for Ollama.', { description: 'API key for OpenAI. Stored locally; never leaves your browser.' }),
      temperature: new types.Range(
        0.4,
        { min: 0, max: 1, step: 0.05 },
        { description: 'Higher = more creative, lower = more deterministic.' }
      ),
      language: new types.Input('', undefined, { description: 'Force responses in this language (e.g. English, Japanese). Blank = auto.' })
    }
  },
  menu: {
    rows: new types.Range(
      2,
      { min: 1, max: 20 },
      { description: 'Macro grid rows per page.' }
    ),
    columns: new types.Range(
      4,
      { min: 1, max: 20 },
      { description: 'Macro grid columns per page.' }
    ),
    gap: new types.Range(
      10,
      { min: 0, max: 50 },
      { format: '{@}px', description: 'Spacing between macro tiles.' }
    ),
    pagination: new types.Switch(false, undefined, { description: 'Show page dots beneath the macro grid.' }),
    arrows: new types.Switch(true, undefined, { description: 'Show navigation arrows on the macro grid.' }),
    drag: new types.Switch(true, undefined, { description: 'Allow dragging to swipe between pages.' }),
    time: {
      fontSize: new types.Range(
        1,
        { min: 0.1, max: 10, step: 0.1 },
        { format: '{@}em', description: 'Font size of the clock display.' }
      ),
      format: new types.Input('h:mm', undefined, { description: "Clock format string. Tokens: HH/H, hh/h, MM/M, mm/m, ss/s, dd/d, TT/tt, yyyy/yy." })
    }
  },
  weather: {
    apiKey:       new types.Input('', undefined, { description: 'OpenWeatherMap API key. Free tier at openweathermap.org — 60 calls/min, no credit card required.' }),
    city:         new types.Input('', undefined, { description: 'City name. Use the Resolve button to auto-fill coordinates.' }),
    // lat/lon are auto-filled by the geocoding flow and hidden from the main UI
    lat:          new types.Input('', undefined, { description: 'Latitude (auto-filled by Resolve).' }),
    lon:          new types.Input('', undefined, { description: 'Longitude (auto-filled by Resolve).' }),
    units:        new types.List('metric', ['metric', 'imperial', 'standard'], { description: 'Temperature units: metric (°C), imperial (°F), or standard (K).' }),
    forecastDays: new types.Range(5, { min: 0, max: 5 }, { description: 'Number of forecast days to show (max 5 — OpenWeatherMap free-tier limit). 0 = current conditions only.' })
  }
}

const hidden = [
  'general.redirectTarget',
  'appearance.style',
  'chevron.quickLook.topCurvature',
  'chevron.quickLook.bottomCurvature',
  'weather.lat',
  'weather.lon'
]

class Settings {
  constructor(template, hidden) {
    this._template = template
    this._hidden = hidden
  }

  get defaults() {
    return this._getDefaults(this.template)
  }

  get template() {
    return this._template
  }

  get hidden() {
    const result = [...this._hidden]
    
    // hide advanced theme colors
    const hiddenColors = ['chevron', 'query', 'suggestions', 'background', 'prefix', 'visited', 'time', 'card']
    for (const theme of Object.keys(this.template.appearance.themes)) {
      // light theme
      hiddenColors.forEach(hC => result.push('appearance.themes.' + theme + '.light.' + hC))
      // dark theme
      hiddenColors.forEach(hC => result.push('appearance.themes.' + theme + '.dark.' + hC))
    }

    return result
  }

  _getDefaults(structure) {
    const result = {}
    
    for (const key in structure) {
      if (typeof structure[key] !== 'object') throw new Error('wrong structure')
      
      if (structure[key] instanceof types.SettingType) {
        result[key] = structure[key].defaultValue
      } else {
        result[key] = this._getDefaults(structure[key])
      }
    }

    return result
  }

  //!
  getCategories(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + '.' : ''
      if ('render' in obj[k]) 
        Object.assign(acc, this.getCategories(obj[k], pre + k))
      else 
        acc[pre + k] = obj[k]
      return acc
    }, {})
  }
}

const settings = new Settings(template, hidden)

export default settings