// The editor's actions. Each takes the `draft` returned by useConfigDraft for the current render.
import { saveConfig, resetConfig, readBundledConfig } from '../../storage/macrosConfig'
import { pretty, parseRawConfig, importConfig } from './configDraft'
import { downloadConfig, readJsonFile } from './configFiles'

function persist({ onSaved, setStatus }, config) {
  const result = saveConfig(config)
  if (!result.ok) {
    setStatus({ kind: 'error', message: `Could not save: ${result.reason}` })
    return false
  }
  onSaved?.(config)
  return true
}

export function autosave(draft, config) {
  const ok = persist(draft, config)
  if (ok) draft.setStatus({ kind: 'success', message: 'Saved.' })
  return ok
}

export function saveNow(draft) {
  if (!draft.valid || !persist(draft, draft.cfg)) return
  draft.markClean(draft.cfg)
  draft.setStatus({ kind: 'success', message: 'Saved. Changes apply on the next query, no reload needed.' })
}

function adopt({ setCfg, setRawText, setRawError, setStatus }, next, message) {
  setCfg(next)
  setRawText(pretty(next))
  setRawError(null)
  setStatus({ kind: 'success', message })
}

export function selectTab(draft, tab) {
  if (tab === draft.activeTab) return
  draft.setActiveTab(tab)
  if (tab === 'json') {
    draft.setRawText(pretty(draft.cfg))
    draft.setStatus({ kind: 'idle', message: '' })
    return
  }
  if (draft.rawError) draft.setStatus({ kind: 'warning', message: 'The Raw JSON had errors, so the last valid version is shown here.' })
  draft.setRawError(null)
}

export function setSlice({ setCfg }, key, next) {
  setCfg(prev => ({ ...prev, [key]: next }))
}

export function editRaw({ setRawText, setRawError, setCfg }, text) {
  const { config, error } = parseRawConfig(text)
  setRawText(text)
  setRawError(error)
  if (config) setCfg(config)
}

function confirmReplace(what) {
  return window.confirm(`${what} This replaces everything currently in the editor and is saved straight away.`)
}

export function reset(draft) {
  if (!confirmReplace('Reset to the bundled config?')) return
  const bundled = resetConfig()
  draft.markClean(bundled)
  adopt(draft, bundled, 'Reverted to the bundled config.js.')
}

export function loadBundled(draft) {
  if (!confirmReplace('Load the bundled config?')) return
  adopt(draft, readBundledConfig(), 'Loaded the bundled config.')
}

export function exportJson({ valid, cfg, setStatus }) {
  if (!valid) return
  downloadConfig(cfg)
  setStatus({ kind: 'success', message: 'Exported to chevron-config.json.' })
}

export async function importFile(draft, file) {
  if (!file || !confirmReplace(`Import ${file.name}?`)) return
  try {
    const { config, error } = importConfig(draft.cfg, await readJsonFile(file))
    if (error) draft.setStatus({ kind: 'error', message: `Could not import ${file.name}: ${error}` })
    else adopt(draft, config, `Imported ${file.name}.`)
  } catch (err) {
    draft.setStatus({ kind: 'error', message: `Could not read ${file.name}: ${err.message}` })
  }
}
