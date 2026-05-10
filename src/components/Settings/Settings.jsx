import { useCallback, useContext, useRef, useState, useEffect, useMemo } from 'react'
import { SettingsContext, SetSettingsContext } from '../../contexts/Settings'
import { FiX, FiEye, FiEyeOff, FiSettings, FiLayout, FiZap, FiSearch, FiGrid, FiCommand, FiRotateCcw, FiTrash2, FiCloud } from 'react-icons/fi'
import Category from './Category/Category'
import MacrosEditorBody from '../MacrosEditor/MacrosEditorBody'
import { geocodeCity } from '../../functions/webUtils/openWeather'
import { clearWeatherCache } from '../Weather/weatherCache'
import settings from '../../../settings/settings'
import classes from './Settings.module.css'
import camelCaseToTitle from '../../functions/dataUtils/camelCaseToTitle'

/**
 * Centerstage Settings modal.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────┐
 *   │  Settings                              [X]  │   header
 *   ├──────────────┬──────────────────────────────┤
 *   │  General     │   Active pane                │
 *   │  Appearance  │   (category fields with      │
 *   │  Chevron     │    inline title + descr.)    │
 *   │  Query       │                              │
 *   │  Menu        │                              │
 *   │  Macros      │                              │
 *   │  …           │                              │
 *   │  ─────       │                              │
 *   │  Show hidden │                              │
 *   │  Reset       │                              │
 *   │  Clean hist. │                              │
 *   └──────────────┴──────────────────────────────┘
 *
 * Macros tab embeds MacrosEditorBody directly so the user no longer
 * needs to open a second modal. All settings auto-persist via the
 * SettingsProvider's debounced effect, so clicking [X] simply closes.
 *
 * The user-facing semantics for "discard": the previous panel offered
 * apply/cancel buttons. We replaced that with auto-save + the
 * Reset settings action in the sidebar. The X is a pure close.
 */

const TAB_ICONS = {
  general: FiSettings,
  appearance: FiLayout,
  chevron: FiZap,
  query: FiSearch,
  menu: FiGrid,
  macros: FiCommand,
  weather: FiCloud
}

function Settings({ onClose }) {
  const current = useContext(SettingsContext)
  const setCurrent = useContext(SetSettingsContext)

  const dialogRef = useRef(null)
  const lastFocusedRef = useRef(null)

  const [showHidden, setShowHidden] = useState(false)
  const hiddenSettings = showHidden ? [] : settings.hidden

  // Tabs: every top-level category from the settings template, plus a
  // synthetic "macros" tab that hosts the MacrosEditor body.
  const tabs = useMemo(() => {
    const categories = Object.keys(settings.template).filter(k => !hiddenSettings.includes(k))
    return [...categories, 'macros']
  }, [hiddenSettings])

  const [activeTab, setActiveTab] = useState(tabs[0] || 'general')

  // If the active tab disappears (showHidden toggle pruning), fall back.
  useEffect(() => {
    if (!tabs.includes(activeTab)) setActiveTab(tabs[0])
  }, [tabs, activeTab])

  // Focus + Esc handling.
  useEffect(() => {
    lastFocusedRef.current = document.activeElement
    const id = window.requestAnimationFrame(() => dialogRef.current?.focus())
    return () => {
      window.cancelAnimationFrame(id)
      if (lastFocusedRef.current?.focus)
        try { lastFocusedRef.current.focus() } catch { /* ignore */ }
    }
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      e.preventDefault()
      onClose()
    }
  }, [onClose])

  const handleResetSettings = useCallback(() => {
    if (!confirm('Reset all settings to defaults? This will reload the page.')) return
    localStorage.removeItem('settings')
    location.reload()
  }, [])

  const handleCleanHistory = useCallback(() => {
    if (!confirm('Clear search history? This will reload the page.')) return
    localStorage.removeItem('history')
    location.reload()
  }, [])

  const renderPane = () => {
    if (activeTab === 'macros') {
      return (
        <>
          <h3 className={classes['paneTitle']}>Macros</h3>
          <p className={classes['paneSubtitle']}>
            Edit macros, commands, and search engines. Saved to localStorage; bundled config is the fallback.
          </p>
          <MacrosEditorBody />
        </>
      )
    }
    if (activeTab === 'weather') {
      return (
        <>
          <h3 className={classes['paneTitle']}>Weather</h3>
          <p className={classes['paneSubtitle']}>
            Requires a free <a href="https://openweathermap.org/api" target="_blank" rel="noreferrer">OpenWeatherMap</a> API key.
            Enter your key, type a city, and click Resolve to auto-fill coordinates.
          </p>
          <Category
            path="weather"
            hidden={[...hiddenSettings, 'weather.city']}
            template={settings.template}
            current={current}
            onChange={setCurrent}
            hideOwnTitle
          />
          <GeocodeRow current={current} onChange={setCurrent} />
        </>
      )
    }
    return (
      <>
        <h3 className={classes['paneTitle']}>{camelCaseToTitle(activeTab, true)}</h3>
        <Category
          path={activeTab}
          hidden={hiddenSettings}
          template={settings.template}
          current={current}
          onChange={setCurrent}
          hideOwnTitle
        />
      </>
    )
  }

  return (
    <div
      className={classes['backdrop']}
      onClick={onClose}
      data-keep-focus="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        tabIndex={-1}
        className={classes['dialog']}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={classes['header']}>
          <h2 className={classes['title']}>Settings</h2>
          <button
            type="button"
            className={classes['closeButton']}
            onClick={onClose}
            aria-label="Close settings"
            title="Close (Esc)"
          >
            <FiX size="1.25em" />
          </button>
        </div>

        <div className={classes['body']}>
          <nav className={classes['sidebar']} aria-label="Settings sections">
            {tabs.map(tab => {
              const Icon = TAB_ICONS[tab]
              const isActive = tab === activeTab
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${classes['tab']}${isActive ? ' ' + classes['active'] : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {Icon && <span className={classes['tabIcon']}><Icon /></span>}
                  {camelCaseToTitle(tab, true)}
                </button>
              )
            })}

            <hr className={classes['sidebarDivider']} />

            <button
              type="button"
              className={classes['sidebarAction']}
              onClick={() => setShowHidden(s => !s)}
              title={showHidden ? 'Hide advanced fields' : 'Show advanced fields'}
            >
              <span className={classes['tabIcon']}>
                {showHidden ? <FiEye /> : <FiEyeOff />}
              </span>
              {showHidden ? 'Hide advanced' : 'Show advanced'}
            </button>
            <button
              type="button"
              className={classes['sidebarAction']}
              onClick={handleResetSettings}
            >
              <span className={classes['tabIcon']}><FiRotateCcw /></span>
              Reset settings
            </button>
            <button
              type="button"
              className={`${classes['sidebarAction']} ${classes['danger']}`}
              onClick={handleCleanHistory}
            >
              <span className={classes['tabIcon']}><FiTrash2 /></span>
              Clean history
            </button>
          </nav>

          <main className={classes['pane']} role="tabpanel">
              {renderPane()}
            </main>
        </div>
      </div>
    </div>
  )
}

