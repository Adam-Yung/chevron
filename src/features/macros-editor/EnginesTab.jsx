import { memo, useState } from 'react'
import classes from './MacrosEditor.module.css'
import { makeSolid } from './colorHelpers'
import EngineRow from './EngineRow'
import { removeKey, renameKey, replaceValue, uniqueKey } from './recordOps'

function newEngine() {
  return {
    name: 'New engine',
    bgColor: makeSolid('#888888'),
    textColor: '#ffffff',
    types: { query: { template: 'https://example.com/?q={$}' } }
  }
}

function renameEngine({ engines, onChange, setOpenId }, oldId, newId) {
  onChange(renameKey(engines, oldId, newId))
  setOpenId(open => (open === oldId ? newId : open))
}

function removeEngine({ engines, onChange, setOpenId }, id) {
  onChange(removeKey(engines, id))
  setOpenId(open => (open === id ? null : open))
}

function addEngine({ engines, onChange, setOpenId }) {
  const id = uniqueKey(engines, 'newEngine')
  onChange({ ...engines, [id]: newEngine() })
  setOpenId(id)
}

// The engines map `{ [id]: { name, bgColor, textColor, types: { [type]: { template } } } }`.
function EnginesTab({ engines, onChange }) {
  const [openId, setOpenId] = useState(null)
  const ids = Object.keys(engines)

  const map = { engines, onChange, setOpenId }

  return (
    <div>
      <p className={classes['hint']}>
        Engines define the URL templates used to send a query to a search engine. <code>{'{@}'}</code> is the raw query
        (what the user typed), <code>{'{$}'}</code> is the parsed query.
      </p>
      {ids.length === 0 && <div className={classes['empty']}>No engines defined.</div>}
      {ids.map(id => (
        <EngineRow
          key={id}
          id={id}
          engine={engines[id]}
          isTaken={key => key in engines}
          isOpen={openId === id}
          onToggle={() => setOpenId(open => (open === id ? null : id))}
          onUpdate={next => onChange(replaceValue(engines, id, next))}
          onRename={next => renameEngine(map, id, next)}
          onRemove={() => removeEngine(map, id)}
        />
      ))}
      <button type="button" className={classes['addBtn']} onClick={() => addEngine(map)}>+ Add engine</button>
    </div>
  )
}

export default memo(EnginesTab)
