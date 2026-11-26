import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { SettingsContext, SetSettingsContext } from '../../settings/SettingsProvider'
import settings from '../../settings/schema'
import SettingsSidebar from './SettingsSidebar'
import SettingsPane from './SettingsPane'
import classes from './Settings.module.css'

const NO_HIDDEN = []

// Takes the keyboard on open and gives it back on close. The panel is not a global key listener: Esc is handled on the dialog, and
// [data-keep-focus] on the backdrop tells the input router to leave typing alone while it is open.
function useDialogFocus() {
  const dialogRef = useRef(null)
  useEffect(() => {
    const opener = document.activeElement
    // Only if focus is not already inside: a click or keystroke in the first frame must keep its field.
    const frame = window.requestAnimationFrame(() => {
      if (!dialogRef.current?.contains(document.activeElement)) dialogRef.current?.focus()
    })
    return () => {
      window.cancelAnimationFrame(frame)
      opener?.focus?.()
    }
  }, [])
  return dialogRef
}

// Every schema category becomes a tab; "macros" is synthetic and hosts the macros editor.
function useTabs(showHidden) {
  const tabs = useMemo(() => {
    const hidden = showHidden ? NO_HIDDEN : settings.hidden
    return [...Object.keys(settings.template).filter(key => !hidden.includes(key)), 'macros']
  }, [showHidden])
  const [chosen, setActiveTab] = useState(tabs[0])
  const activeTab = tabs.includes(chosen) ? chosen : tabs[0]
  return { tabs, activeTab, setActiveTab }
}

/**
 * Centred settings dialog: a sidebar of categories, one pane per category, and Reset / Clean history actions. Edits apply live and
 * persist through SettingsProvider, so the X is a plain close with nothing to confirm or discard.
 */
function Settings({ onClose }) {
  const current = useContext(SettingsContext)
  const setCurrent = useContext(SetSettingsContext)
  const dialogRef = useDialogFocus()
  const [showHidden, setShowHidden] = useState(false)
  const { tabs, activeTab, setActiveTab } = useTabs(showHidden)

  const handleKeyDown = useCallback(event => {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    event.preventDefault()
    onClose()
  }, [onClose])

  return (
    <div className={classes['backdrop']} onClick={onClose} data-keep-focus="true">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        tabIndex={-1}
        className={classes['dialog']}
        onClick={event => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={classes['header']}>
          <h2 className={classes['title']}>Settings</h2>
          <button type="button" className={classes['closeButton']} onClick={onClose} aria-label="Close settings" title="Close (Esc)">
            <FiX size="1.25em" />
          </button>
        </div>
        <div className={classes['body']}>
          <SettingsSidebar
            tabs={tabs}
            activeTab={activeTab}
            onSelect={setActiveTab}
            showHidden={showHidden}
            onToggleHidden={() => setShowHidden(shown => !shown)}
          />
          <main className={classes['pane']} role="tabpanel">
            <SettingsPane tab={activeTab} hidden={showHidden ? NO_HIDDEN : settings.hidden} current={current} onChange={setCurrent} />
          </main>
        </div>
      </div>
    </div>
  )
}

export default Settings
