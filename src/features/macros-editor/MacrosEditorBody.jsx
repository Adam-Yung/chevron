import { memo } from 'react'
import classes from './MacrosEditor.module.css'
import MacrosTab from './MacrosTab'
import CommandsTab from './CommandsTab'
import EnginesTab from './EnginesTab'
import EditorToolbar from './EditorToolbar'
import EditorStatus from './EditorStatus'
import { useConfigDraft } from './useConfigDraft'
import { exportJson, editRaw, importFile, loadBundled, reset, saveNow, selectTab, setSlice } from './draftActions'
import { summarise } from './configDraft'

const TABS = [
  { id: 'macros', label: 'Macros' },
  { id: 'commands', label: 'Commands' },
  { id: 'engines', label: 'Engines' },
  { id: 'json', label: 'Raw JSON' }
]

function RawJson({ text, valid, onChange }) {
  return (
    <textarea
      className={`${classes['editor']}${valid ? '' : ' ' + classes['invalid']}`}
      value={text}
      onChange={e => onChange(e.target.value)}
      spellCheck={false}
      autoCorrect="off"
      autoCapitalize="off"
      aria-label="Config JSON"
      aria-invalid={!valid}
    />
  )
}

function saveOnShortcut(event, draft) {
  if (!(event.ctrlKey || event.metaKey) || event.key !== 's') return
  event.preventDefault()
  saveNow(draft)
}

// Hosted by the Settings modal. `revision` reloads from storage; `onSaved(config)` follows every successful save.
function MacrosEditorBody({ revision = 0, onSaved }) {
  const draft = useConfigDraft({ revision, onSaved })
  const { cfg, activeTab } = draft

  return (
    <div className={classes['embedded']} onKeyDown={e => saveOnShortcut(e, draft)}>
      <EditorToolbar
        valid={draft.valid}
        onSave={() => saveNow(draft)}
        onExport={() => exportJson(draft)}
        onImport={file => importFile(draft, file)}
        onLoadBundled={() => loadBundled(draft)}
        onReset={() => reset(draft)}
      />

      <div className={classes['tabs']} role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${classes['tab']}${activeTab === tab.id ? ' ' + classes['active'] : ''}`}
            onClick={() => selectTab(draft, tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={classes['scroll']}>
        {activeTab === 'macros' && <MacrosTab macros={cfg.macros} onChange={next => setSlice(draft, 'macros', next)} />}
        {activeTab === 'commands' && <CommandsTab commands={cfg.commands} onChange={next => setSlice(draft, 'commands', next)} />}
        {activeTab === 'engines' && <EnginesTab engines={cfg.engines} onChange={next => setSlice(draft, 'engines', next)} />}
        {activeTab === 'json' && <RawJson text={draft.rawText} valid={draft.valid} onChange={text => editRaw(draft, text)} />}
      </div>

      <p className={classes['summary']}>{summarise(cfg)}</p>
      <EditorStatus validation={draft.validation} status={draft.status} />

      <p className={classes['help']}>
        Edits are saved automatically to <code>localStorage[&quot;chevron.config&quot;]</code> and override{' '}
        <code>public/config.js</code> until you click &quot;Reset to bundled&quot;. No network requests are made.
      </p>
    </div>
  )
}

export default memo(MacrosEditorBody)
