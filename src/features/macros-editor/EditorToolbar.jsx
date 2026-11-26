import { useRef } from 'react'
import classes from './MacrosEditor.module.css'

export default function EditorToolbar({ valid, onSave, onExport, onImport, onLoadBundled, onReset }) {
  const fileInput = useRef(null)
  return (
    <div className={classes['toolbar']}>
      <button type="button" className={`${classes['btn']} ${classes['primary']}`} onClick={onSave} disabled={!valid}>Save now</button>
      <button type="button" className={classes['btn']} onClick={onExport} disabled={!valid}>Export JSON</button>
      <button type="button" className={classes['btn']} onClick={() => fileInput.current?.click()}>Import JSON…</button>
      <button type="button" className={classes['btn']} onClick={onLoadBundled}>Load bundled</button>
      <button type="button" className={`${classes['btn']} ${classes['danger']}`} onClick={onReset}>Reset to bundled</button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        aria-label="Import JSON file"
        hidden
        onChange={e => {
          onImport(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
