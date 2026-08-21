import { lazy, Suspense, useContext, useEffect, useRef, useState } from 'react'
import { ColorSchemeContext, SettingsContext, ThemeContext } from './contexts/Settings'
import { useReset, useStateSelector, useUpdate } from './contexts/Store'
import useMacroFilter from './hooks/useMacroFilter'
import useGestures from './hooks/useGestures'
import { AnimatePresence, motion } from 'framer-motion'
import ActiveElements from './components/ActiveElements/ActiveElements'
import QueryField from './components/QueryField/QueryField'
import LayoutButton from './components/LayoutButton/LayoutButton'

// The Settings panel pulls in MUI Joy + the color picker + every setting
// type editor; defer the chunk until the user actually opens settings.
const Settings = lazy(() => import('./components/Settings/Settings'))
// Cheatsheet is small but never needed on first paint, so lazy-load it too.
const Cheatsheet = lazy(() => import('./components/Cheatsheet/Cheatsheet'))
// Pre-warm the MacrosMenu chunk on idle so the first open is instant and the
// CSS keyframe hint animation fires rather than being skipped because the
// chunk hadn't loaded before the open animation completed.
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => import('./components/MacrosMenu/MacrosMenu'))
} else {
  setTimeout(() => import('./components/MacrosMenu/MacrosMenu'), 200)
}
import OfflineIndicator from './components/OfflineIndicator/OfflineIndicator'
import { BsGearFill, BsChevronRight, BsQuestionLg } from 'react-icons/bs'
import { RiMenu5Fill } from 'react-icons/ri'
import { allowedModes } from './rules'
import { isMobile } from './functions/webUtils/isMobile'
import classes from './App.module.css'
import './App.css'

const ignoreMobile = localStorage.getItem('ignoreMobile')

