import { useContext, useEffect } from 'react'
import { ColorSchemeContext, SettingsContext, ThemeContext } from '../settings/SettingsProvider'

/** Mirrors settings onto the document: theme colours as CSS variables, colour scheme, glass mode, tab title. */
export default function useDocumentTheme() {
  const settings = useContext(SettingsContext)
  const theme = useContext(ThemeContext)
  const colorScheme = useContext(ColorSchemeContext)
  const glass = settings.appearance.glassmorphism
  const title = settings.general.tabTitle

  useEffect(() => {
    const root = document.documentElement
    for (const name in theme) root.style.setProperty('--' + name, theme[name])
    // The pre-React script painted this colour to avoid a flash; from here on the variables own it.
    root.style.backgroundColor = theme.background ?? ''
  }, [theme])

  useEffect(() => {
    document.body.setAttribute('data-color-scheme', colorScheme)
  }, [colorScheme])

  useEffect(() => {
    document.body.toggleAttribute('data-glass-mode', Boolean(glass))
  }, [glass])

  useEffect(() => {
    document.title = title || 'Chevron'
  }, [title])
}
