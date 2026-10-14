import { createContext, useEffect, useRef, useState } from 'react'
import useColorSchemeDetector from '../hooks/useColorSchemeDetector'
import settings from '../../settings/settings'
import LocalSettings from '../classes/localStorage/settings'
import { getStoredVersion, writeVersion, SETTINGS_VERSION } from './settingsMigration'
import { resolveSettings } from './resolveSettings'

const localSettings = new LocalSettings()

// Phase 8.5: run migration + validation before merging with defaults.
// This runs once at module evaluation time (before the first render),
// so any fixes are in place before the React tree is built.
//
// Perf: resolveSettings skips the migration walk + full-tree validation
// entirely when the stored version already matches SETTINGS_VERSION (the
// common case on every normal load) — only the cheap deepMerge runs then.
function loadSettings() {
  const raw = localSettings.object ?? {}
  const storedVersion = getStoredVersion()
  const { settings: resolved, needsVersionWrite } =
    resolveSettings(raw, storedVersion, settings.defaults)
  if (needsVersionWrite) {
    writeVersion(SETTINGS_VERSION)
  }
  return resolved
}

const assignedSettings = loadSettings()

const SETTINGS_PERSIST_DEBOUNCE_MS = 300

export const SettingsContext = createContext(null)
export const SetSettingsContext = createContext(null)
export const ThemeContext = createContext(null)
export const ColorSchemeContext = createContext(null)

export default function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(assignedSettings)

  const activeTheme = settings.appearance.activeTheme
  const systemColorScheme = useColorSchemeDetector()
  const colorScheme = settings.appearance.colorScheme === 'auto'
    ? systemColorScheme
    : settings.appearance.colorScheme
  const theme = settings.appearance.themes[activeTheme][colorScheme]

  // sync settings with localStorage (debounced to avoid write storms from
  // rapid changes like dragging a color picker)
  const persistTimerRef = useRef(null)
  const settingsRef = useRef(settings)
  useEffect(() => { settingsRef.current = settings })

  useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    persistTimerRef.current = setTimeout(() => {
      localSettings.set(settingsRef.current)
      persistTimerRef.current = null
    }, SETTINGS_PERSIST_DEBOUNCE_MS)
  }, [settings])

  // flush pending writes on unmount / page hide so nothing is lost
  useEffect(() => {
    const flush = () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current)
        persistTimerRef.current = null
        localSettings.set(settingsRef.current)
      }
    }
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [])

  return (
    <SettingsContext.Provider value={settings}>
      <SetSettingsContext.Provider value={setSettings}>
        <ThemeContext.Provider value={theme}>
          <ColorSchemeContext.Provider value={colorScheme}>
            {children}
          </ColorSchemeContext.Provider>
        </ThemeContext.Provider>
      </SetSettingsContext.Provider>
    </SettingsContext.Provider>
  )
}