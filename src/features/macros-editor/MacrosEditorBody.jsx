import { memo } from 'react'
import classes from './MacrosEditor.module.css'
import MacrosTab from './MacrosTab'
import CommandsTab from './CommandsTab'
import EnginesTab from './EnginesTab'
import EditorToolbar from './EditorToolbar'
import EditorStatus from './EditorStatus'
import { useConfigDraft } from './useConfigDraft'
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

/**
 * Editing surface for macros, commands and engines: toolbar, tabs, the active tab's form, and validation status. It has no
 * dialog chrome of its own; the Settings modal hosts it. `revision` is bumped by the host to reload from storage, and
 * `onSaved(config)` is called after every successful save.
 */
function MacrosEditorBody({ revision = 0, onSaved }) {
  const draft = useConfigDraft({ revision, onSaved })
  const { cfg, activeTab } = draft

  const onKeyDown = e => {
    if (!(e.ctrlKey || e.metaKey) || e.key !== 's') return
    e.preventDefault()
    draft.saveNow()
  }

  return (
    <div className={classes['embedded']} onKeyDown={onKeyDown}>
      <EditorToolbar
        valid={draft.valid}
        onSave={draft.saveNow}
        onExport={draft.exportJson}
        onImport={draft.importFile}
        onLoadBundled={draft.loadBundled}
        onReset={draft.reset}
      />

      <div className={classes['tabs']} role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${classes['tab']}${activeTab === tab.id ? ' ' + classes['active'] : ''}`}
            onClick={() => draft.selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={classes['scroll']}>
        {activeTab === 'macros' && <MacrosTab macros={cfg.macros} onChange={draft.setSlice('macros')} />}
        {activeTab === 'commands' && <CommandsTab commands={cfg.commands} onChange={draft.setSlice('commands')} />}
        {activeTab === 'engines' && <EnginesTab engines={cfg.engines} onChange={draft.setSlice('engines')} />}
        {activeTab === 'json' && <RawJson text={draft.rawText} valid={draft.valid} onChange={draft.editRaw} />}
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
