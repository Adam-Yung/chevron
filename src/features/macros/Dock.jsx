import { memo, useContext } from 'react'
import { SettingsContext } from '../../settings/SettingsProvider'
import { useUi } from '../../state/UiStore'
import { usePinnedMacros } from '../../search/useConfig'
import getCssGradient from '../../lib/getCssGradient'
import MacroIcon from './MacroIcon'
import classes from './Dock.module.css'

const MAX_ITEMS = 10

/** Pinned sites along the bottom of the idle screen: one click away without opening the menu. Hidden in every other view. */
function Dock({ onOpenMacro }) {
  const settings = useContext(SettingsContext)
  const view = useUi(s => s.view)
  const pinned = usePinnedMacros()
  if (settings.appearance.dock === false || !pinned.length) return null
  const shown = view === 'idle'
  return (
    <nav className={classes.dock} aria-label='Pinned sites' data-shown={shown || undefined} inert={shown ? undefined : ''}>
      {pinned.slice(0, MAX_ITEMS).map(macro => (
        <button key={macro.name} type='button' className={classes.item} title={macro.name} aria-label={macro.name}
          data-macro={macro.name} style={{ '--plate': getCssGradient(macro.bgColor) }}
          onClick={e => onOpenMacro(macro, e.metaKey || e.ctrlKey)}
          onAuxClick={e => { if (e.button === 1) onOpenMacro(macro, true) }}>
          <MacroIcon icon={macro.icon} color={macro.textColor} className={classes.icon} />
        </button>
      ))}
    </nav>
  )
}

export default memo(Dock)
