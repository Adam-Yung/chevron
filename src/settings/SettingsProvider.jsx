import { createContext, useEffect, useRef, useState } from 'react'
import useColorSchemeDetector from './useColorSchemeDetector'
import settings from './schema'
import LocalSettings from '../storage/settingsStorage'
import { getStoredVersion, writeVersion, SETTINGS_VERSION } from './settingsMigration'
import { resolveSettings, pickChanged } from './resolveSettings'

const PERSIST_DEBOUNCE_MS = 300

// Resolved at import so the first render already sees migrated, validated settings.
function loadSettings() {
  const localSettings = new LocalSettings()
  const { settings: resolved, needsVersionWrite } = resolveSettings(localSettings.object, getStoredVersion(), settings.defaults)
  if (needsVersionWrite) writeVersion(SETTINGS_VERSION)
  return { localSettings, resolved }
}

const { localSettings, resolved: assignedSettings } = loadSettings()
const defaults = settings.defaults

const save = value => localSettings.set(pickChanged(defaults, value))

export const SettingsContext = createContext(null)
export const SetSettingsContext = createContext(null)
export const ThemeContext = createContext(null)
export const ColorSchemeContext = createContext(null)

function pageHideFlusher(timer, latest) {
  return () => {
    if (timer.current === null) return
    clearTimeout(timer.current)
    timer.current = null
    save(latest.current)
  }
}

// Debounced writes; a pending one is flushed on page hide and unmount so the last edit is never lost.
function usePersistence(current) {
  const timer = useRef(null)
  const latest = useRef(current)
  latest.current = current

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = null
      save(latest.current)
    }, PERSIST_DEBOUNCE_MS)
  }, [current])

  useEffect(() => {
    const flush = pageHideFlusher(timer, latest)
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [])
}

export default function SettingsProvider({ children }) {
  const [current, setCurrent] = useState(assignedSettings)
  usePersistence(current)

  const systemColorScheme = useColorSchemeDetector()
  const colorScheme = current.appearance.colorScheme === 'auto' ? systemColorScheme : current.appearance.colorScheme
  const theme = current.appearance.themes[current.appearance.activeTheme][colorScheme]

  return (
    <SettingsContext.Provider value={current}>
      <SetSettingsContext.Provider value={setCurrent}>
        <ThemeContext.Provider value={theme}>
          <ColorSchemeContext.Provider value={colorScheme}>
            {children}
          </ColorSchemeContext.Provider>
        </ThemeContext.Provider>
      </SetSettingsContext.Provider>
    </SettingsContext.Provider>
  )
}
