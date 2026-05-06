import { memo, useCallback, useMemo, useState } from 'react'
import classes from './MacrosEditor.module.css'
import { TextField, ChipInput, ColorField, CheckboxField } from './Fields'
import BgColorEditor from './BgColorEditor'
import { bgPreviewCss, makeSolid } from './colorHelpers'

/**
 * Per-macro form list. Each macro renders as an expandable row showing
 * a one-line summary; click to expand the full editor for that row.
 * This keeps the list scannable when there are 30+ macros.
 */

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

function MacrosTab({ macros, iconNames, onChange }) {
  const [openIdx, setOpenIdx] = useState(null)

  const update = useCallback((idx, next) => {
    const arr = [...macros]
    arr[idx] = next
    onChange(arr)
  }, [macros, onChange])

  const updateField = useCallback((idx, key, value) => {
    const arr = [...macros]
    arr[idx] = { ...arr[idx], [key]: value }
    onChange(arr)
  }, [macros, onChange])

  const remove = useCallback((idx) => {
    onChange(macros.filter((_, i) => i !== idx))
    setOpenIdx((cur) => (cur === idx ? null : cur != null && cur > idx ? cur - 1 : cur))
  }, [macros, onChange])

  const move = useCallback((idx, delta) => {
    const next = idx + delta
    if (next < 0 || next >= macros.length) return
    const arr = [...macros]
    ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
    onChange(arr)
    setOpenIdx((cur) => (cur === idx ? next : cur === next ? idx : cur))
  }, [macros, onChange])

  const add = useCallback(() => {
    onChange([...macros, emptyMacro()])
    setOpenIdx(macros.length)
  }, [macros, onChange])

  if (!Array.isArray(macros) || macros.length === 0) {
    return (
      <div>
        <div className={classes['empty']}>No macros yet.</div>
        <button type="button" className={classes['addBtn']} onClick={add}>+ Add macro</button>
      </div>
    )
  }

  return (
    <div>
      {macros.map((m, i) => (
        <MacroRow
          key={i}
          index={i}
          macro={m}
          isOpen={openIdx === i}
          isFirst={i === 0}
          isLast={i === macros.length - 1}
          iconNames={iconNames}
          onToggle={() => setOpenIdx((cur) => (cur === i ? null : i))}
          onUpdate={(next) => update(i, next)}
          onUpdateField={(key, value) => updateField(i, key, value)}
          onRemove={() => remove(i)}
          onMoveUp={() => move(i, -1)}
          onMoveDown={() => move(i, 1)}
        />
      ))}
      <button type="button" className={classes['addBtn']} onClick={add}>+ Add macro</button>
    </div>
  )
}

const MacroRow = memo(function MacroRow({
  index, macro, isOpen, isFirst, isLast, iconNames,
  onToggle, onUpdate, onUpdateField, onRemove, onMoveUp, onMoveDown
}) {
  const swatchStyle = useMemo(() => ({ background: bgPreviewCss(macro.bgColor) }), [macro.bgColor])

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
          {macro.name || `(macro #${index + 1})`}
          <span style={{ opacity: 0.5, fontWeight: 400, fontSize: '0.85em' }}>
            {macro.triggers?.length ? ` — ${macro.triggers.join(', ')}` : ''}
          </span>
          <span style={{ marginLeft: 'auto', opacity: 0.5 }}>{isOpen ? '▾' : '▸'}</span>
        </button>
        <span className={classes['rowActions']}>
          <button type="button" className={classes['iconBtn']} disabled={isFirst} onClick={onMoveUp} aria-label="Move up">↑</button>
          <button type="button" className={classes['iconBtn']} disabled={isLast} onClick={onMoveDown} aria-label="Move down">↓</button>
          <button type="button" className={classes['iconBtn']} onClick={onRemove} aria-label="Delete macro" title="Delete macro">🗑</button>
        </span>
      </div>

      {isOpen && (
        <>
          <div className={classes['grid']}>
            <TextField label="Name" value={macro.name} onChange={(v) => onUpdateField('name', v)} />
            <TextField label="Category" value={macro.category} onChange={(v) => onUpdateField('category', v)} />
            <TextField label="URL" value={macro.url} onChange={(v) => onUpdateField('url', v)} />
            <TextField label="Normalised URL (host)" value={macro.normalisedURL} placeholder="example.com" onChange={(v) => onUpdateField('normalisedURL', v)} />
            <TextField label="Hotkey (e.g. KeyG)" value={macro.key} placeholder="optional" onChange={(v) => onUpdateField('key', v || undefined)} />
            <IconField value={macro.icon} options={iconNames} onChange={(v) => onUpdateField('icon', v || undefined)} />
            <ColorField label="Text color" value={macro.textColor} onChange={(v) => onUpdateField('textColor', v)} />
            <CheckboxFieldWrapped label="Pinned to macros menu" checked={macro.pinned} onChange={(v) => onUpdateField('pinned', v)} />
          </div>

          <ChipInput
            label="Triggers (Enter, Tab, or comma to add)"
            values={macro.triggers}
            placeholder="e.g. g, gh, github"
            onChange={(v) => onUpdateField('triggers', v)}
          />

          <p className={classes['subhead']}>Background</p>
          <BgColorEditor value={macro.bgColor} onChange={(v) => onUpdateField('bgColor', v)} />

          <p className={classes['subhead']}>Commands</p>
          <CommandsBlock
            commands={macro.commands}
            onChange={(v) => onUpdateField('commands', v)}
          />
        </>
      )}
    </div>
  )
})

