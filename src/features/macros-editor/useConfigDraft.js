import { useEffect, useMemo, useRef, useState } from 'react'
import { loadConfig, saveConfig, resetConfig, readBundledConfig } from '../../storage/macrosConfig'
import { pretty, parseRawConfig, importConfig } from './configDraft'
import { validateConfig } from './validateConfig'
import { downloadConfig, readJsonFile } from './configFiles'
import { useAutosave } from './useAutosave'

const IDLE = { kind: 'idle', message: '' }

function confirmReplace(what) {
  return window.confirm(`${what} This replaces everything currently in the editor and is saved straight away.`)
}

/**
 * Editing state for the macros editor: the working config (`cfg`), the raw JSON text, the active tab, validation and
 * every action (save, reset, import, export). `cfg` is the single source of truth; `rawText` only exists while the Raw JSON
 * tab is open and is re-derived from `cfg` whenever that tab is entered.
 */
export function useConfigDraft({ revision, onSaved }) {
  const [cfg, setCfg] = useState(() => loadConfig())
  const [rawText, setRawText] = useState('')
  const [rawError, setRawError] = useState(null)
  const [activeTab, setActiveTab] = useState('macros')
  const [status, setStatus] = useState(IDLE)

  const validation = useMemo(() => {
    if (rawError) return { errors: [rawError], warnings: [] }
    return validateConfig(cfg)
  }, [cfg, rawError])
  const valid = validation.errors.length === 0

  const persist = config => {
    const result = saveConfig(config)
    if (!result.ok) {
      setStatus({ kind: 'error', message: `Could not save: ${result.reason}` })
      return false
    }
    onSaved?.(config)
    return true
  }

  const { markClean } = useAutosave({
    value: cfg,
    valid,
    save: config => {
      const ok = persist(config)
      if (ok) setStatus({ kind: 'success', message: 'Saved.' })
      return ok
    }
  })

  const seenRevision = useRef(revision)
  useEffect(() => {
    if (seenRevision.current === revision) return
    seenRevision.current = revision
    const fresh = loadConfig()
    setCfg(fresh)
    markClean(fresh)
    setRawError(null)
    setActiveTab('macros')
    setStatus(IDLE)
  }, [revision, markClean])

  const adopt = (next, message) => {
    setCfg(next)
    setRawText(pretty(next))
    setRawError(null)
    setStatus({ kind: 'success', message })
  }

  const selectTab = tab => {
    if (tab === activeTab) return
    setActiveTab(tab)
    if (tab === 'json') {
      setRawText(pretty(cfg))
      setStatus(IDLE)
      return
    }
    if (rawError) setStatus({ kind: 'warning', message: 'The Raw JSON had errors, so the last valid version is shown here.' })
    setRawError(null)
  }

  const setSlice = key => next => setCfg(prev => ({ ...prev, [key]: next }))

  const editRaw = text => {
    const { config, error } = parseRawConfig(text)
    setRawText(text)
    setRawError(error)
    if (config) setCfg(config)
  }

  const saveNow = () => {
    if (!valid || !persist(cfg)) return
    markClean(cfg)
    setStatus({ kind: 'success', message: 'Saved. Changes apply on the next query, no reload needed.' })
  }

  const reset = () => {
    if (!confirmReplace('Reset to the bundled config?')) return
    const bundled = resetConfig()
    markClean(bundled)
    adopt(bundled, 'Reverted to the bundled config.js.')
  }

  const loadBundled = () => {
    if (!confirmReplace('Load the bundled config?')) return
    adopt(readBundledConfig(), 'Loaded the bundled config.')
  }

  const exportJson = () => {
    if (!valid) return
    downloadConfig(cfg)
    setStatus({ kind: 'success', message: 'Exported to chevron-config.json.' })
  }

  const importFile = async file => {
    if (!file || !confirmReplace(`Import ${file.name}?`)) return
    try {
      const { config, error } = importConfig(cfg, await readJsonFile(file))
      if (error) setStatus({ kind: 'error', message: `Could not import ${file.name}: ${error}` })
      else adopt(config, `Imported ${file.name}.`)
    } catch (err) {
      setStatus({ kind: 'error', message: `Could not read ${file.name}: ${err.message}` })
    }
  }

  return { cfg, rawText, activeTab, status, validation, valid, selectTab, setSlice, editRaw, saveNow, reset, loadBundled, exportJson, importFile }
}
