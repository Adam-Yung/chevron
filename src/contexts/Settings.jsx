import { createContext, useEffect, useRef, useState } from 'react'
import useColorSchemeDetector from '../hooks/useColorSchemeDetector'
import assignDeep from 'assign-deep'
import settings from '../../settings/settings'
import LocalSettings from '../classes/localStorage/settings'

const localSettings = new LocalSettings()
const assignedSettings = assignDeep(settings.defaults, localSettings.object)

const SETTINGS_PERSIST_DEBOUNCE_MS = 150

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
  useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
    persistTimerRef.current = setTimeout(() => {
      localSettings.set(settings)
      persistTimerRef.current = null
    }, SETTINGS_PERSIST_DEBOUNCE_MS)
  }, [settings])

  // flush pending writes on unmount / page hide so nothing is lost
  useEffect(() => {
    const flush = () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current)
        persistTimerRef.current = null
        localSettings.set(settings)
      }
    }
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [settings])

  // sync JOY UI color scheme
  useEffect(() => {
    localStorage.setItem('joy-mode', colorScheme)
  }, [colorScheme])

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