import classes from './MacrosEditor.module.css'
import { TextField, CheckboxField } from './Fields'
import ChipInput from './ChipInput'
import ColorPicker from './ColorPicker/ColorPicker'
import IconPicker from './IconPicker/IconPicker'
import BgColorEditor from './BgColorEditor'
import CommandsBlock from './CommandsBlock'
import RowHeader from './RowHeader'

// An empty hotkey or icon is removed from the saved object rather than stored as "", which the menu would treat as set.
const orUndefined = value => value || undefined

function MacroFields({ macro, set }) {
  return (
    <>
      <div className={classes['grid']}>
        <TextField label="Name" value={macro.name} onChange={v => set('name', v)} />
        <TextField label="Category" value={macro.category} onChange={v => set('category', v)} />
        <TextField label="URL" value={macro.url} onChange={v => set('url', v)} />
        <TextField label="Normalised URL (host)" value={macro.normalisedURL} placeholder="example.com" onChange={v => set('normalisedURL', v)} />
        <TextField label="Hotkey (e.g. KeyG)" value={macro.key} placeholder="optional" onChange={v => set('key', orUndefined(v))} />
        <IconPicker value={macro.icon} onChange={v => set('icon', orUndefined(v))} />
        <ColorPicker label="Text color" value={macro.textColor} onChange={v => set('textColor', v)} />
        <div className={classes['field']}>
          <span className={classes['fieldLabel']}>Menu</span>
          <CheckboxField label="Pinned to macros menu" checked={macro.pinned} onChange={v => set('pinned', v)} />
        </div>
      </div>
      <ChipInput
        label="Triggers (Enter, Tab, or comma to add)"
        values={macro.triggers}
        placeholder="e.g. g, gh, github"
        onChange={v => set('triggers', v)}
      />
    </>
  )
}

function MacroRow({ index, macro, isOpen, isFirst, isLast, onToggle, onSetField, onRemove, onMove }) {
  const triggers = macro.triggers?.length ? ` — ${macro.triggers.join(', ')}` : ''
  return (
    <div className={classes['row']}>
      <RowHeader bgColor={macro.bgColor} title={macro.name || `(macro #${index + 1})`} detail={triggers} isOpen={isOpen} onToggle={onToggle}>
        <button type="button" className={classes['iconBtn']} disabled={isFirst} onClick={() => onMove(-1)} aria-label="Move up">↑</button>
        <button type="button" className={classes['iconBtn']} disabled={isLast} onClick={() => onMove(1)} aria-label="Move down">↓</button>
        <button type="button" className={classes['iconBtn']} onClick={onRemove} aria-label="Delete macro" title="Delete macro">🗑</button>
      </RowHeader>
      {isOpen && (
        <>
          <MacroFields macro={macro} set={onSetField} />
          <p className={classes['subhead']}>Background</p>
          <BgColorEditor value={macro.bgColor} onChange={v => onSetField('bgColor', v)} />
          <p className={classes['subhead']}>Commands</p>
          <CommandsBlock commands={macro.commands} onChange={v => onSetField('commands', v)} />
        </>
      )}
    </div>
  )
}

export default MacroRow
