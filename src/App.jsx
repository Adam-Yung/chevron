import { lazy, Suspense, useContext, useEffect, useRef, useState } from 'react'
import { ColorSchemeContext, SettingsContext, ThemeContext } from './contexts/Settings'
import { useReset, useStateSelector, useUpdate } from './contexts/Store'
import { AnimatePresence, motion} from 'framer-motion'
import ActiveElements from './components/ActiveElements/ActiveElements'
import QueryField from './components/QueryField/QueryField'
import LayoutButton from './components/LayoutButton/LayoutButton'

// The Settings panel pulls in MUI Joy + the color picker + every setting
// type editor; defer the chunk until the user actually opens settings.
const Settings = lazy(() => import('./components/Settings/Settings'))
// Cheatsheet is small but never needed on first paint, so lazy-load it too.
const Cheatsheet = lazy(() => import('./components/Cheatsheet/Cheatsheet'))
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
  const onKeyUpRef = useRef(null)
  const onKeyDownRef = useRef(null)

  function switchMacrosMenu() {
    if (mode === 'default')
      updateStore({ mode: 'opened' })
    else if (mode === 'opened')
      updateStore({ mode: 'default' })
  }

  onKeyUpRef.current = e => {
    if (e.key === 'Shift')
      if (allowedModes.get('Chevron').has(mode))
        if (mode === 'opened')
          updateStore({ mode: 'default' })
  }
  onKeyDownRef.current = e => {
    if (e.key === 'Shift')
        if (allowedModes.get('Chevron').has(mode))
          if (mode === 'default')
            updateStore({ mode: 'opened' })

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
  onContextMenuRef.current = e => {
    switchMacrosMenu()
    e.preventDefault()
  }
  // ---

  // adding event listeners
  useEffect(() => {
    const onContextMenu = e => onContextMenuRef.current(e)
    const onKeyUp = e => onKeyUpRef.current(e)
    const onKeyDown = e => onKeyDownRef.current(e)

    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('contextmenu', onContextMenu)
    return () => {
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('contextmenu', onContextMenu)
    }
  }, [])

  /* setting document title */
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
          ? <AnimatePresence>
              {
                showSettings
                  ? <Suspense key='settings' fallback={null}>
                      <Settings onClose={() => {
                        setShowSettings(false)
                        resetStore()}}/>
                    </Suspense>
                  : 
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
                        onClick={() => setShowSettings(state => !state)}>
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
                        onClick={switchMacrosMenu}>
                          {
                            mode === 'default' && <RiMenu5Fill/>
                          }
                          {
                            mode === 'opened' && <BsChevronRight/>
                          }
                      </LayoutButton>
                  </motion.div>
              }
            </AnimatePresence>
          : <div className={classes['mobile-warning']}>
              <div>
                Mobile devices are not supported :( <br />
                <span className={classes['ignore-mobile-button']}
                onClick={() => {
                  localStorage.setItem('ignoreMobile', true)
                  location.reload()
                }}>
                  ignore this warning
                </span>
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
