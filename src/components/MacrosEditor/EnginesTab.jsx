import { memo, useCallback, useMemo, useState } from 'react'
import classes from './MacrosEditor.module.css'
import { TextField } from './Fields'
import ColorPicker from './ColorPicker/ColorPicker'
import BgColorEditor from './BgColorEditor'
import { bgPreviewCss, makeSolid } from './colorHelpers'

/**
 * Editor for the search-engines map. The shape is
 * `{ [id]: { name, bgColor, textColor, types: { [t]: { template } } } }`.
 *
 * Engine ids are object keys (used by the rest of the app), so renaming
 * an engine is a key-rename. We perform that defensively to preserve
 * insertion order.
 */
function EnginesTab({ engines, onChange }) {
  const ids = useMemo(() => engines && typeof engines === 'object' ? Object.keys(engines) : [], [engines])
  const [openId, setOpenId] = useState(null)

  const updateEngine = useCallback((id, next) => {
    if (!engines) return
    const out = {}
    for (const k of Object.keys(engines)) {
      out[k] = k === id ? next : engines[k]
    }
    onChange(out)
  }, [engines, onChange])

  const renameEngine = useCallback((oldId, newId) => {
    if (!newId || newId === oldId) return
    if (!engines || newId in engines) return
    const out = {}
    for (const k of Object.keys(engines)) {
      out[k === oldId ? newId : k] = engines[k]
    }
    onChange(out)
    setOpenId((cur) => (cur === oldId ? newId : cur))
  }, [engines, onChange])

  const removeEngine = useCallback((id) => {
    if (!engines) return
    const out = {}
    for (const k of Object.keys(engines)) {
      if (k !== id) out[k] = engines[k]
    }
    onChange(out)
    setOpenId((cur) => (cur === id ? null : cur))
  }, [engines, onChange])

  const addEngine = useCallback(() => {
    let id = 'newEngine'
    let n = 1
    while (engines && id in engines) { id = 'newEngine' + n; n++ }
    onChange({
      ...(engines || {}),
      [id]: {
        name: 'New engine',
        bgColor: makeSolid('#888888'),
        textColor: '#ffffff',
        types: { query: { template: 'https://example.com/?q={$}' } }
      }
    })
    setOpenId(id)
  }, [engines, onChange])

  if (ids.length === 0) {
    return (
      <div>
        <div className={classes['empty']}>No engines defined.</div>
        <button type="button" className={classes['addBtn']} onClick={addEngine}>+ Add engine</button>
      </div>
    )
  }

  return (
    <div>
      <p style={{ opacity: 0.6, fontSize: '0.85em', marginTop: 0 }}>
        Engines define the URL templates used to send a query to a search engine. <code>{'{@}'}</code> is the raw query (what the user typed), <code>{'{$}'}</code> is the parsed query.
      </p>
      {ids.map((id) => (
        <EngineRow
          key={id}
          id={id}
          engine={engines[id]}
          isOpen={openId === id}
          onToggle={() => setOpenId((cur) => (cur === id ? null : id))}
          onUpdate={(next) => updateEngine(id, next)}
          onRename={(next) => renameEngine(id, next)}
          onRemove={() => removeEngine(id)}
        />
      ))}
      <button type="button" className={classes['addBtn']} onClick={addEngine}>+ Add engine</button>
    </div>
  )
}

const EngineRow = memo(function EngineRow({ id, engine, isOpen, onToggle, onUpdate, onRename, onRemove }) {
  const swatchStyle = useMemo(() => ({ background: bgPreviewCss(engine.bgColor) }), [engine.bgColor])
  const types = engine.types && typeof engine.types === 'object' ? engine.types : {}
  const typeEntries = Object.entries(types)

  const updateType = (oldKey, newKey, body) => {
    const out = {}
    const keys = Object.keys(types)
    const seen = new Set()
    for (const k of keys) {
      if (k === oldKey) {
        if (!newKey || seen.has(newKey)) continue
        out[newKey] = body
        seen.add(newKey)
      } else {
        if (seen.has(k)) continue
        out[k] = types[k]
        seen.add(k)
      }
    }
    onUpdate({ ...engine, types: out })
  }

  const removeType = (key) => {
    const out = {}
    for (const k of Object.keys(types)) {
      if (k !== key) out[k] = types[k]
    }
    onUpdate({ ...engine, types: out })
  }

  const addType = () => {
    let key = 'newType'
    let n = 1
    while (key in types) { key = 'newType' + n; n++ }
    onUpdate({ ...engine, types: { ...types, [key]: { template: 'https://example.com/?q={$}' } } })
  }

  return (
    <div className={classes['row']}>
      <div className={classes['rowHeader']}>
        <span className={classes['swatch']} style={swatchStyle} aria-hidden="true" />
        <button
          type="button"
          className={classes['rowTitle']}
          onClick={onToggle}
          aria-expanded={isOpen}
          style={{ background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer', textAlign: 'left' }}
        >
          {engine.name || id}
          <span style={{ opacity: 0.5, fontWeight: 400, fontSize: '0.85em' }}> &middot; {id}</span>
          <span style={{ marginLeft: 'auto', opacity: 0.5 }}>{isOpen ? '▾' : '▸'}</span>
        </button>
        <span className={classes['rowActions']}>
          <button type="button" className={classes['iconBtn']} onClick={onRemove} aria-label="Delete engine" title="Delete engine">🗑</button>
        </span>
      </div>

      {isOpen && (
        <>
          <div className={classes['grid']}>
            <TextField label="Name" value={engine.name} onChange={(v) => onUpdate({ ...engine, name: v })} />
            <TextField label="Engine id (key)" value={id} onChange={(v) => onRename(v)} />
            <ColorPicker label="Text color" value={engine.textColor} onChange={(v) => onUpdate({ ...engine, textColor: v })} />
          </div>

          <p className={classes['subhead']}>Background</p>
          <BgColorEditor value={engine.bgColor} onChange={(v) => onUpdate({ ...engine, bgColor: v })} />

          <p className={classes['subhead']}>Query types</p>
          <div className={classes['commandsList']}>
            {typeEntries.map(([key, body], i) => (
              <div key={`${key}-${i}`} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 28px', gap: 6, alignItems: 'end' }}>
                <TextField label="Type" value={key} onChange={(v) => updateType(key, v, body)} />
                <TextField label="Template" monospace value={body?.template} placeholder="https://...?q={$}" onChange={(v) => updateType(key, key, { ...(body || {}), template: v })} />
                <button type="button" className={classes['iconBtn']} aria-label="Remove type" onClick={() => removeType(key)} style={{ marginBottom: 1 }}>×</button>
              </div>
            ))}
            <button type="button" className={classes['addBtn']} onClick={addType}>+ Add query type</button>
          </div>
        </>
      )}
    </div>
  )
})

export default memo(EnginesTab)
