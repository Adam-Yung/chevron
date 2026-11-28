import { useEffect, useMemo, useRef, useState } from 'react'
import { loadConfig } from '../../storage/macrosConfig'
import { validateConfig } from './validateConfig'
import { useAutosave } from './useAutosave'
import { autosave } from './draftActions'

const IDLE = { kind: 'idle', message: '' }

// A bumped `revision` reloads from storage. Not on mount: that would look like an edit.
function useReloadOnRevision(revision, { markClean, setCfg, setRawError, setActiveTab, setStatus }) {
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
  }, [revision, markClean, setCfg, setRawError, setActiveTab, setStatus])
}

/**
 * Editing state for the macros editor: the working config (`cfg`), the raw JSON text, the active tab, validation and the
 * autosave. The actions on it are in draftActions.js. `cfg` is the single source of truth.
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

  const { markClean } = useAutosave({ value: cfg, valid, save: config => autosave({ onSaved, setStatus }, config) })
  useReloadOnRevision(revision, { markClean, setCfg, setRawError, setActiveTab, setStatus })

  return {
    cfg, rawText, rawError, activeTab, status, validation, valid,
    onSaved, markClean, setCfg, setRawText, setRawError, setActiveTab, setStatus
  }
}
