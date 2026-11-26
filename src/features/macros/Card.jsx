import { memo, useMemo } from 'react'
import { feltColor } from '../../lib/getCssGradient'
import MacroIcon from './MacroIcon'
import { keyLabel } from './filterMacros'
import classes from './Card.module.css'

function Name({ name, filter }) {
  const at = filter ? name.toLowerCase().indexOf(filter) : -1
  if (at < 0) return name
  return <>{name.slice(0, at)}<mark>{name.slice(at, at + filter.length)}</mark>{name.slice(at + filter.length)}</>
}

/** One site in the menu. `hint` shows its Shift+letter key; `focused` is the keyboard cursor. */
function Card({ macro, filter, hint, focused, onOpen }) {
  const felt = useMemo(() => feltColor(macro.bgColor), [macro.bgColor])
  const key = hint ? keyLabel(macro.key) : ''
  return (
    <button type='button' className={classes.card} data-macro={macro.name} data-focused={focused || undefined}
      title={macro.name} onClick={e => onOpen(macro, e.metaKey || e.ctrlKey)}
      onAuxClick={e => { if (e.button === 1) onOpen(macro, true) }}
      style={{ '--felt': felt }}>
      <span className={`felt ${classes.plate}`}>
        <MacroIcon icon={macro.icon} color='currentColor' className={classes.logo} />
        {key && <kbd className={classes.key} aria-label={`Shift ${key}`}>{key}</kbd>}
      </span>
      <span className={classes.name}><Name name={macro.name} filter={filter} /></span>
    </button>
  )
}

export default memo(Card)
