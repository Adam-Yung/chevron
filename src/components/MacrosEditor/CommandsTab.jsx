import { memo, useCallback } from 'react'
import classes from './MacrosEditor.module.css'
import { TextField } from './Fields'

/**
 * Editor for the global commands list. Each command is a `type +
 * trigger` pair (e.g. `{ type: 'search', trigger: '?' }`).
 */
function CommandsTab({ commands, onChange }) {
  const list = Array.isArray(commands) ? commands : []

  const update = useCallback((i, key, value) => {
    const arr = [...list]
    arr[i] = { ...arr[i], [key]: value }
    onChange(arr)
  }, [list, onChange])

  const remove = useCallback((i) => {
    onChange(list.filter((_, idx) => idx !== i))
  }, [list, onChange])

  const add = useCallback(() => {
    onChange([...list, { type: 'newType', trigger: '' }])
  }, [list, onChange])

  if (list.length === 0) {
    return (
      <div>
        <p style={{ opacity: 0.6, fontSize: '0.85em' }}>
          Global commands are matched against macros. Each macro can implement a command (see the macro&apos;s <em>Commands</em> section).
        </p>
        <div className={classes['empty']}>No commands defined.</div>
        <button type="button" className={classes['addBtn']} onClick={add}>+ Add command</button>
      </div>
    )
  }

  return (
    <div>
      <p style={{ opacity: 0.6, fontSize: '0.85em', marginTop: 0 }}>
        Global commands are matched against macros. Each macro can implement a command in its own <em>Commands</em> section.
      </p>
      {list.map((c, i) => (
        <div key={i} className={classes['row']}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 28px', gap: 8, alignItems: 'end' }}>
            <TextField label="Type" value={c.type} placeholder="search" onChange={(v) => update(i, 'type', v)} />
            <TextField label="Trigger" monospace value={c.trigger} placeholder="?" onChange={(v) => update(i, 'trigger', v)} />
            <button type="button" className={classes['iconBtn']} aria-label="Delete command" onClick={() => remove(i)}>🗑</button>
          </div>
        </div>
      ))}
      <button type="button" className={classes['addBtn']} onClick={add}>+ Add command</button>
    </div>
  )
}

export default memo(CommandsTab)
