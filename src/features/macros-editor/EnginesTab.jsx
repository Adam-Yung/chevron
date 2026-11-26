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

/**
 * Editor for the engines map `{ [id]: { name, bgColor, textColor, types: { [type]: { template } } } }`. Ids are object keys
 * used by the rest of the app, so renaming rebuilds the map in place to keep the order.
 */
function EnginesTab({ engines, onChange }) {
  const [openId, setOpenId] = useState(null)
  const ids = Object.keys(engines)

  const rename = (oldId, newId) => {
    onChange(renameKey(engines, oldId, newId))
    setOpenId(open => (open === oldId ? newId : open))
  }

  const remove = id => {
    onChange(removeKey(engines, id))
    setOpenId(open => (open === id ? null : open))
  }

  const add = () => {
    const id = uniqueKey(engines, 'newEngine')
    onChange({ ...engines, [id]: newEngine() })
    setOpenId(id)
  }

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
          onRename={next => rename(id, next)}
          onRemove={() => remove(id)}
        />
      ))}
      <button type="button" className={classes['addBtn']} onClick={add}>+ Add engine</button>
    </div>
  )
}

export default memo(EnginesTab)
