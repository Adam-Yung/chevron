import { lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { SettingsContext } from '../settings/SettingsProvider'
import { useDispatch, useUi } from '../state/UiStore'
import { ui } from '../state/ui'
import { usePinnedMacros } from '../search/useConfig'
import { useSuggestionsRef } from '../search/SearchProvider'
import useKeyboard from '../input/useKeyboard'
import usePointerInput from '../input/usePointerInput'
import useTouchGestures from '../input/useTouchGestures'
import useNavigationRelease from '../navigation/useNavigationRelease'
import Stage from '../features/stage/Stage'
import QueryField from '../features/search/QueryField'
import Dock from '../features/macros/Dock'
import OfflineIndicator from '../features/status/OfflineIndicator'
import GestureHints from '../features/onboarding/GestureHints'
import { isTouch } from '../lib/isMobile'
import Corners from './Corners'
import LaunchOverlay from './LaunchOverlay'
import Notice from './Notice'
import useDocumentTheme from './useDocumentTheme'
import useIntents from './useIntents'
import { IntentsContext } from './IntentsContext'
import classes from './App.module.css'
import './global.css'

const Settings = lazy(() => import('../features/settings-panel/Settings'))
const Cheatsheet = lazy(() => import('../features/cheatsheet/Cheatsheet'))

function useInput() {
  const settings = useContext(SettingsContext)
  const pinned = usePinnedMacros()
  const suggestionsRef = useSuggestionsRef()
  const intents = useIntents()
  const hotkeys = useMemo(() => new Set(pinned.map(m => m.key).filter(Boolean)), [pinned])
  const hasSuggestions = useCallback(() => suggestionsRef.current.length > 0, [suggestionsRef])
  useKeyboard({ perform: intents.perform, hotkeys, hasSuggestions })
  usePointerInput({ wheelEnabled: settings.appearance.gestures?.enableTrackpad ?? true })
  useTouchGestures(settings.appearance.gestures?.enableSwipe ?? true)
  useNavigationRelease()
  return intents
}

function Overlays() {
  const overlay = useUi(s => s.overlay)
  const dispatch = useDispatch()
  const close = useCallback(() => dispatch(ui.overlayClosed()), [dispatch])
  return (
    <Suspense fallback={null}>
      {overlay === 'settings' && <Settings onClose={close} />}
      <Cheatsheet open={overlay === 'cheatsheet'} onClose={close} />
    </Suspense>
  )
}

export default function App() {
  useDocumentTheme()
  const { openMacro, perform } = useInput()
  const view = useUi(s => s.view)
  const overlay = useUi(s => s.overlay)

  // Closing a panel hands the keyboard back to the search field; not on boot, and not on touch screens, where focusing would pop
  // the on-screen keyboard unasked.
  const previousOverlay = useRef(overlay)
  useEffect(() => {
    const closed = previousOverlay.current && !overlay
    previousOverlay.current = overlay
    if (closed && !isTouch) document.getElementById('chevron-query')?.focus({ preventScroll: true })
  }, [overlay])

  return (
    <IntentsContext.Provider value={perform}>
    <div className={`app ${isTouch ? 'is-touch' : ''}`} data-view={view}>
      <div className={classes.container}>
        <Stage view={view} onOpenMacro={openMacro} />
        <QueryField />
        <Corners />
      </div>
      <Dock onOpenMacro={openMacro} />
      <LaunchOverlay />
      <Notice />
      <Overlays />
      <OfflineIndicator />
      <GestureHints />
    </div>
    </IntentsContext.Provider>
  )
}