function App() {
  // settings
  const settings = useContext(SettingsContext)
  // theme
  const theme = useContext(ThemeContext)
  // color scheme
  const colorScheme = useContext(ColorSchemeContext)

  const enableSwipe    = settings.appearance?.gestures?.enableSwipe    ?? true
  const enableTrackpad = settings.appearance?.gestures?.enableTrackpad ?? true

  /* store */
  const mode = useStateSelector(state => state.mode)
  const query = useStateSelector(state => state.query)
  const redirected = useStateSelector(state => state.redirected)
  const timestamp = useStateSelector(state => state.timestamp)
  const updateStore = useUpdate()
  const resetStore = useReset()
  // ---

  const [showSettings, setShowSettings] = useState(false)
  const [showCheatsheet, setShowCheatsheet] = useState(false)

  /* handlers */
  const onContextMenuRef = useRef(null)
  const onKeyDownRef = useRef(null)
  const onKeyUpRef = useRef(null)
  const shiftDownAtRef = useRef(0)
  const shiftAloneRef = useRef(false)
  // Live mirror of `mode` so handlers can read it synchronously without
  // recreating the listener on every transition.
  const modeRef = useRef(mode)
  useEffect(() => { modeRef.current = mode }, [mode])
  // Live mirror of macroFilter for the same reason — Esc-while-typing
  // needs to look at the current buffer length without re-binding the
  // global keydown listener on every keystroke.
  const macroFilter = useStateSelector(state => state.macroFilter)
  const macroFilterRef = useRef(macroFilter)
  useEffect(() => { macroFilterRef.current = macroFilter }, [macroFilter])

  // Phase 8a: macro mode is a pure toggle.
  //  - default → opened: open the menu.
  //  - opened  → default: just transition mode. Using `updateStore` here
  //    (rather than `resetStore`) preserves `timestamp`, so the
  //    AnimatePresence-keyed container does NOT unmount/remount and
  //    the Chevron plays its proper close animation in reverse instead
  //    of cross-fading. The reducer auto-clears `macroFilter` on any
  //    leave-opened transition, so the end state matches a full reset.
  //  - anything else → resetStore: catches edge cases like Shift while
  //    `searching` where we genuinely want query/selection cleared.
  //
  // Phase 8b: `viaKeyboard` propagates the input modality of the open
  // gesture into the store. The Shift handler passes true; right-click
  // and the side button pass false. MacrosMenu uses this to decide
  // whether to reveal the per-card key hints — they only help if the
  // user is about to keyboard-navigate.
  function switchMacrosMenu(viaKeyboard = false) {
    const liveMode = modeRef.current
    if (liveMode === 'default') {
      modeRef.current = 'opened'
      updateStore({ mode: 'opened', macroHintsKeyboard: viaKeyboard })
    } else if (liveMode === 'opened') {
      modeRef.current = 'default'
      updateStore({ mode: 'default' })
    } else {
      modeRef.current = 'default'
      resetStore()
    }
  }

  onKeyDownRef.current = e => {
    // Never intercept keys while Settings or any [data-keep-focus] panel
    // owns the keyboard. Without this guard, Shift inside the Settings
    // password/text fields would toggle the macro menu.
    const ae = document.activeElement
    if (ae && ae.closest && ae.closest('[data-keep-focus]')) return

    // Shift tap-only: record the press, but don't toggle yet. The toggle
    // fires on keyup only if no other key was pressed in between (see
    // onKeyUpRef below). This prevents Shift-as-modifier (Ctrl+Shift+V,
    // Shift+Tab, etc.) from accidentally toggling the macros menu.
    if (e.key === 'Shift' && !e.repeat) {
      shiftDownAtRef.current = Date.now()
      shiftAloneRef.current = true
    } else {
      // Any non-Shift key invalidates the "tap alone" flag.
      shiftAloneRef.current = false
    }

    // Esc in macro mode: pop a char if the filter has content, else
    // close the menu. Owned here (not in `useMacroFilter`) so the
    // close path lives next to the other close paths. Going via
    // `updateStore({ mode: 'default' })` (not `resetStore`) preserves
    // `timestamp` so the Chevron plays its close animation properly.
    if (e.key === 'Escape' && modeRef.current === 'opened') {
      if (macroFilterRef.current.length > 0) {
        e.preventDefault()
        updateStore({ macroFilter: macroFilterRef.current.slice(0, -1) })
      } else {
        e.preventDefault()
        updateStore({ mode: 'default' })
      }
    }

    // '?' (Shift+/) opens the cheatsheet. Because QueryField always
    // grabs focus, restricting on `tagName === INPUT` would mean the
    // shortcut is unreachable. Instead, only fire when the query field
    // is empty (no in-progress search) AND the active element isn't
    // some other editor (Settings inputs, contenteditable, etc).
    if (e.key === '?' && !showCheatsheet) {
      const ae = document.activeElement
      const inOtherEditor = ae && ae !== document.body && (
        (ae.tagName === 'INPUT' && ae.type !== 'text' /* combobox is text */) ||
        ae.tagName === 'TEXTAREA' ||
        ae.isContentEditable ||
        (ae.closest && ae.closest('[data-keep-focus]'))
      )
      const isInQueryField = ae && ae.getAttribute && ae.getAttribute('role') === 'combobox'
      const queryEmpty = !query
      if (!inOtherEditor && (queryEmpty || !isInQueryField)) {
        e.preventDefault()
        setShowCheatsheet(true)
      }
    }
  }
  // Shift tap-only: fire the toggle on keyup only if Shift was the sole
  // key pressed and released within 400ms. This is the pattern used by
  // VS Code, Spotlight, etc. to distinguish tap from modifier use.
  const SHIFT_TAP_MAX_MS = 400
  onKeyUpRef.current = e => {
    if (e.key !== 'Shift') return
    const ae = document.activeElement
    if (ae && ae.closest && ae.closest('[data-keep-focus]')) return

    if (shiftAloneRef.current && (Date.now() - shiftDownAtRef.current < SHIFT_TAP_MAX_MS)) {
      const liveMode = modeRef.current
      if (allowedModes.get('Chevron').has(liveMode)) {
        switchMacrosMenu(true)
      }
    }
    shiftAloneRef.current = false
  }

  // Phase 8a: right-click mirrors the Shift toggle so the keyboard and
  // mouse paths stay in sync (and the close animation plays correctly
  // when going opened → default).
  onContextMenuRef.current = e => {
    switchMacrosMenu()
    e.preventDefault()
  }
  // ---

  // Phase 8a: route printable keystrokes into store.macroFilter while
  // mode === 'opened'. Mounted at the App level so the listener is
  // active even when the lazy-loaded MacrosMenu hasn't rendered yet
  // (matters during the open transition).
  useMacroFilter()

  // Phase 8e: touch swipe gestures.
  // Left/right are intentionally omitted — Splide handles in-menu
  // horizontal swipes natively and we don't want to double-fire.
  useGestures({
    onSwipeUp:   enableSwipe
      ? () => { if (modeRef.current === 'default') switchMacrosMenuRef.current(false) }
      : undefined,
    onSwipeDown: enableSwipe
      ? () => { if (modeRef.current !== 'default') updateStore({ mode: 'default' }) }
      : undefined,
  })

  // adding event listeners
  useEffect(() => {
    const onContextMenu = e => onContextMenuRef.current(e)
    const onKeyDown = e => onKeyDownRef.current(e)
    const onKeyUp = e => onKeyUpRef.current(e)

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('contextmenu', onContextMenu)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('contextmenu', onContextMenu)
    }
  }, [])

  // Vertical wheel/trackpad gesture to open (scroll up) or close (scroll
  // down) the macro menu. Weighted: accumulates deltaY until a threshold
  // is met, preventing accidental triggers from small scroll twitches.
  // A cooldown prevents rapid toggling after a successful gesture.
  const wheelAccRef = useRef({ y: 0, lastAction: 0, timer: null })
  const switchMacrosMenuRef = useRef(null)
  switchMacrosMenuRef.current = switchMacrosMenu
  useEffect(() => {
    const OPEN_THRESHOLD  = 120   // scroll UP  (negative deltaY) → open
    const CLOSE_THRESHOLD = 120   // scroll DOWN (positive deltaY) → close
    const COOLDOWN_MS     = 900   // ms before another gesture is accepted
    const DECAY_MS        = 450   // ms of no scroll before accumulator resets

    const onWheel = (e) => {
      // Respect the enableTrackpad setting.
      if (!enableTrackpad) return
      // Skip when a [data-keep-focus] panel (Settings, Cheatsheet, Weather
      // modal, etc.) owns the pointer.
      const ae = document.activeElement
      if (ae?.closest?.('[data-keep-focus]')) return
      // Skip if the scroll is primarily horizontal (handled by MacrosMenu).
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return

      const acc = wheelAccRef.current
      clearTimeout(acc.timer)
      acc.y += e.deltaY

      const now    = Date.now()
      const onCooldown = now - acc.lastAction < COOLDOWN_MS

      if (!onCooldown) {
        if (acc.y < -OPEN_THRESHOLD && modeRef.current === 'default') {
          switchMacrosMenuRef.current(false)
          acc.y = 0
          acc.lastAction = now
        } else if (acc.y > CLOSE_THRESHOLD && modeRef.current === 'opened') {
          updateStore({ mode: 'default' })
          acc.y = 0
          acc.lastAction = now
        }
      }

      acc.timer = setTimeout(() => { acc.y = 0 }, DECAY_MS)
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      clearTimeout(wheelAccRef.current.timer)
    }
  }, [updateStore, enableTrackpad]) // updateStore is stable; enableTrackpad gates the handler
  useEffect(() => {
    document.title = settings.general.tabTitle
  }, [settings.general.tabTitle]) 
  // ---

  /* setting theme variables */
  useEffect(() => {
    const root = document.documentElement
    for (const variable in theme)
      root.style.setProperty('--' + variable, theme[variable])
  }, [theme]) 
  // ---

  /* setting color scheme variables */
  useEffect(() => {
    document.body.setAttribute('data-color-scheme', colorScheme)
  }, [colorScheme]) 
  // ---

  /* performance mode — disables backdrop-filter blurs on slow platforms */
  useEffect(() => {
    if (settings.appearance.performanceMode) {
      document.body.setAttribute('data-performance-mode', '')
    } else {
      document.body.removeAttribute('data-performance-mode')
    }
  }, [settings.appearance.performanceMode])
  // ---

  /* return-to-blank after navigating away (back button, bfcache, tab refocus)
     Replaces the old "Cancel" button flow: now we just auto-reset the store
     so the startpage is blank when the user returns. */
  const onReturnRef = useRef(null)
  onReturnRef.current = () => {
    if (redirected) resetStore()
  }
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') onReturnRef.current()
    }
    // pageshow fires for bfcache restores (Firefox/Safari back-button)
    const handlePageShow = (e) => {
      if (e.persisted) onReturnRef.current()
    }
    // popstate covers explicit history navigation within this origin
    const handlePopState = () => onReturnRef.current()

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('popstate', handlePopState)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])
  // ---

  return (
    <div className='app'>
      {
        !isMobile || ignoreMobile
          ? <>
              <AnimatePresence>
                <motion.div
                  key={timestamp}
                  className={classes['container']}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={redirected || { opacity: 0 }}>
                    <ActiveElements/>
                    <QueryField/>
                    <LayoutButton
                      id='settings'
                      style={{ right: 0, top: 0 }}
                      onClick={() => setShowSettings(state => !state)}
                      aria-label='Open settings'>
                        <BsGearFill/>
                    </LayoutButton>
                    <LayoutButton
                      id='cheatsheet'
                      style={{ left: 0, top: 0 }}
                      onClick={() => setShowCheatsheet(true)}
                      aria-label='Keyboard shortcuts'>
                        <BsQuestionLg/>
                    </LayoutButton>
                    <LayoutButton
                      id='macros-menu'
                      style={{ right: 0, bottom: 0 }}
                      onClick={() => switchMacrosMenu(false)}
                      aria-label='Toggle macros menu'>
                        {
                          mode === 'default' && <RiMenu5Fill/>
                        }
                        {
                          mode === 'opened' && <BsChevronRight/>
                        }
                    </LayoutButton>
                </motion.div>
              </AnimatePresence>
              {showSettings && (
                <Suspense fallback={null}>
                  <Settings onClose={() => setShowSettings(false)} />
                </Suspense>
              )}
            </>
          : <div className={classes['mobile-warning']}>
              <div>
                Mobile devices are not supported :( <br />
                <button
                type='button'
                className={classes['ignore-mobile-button']}
                onClick={() => {
                  localStorage.setItem('ignoreMobile', true)
                  location.reload()
                }}>
                  ignore this warning
                </button>
              </div>
            </div>
      }
      <Suspense fallback={null}>
        <Cheatsheet open={showCheatsheet} onClose={() => setShowCheatsheet(false)} />
      </Suspense>
      <OfflineIndicator />
    </div>
  )
}

export default App
