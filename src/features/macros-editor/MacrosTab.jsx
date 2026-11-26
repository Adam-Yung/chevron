import { memo, useState } from 'react'
import classes from './MacrosEditor.module.css'
import { makeSolid } from './colorHelpers'
import MacroRow from './MacroRow'

function emptyMacro() {
  return {
    name: 'New macro',
    category: '',
    triggers: [],
    url: 'https://example.com',
    normalisedURL: 'example.com',
    bgColor: makeSolid('#888888'),
    textColor: '#ffffff',
    pinned: false
  }
}

// Which row stays open after a reorder or delete, so the row being edited does not collapse under the cursor.
function openAfterMove(open, from, to) {
  if (open === from) return to
  return open === to ? from : open
}

function openAfterRemove(open, removed) {
  if (open === removed) return null
  return open !== null && open > removed ? open - 1 : open
}

/**
 * One expandable row per macro, so a list of 30+ macros stays scannable. Rows are keyed by index: macros have no stable id
 * and names may repeat, so the open row is tracked by index and adjusted on move and delete.
 */
function MacrosTab({ macros, onChange }) {
  const [openIdx, setOpenIdx] = useState(null)

  const setField = (idx, key, value) => onChange(macros.map((m, i) => (i === idx ? { ...m, [key]: value } : m)))

  const remove = idx => {
    onChange(macros.filter((_, i) => i !== idx))
    setOpenIdx(open => openAfterRemove(open, idx))
  }

  const move = (idx, delta) => {
    const target = idx + delta
    if (target < 0 || target >= macros.length) return
    const next = [...macros]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
    setOpenIdx(open => openAfterMove(open, idx, target))
  }

  const add = () => {
    onChange([...macros, emptyMacro()])
    setOpenIdx(macros.length)
  }

  return (
    <div>
      {macros.length === 0 && <div className={classes['empty']}>No macros yet.</div>}
      {macros.map((macro, i) => (
        <MacroRow
          key={i}
          index={i}
          macro={macro}
          isOpen={openIdx === i}
          isFirst={i === 0}
          isLast={i === macros.length - 1}
          onToggle={() => setOpenIdx(open => (open === i ? null : i))}
          onSetField={(key, value) => setField(i, key, value)}
          onRemove={() => remove(i)}
          onMove={delta => move(i, delta)}
        />
      ))}
      <button type="button" className={classes['addBtn']} onClick={add}>+ Add macro</button>
    </div>
  )
}

export default memo(MacrosTab)
