import { memo, useState } from 'react'
import classes from './MacrosEditor.module.css'
import { makeSolid } from './colorHelpers'
import MacroRow from './MacroRow'
import { patchAt, removeAt, swapAt } from './listOps'

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

function removeMacro({ macros, onChange, setOpenIdx }, idx) {
  onChange(removeAt(macros, idx))
  setOpenIdx(open => openAfterRemove(open, idx))
}

function moveMacro({ macros, onChange, setOpenIdx }, idx, delta) {
  const target = idx + delta
  if (target < 0 || target >= macros.length) return
  onChange(swapAt(macros, idx, target))
  setOpenIdx(open => openAfterMove(open, idx, target))
}

function addMacro({ macros, onChange, setOpenIdx }) {
  onChange([...macros, emptyMacro()])
  setOpenIdx(macros.length)
}

// Macros have no stable id and names repeat, so rows are keyed and tracked by index.
function MacrosTab({ macros, onChange }) {
  const [openIdx, setOpenIdx] = useState(null)

  const list = { macros, onChange, setOpenIdx }

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
          onSetField={(key, value) => onChange(patchAt(macros, i, { [key]: value }))}
          onRemove={() => removeMacro(list, i)}
          onMove={delta => moveMacro(list, i, delta)}
        />
      ))}
      <button type="button" className={classes['addBtn']} onClick={() => addMacro(list)}>+ Add macro</button>
    </div>
  )
}

export default memo(MacrosTab)