function CheckboxFieldWrapped({ label, checked, onChange }) {
  // Wrap in field column so it lines up with the grid.
  return (
    <div className={classes['field']}>
      <label>&nbsp;</label>
      <CheckboxField label={label} checked={checked} onChange={onChange} />
    </div>
  )
}

const IconField = memo(function IconField({ value, options, onChange }) {
  return (
    <div className={classes['field']}>
      <label>Icon name</label>
      <input
        type="text"
        value={value ?? ''}
        list="chevron-icon-names"
        placeholder="optional"
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id="chevron-icon-names">
        {options.map(name => <option key={name} value={name} />)}
      </datalist>
    </div>
  )
})

const CommandsBlock = memo(function CommandsBlock({ commands, onChange }) {
  const entries = commands && typeof commands === 'object' ? Object.entries(commands) : []

  const setEntry = (idx, type, val) => {
    const next = [...entries]
    next[idx] = [type, val]
    // Detect duplicate types: keep the first one only.
    const seen = new Set()
    const cleaned = {}
    for (const [k, v] of next) {
      if (!k || seen.has(k)) continue
      seen.add(k)
      cleaned[k] = v
    }
    onChange(cleaned)
  }

  const remove = (idx) => {
    const next = entries.filter((_, i) => i !== idx)
    onChange(Object.fromEntries(next))
  }

  const add = () => {
    const baseKey = 'newCommand'
    let key = baseKey
    let n = 1
    while (commands && key in commands) { key = baseKey + n; n++ }
    onChange({ ...(commands || {}), [key]: { template: '{@}/{$}', description: '' } })
  }

  if (entries.length === 0) {
    return (
      <div>
        <div className={classes['empty']} style={{ padding: '12px 0' }}>No commands.</div>
        <button type="button" className={classes['addBtn']} onClick={add}>+ Add command</button>
      </div>
    )
  }

  return (
    <div className={classes['commandsList']}>
      {entries.map(([type, body], i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 28px', gap: 6, alignItems: 'end' }}>
          <TextField label="Type" value={type} onChange={(v) => setEntry(i, v, body)} />
          <TextField label="Template" monospace value={body?.template} placeholder="{@}/{$}" onChange={(v) => setEntry(i, type, { ...(body || {}), template: v })} />
          <TextField label="Description" value={body?.description} onChange={(v) => setEntry(i, type, { ...(body || {}), description: v })} />
          <button type="button" className={classes['iconBtn']} aria-label="Remove command" onClick={() => remove(i)} style={{ marginBottom: 1 }}>×</button>
        </div>
      ))}
      <button type="button" className={classes['addBtn']} onClick={add}>+ Add command</button>
    </div>
  )
})

export default memo(MacrosTab)
