import classes from './MacrosEditor.module.css'
import { TextField, KeyField } from './Fields'
import ColorPicker from './ColorPicker/ColorPicker'
import BgColorEditor from './BgColorEditor'
import RowHeader from './RowHeader'
import { patchValue, removeKey, renameKey, uniqueKey } from './recordOps'

const NEW_TYPE = { template: 'https://example.com/?q={$}' }

function QueryTypes({ types, onChange }) {
  return (
    <div className={classes['commandsList']}>
      {Object.entries(types).map(([type, body]) => (
        <div key={type} className={classes['typeRow']}>
          <KeyField label="Type" value={type} isTaken={key => key in types} onCommit={next => onChange(renameKey(types, type, next))} />
          <TextField label="Template" monospace value={body?.template} placeholder="https://...?q={$}" onChange={template => onChange(patchValue(types, type, { template }))} />
          <button type="button" className={classes['iconBtn']} aria-label={`Remove query type ${type}`} onClick={() => onChange(removeKey(types, type))}>×</button>
        </div>
      ))}
      <button type="button" className={classes['addBtn']} onClick={() => onChange({ ...types, [uniqueKey(types, 'newType')]: { ...NEW_TYPE } })}>+ Add query type</button>
    </div>
  )
}

// The id is the key other code looks engines up by, hence KeyField and onRename.
export default function EngineRow({ id, engine, isTaken, isOpen, onToggle, onUpdate, onRename, onRemove }) {
  const types = engine.types && typeof engine.types === 'object' ? engine.types : {}
  return (
    <div className={classes['row']}>
      <RowHeader bgColor={engine.bgColor} title={engine.name || id} detail={`· ${id}`} isOpen={isOpen} onToggle={onToggle}>
        <button type="button" className={classes['iconBtn']} onClick={onRemove} aria-label="Delete engine" title="Delete engine">🗑</button>
      </RowHeader>
      {isOpen && (
        <>
          <div className={classes['grid']}>
            <TextField label="Name" value={engine.name} onChange={v => onUpdate({ ...engine, name: v })} />
            <KeyField label="Engine id (key)" value={id} isTaken={isTaken} onCommit={onRename} />
            <ColorPicker label="Text color" value={engine.textColor} onChange={v => onUpdate({ ...engine, textColor: v })} />
          </div>
          <p className={classes['subhead']}>Background</p>
          <BgColorEditor value={engine.bgColor} onChange={v => onUpdate({ ...engine, bgColor: v })} />
          <p className={classes['subhead']}>Query types</p>
          <QueryTypes types={types} onChange={next => onUpdate({ ...engine, types: next })} />
        </>
      )}
    </div>
  )
}
