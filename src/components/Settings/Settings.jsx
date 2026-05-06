import { useContext, useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { SettingsContext, SetSettingsContext } from '../../contexts/Settings'
import { CssVarsProvider } from '@mui/joy'
import { FiX, FiEye, FiEyeOff, FiSettings, FiLayout, FiZap, FiSearch, FiGrid, FiCommand, FiRotateCcw, FiTrash2 } from 'react-icons/fi'
import Category from './Category/Category'
import MacrosEditorBody from '../MacrosEditor/MacrosEditorBody'
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
  macros: FiCommand
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

          <CssVarsProvider>
            <main className={classes['pane']} role="tabpanel">
              {renderPane()}
            </main>
          </CssVarsProvider>
        </div>
      </div>
    </div>
  )
}

export default Settings