export default Settings

// ── GeocodeRow ────────────────────────────────────────────────────────────
// Custom geocoding UI rendered inside the weather tab. Shows a city text
// input + "Resolve" button → dropdown of up to 5 results → selecting one
// writes lat/lon/city back to settings.

function GeocodeRow({ current, onChange }) {
  const apiKey = current.weather?.apiKey ?? ''
  const city   = current.weather?.city   ?? ''

  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const abortRef = useRef(null)

  const handleResolve = useCallback(async () => {
    if (!apiKey || !city) return
    if (!/^[0-9a-f]{32}$/i.test(apiKey)) {
      setError('API key must be a 32-character hex string from openweathermap.org.')
      return
    }
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const data = await geocodeCity(city, apiKey, abortRef.current.signal)
      if (!data.length) setError('No locations found.')
      else setResults(data)
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || 'Geocoding failed.')
    } finally {
      setLoading(false)
    }
  }, [apiKey, city])

  const handleSelect = useCallback((result) => {
    onChange(prev => ({
      ...prev,
      weather: {
        ...prev.weather,
        city: result.name,
        lat:  String(result.lat),
        lon:  String(result.lon)
      }
    }))
    clearWeatherCache()
    setResults([])
  }, [onChange])

  const hasCoords = Boolean(current.weather?.lat && current.weather?.lon)

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '0.8em', opacity: 0.7, marginBottom: 4 }}>
            City
          </label>
          <input
            type="text"
            value={city}
            placeholder="e.g. London, Tokyo"
            onChange={e => onChange(prev => ({ ...prev, weather: { ...prev.weather, city: e.target.value } }))}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <button
          type="button"
          onClick={handleResolve}
          disabled={!apiKey || !city || loading}
          style={{ flexShrink: 0, padding: '6px 12px' }}>
          {loading ? '…' : 'Resolve'}
        </button>
      </div>

      {error && (
        <p style={{ color: 'salmon', fontSize: '0.85em', marginTop: 6 }}>{error}</p>
      )}

      {results.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, border: '1px solid rgba(128,128,128,0.25)', borderRadius: 6, overflow: 'hidden' }}>
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(r)}
                style={{ width: '100%', textAlign: 'left', padding: '6px 10px', background: 'none', border: 0, color: 'inherit', cursor: 'pointer', fontSize: '0.9em' }}>
                {r.name}{r.state ? `, ${r.state}` : ''}, {r.country}
                <span style={{ opacity: 0.45, fontSize: '0.85em', marginLeft: 8 }}>
                  {Number(r.lat).toFixed(4)}, {Number(r.lon).toFixed(4)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasCoords && (
        <p style={{ fontSize: '0.8em', opacity: 0.5, marginTop: 6 }}>
          ✓ Coordinates set: {current.weather.lat}, {current.weather.lon}
        </p>
      )}
    </div>
  )
}
