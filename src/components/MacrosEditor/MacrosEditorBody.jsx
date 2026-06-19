import { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react'
import {
  loadConfig, saveConfig, resetConfig, readBundledConfig, findForbiddenUrls,
  CONFIG_SCHEMA_VERSION
} from '../../classes/localStorage/config'
import classes from './MacrosEditor.module.css'
import MacrosTab from './MacrosTab'
import CommandsTab from './CommandsTab'
import EnginesTab from './EnginesTab'

/**
 * Headless editing surface — toolbar + sub-tabs + scroll area + status.
 * No backdrop / dialog wrapper / outer close button. Designed to be
 * embedded inside a parent modal (the Settings dialog).
 *
 * `revision` is an optional value the parent can bump to force a
 * reload from localStorage (e.g. when the embedding modal reopens).
 */

function pretty(obj) {
  return JSON.stringify(obj, null, 2)
}

const TABS = [
  { id: 'macros', label: 'Macros' },
  { id: 'commands', label: 'Commands' },
  { id: 'engines', label: 'Engines' },
  { id: 'json', label: 'Raw JSON' }
]

const AUTOSAVE_DELAY = 800

function MacrosEditorBody({ revision = 0, onSaved }) {
  const fileInputRef = useRef(null)

  const [cfg, setCfg] = useState(() => loadConfig())
  const [rawText, setRawText] = useState(() => pretty(loadConfig()))
  const [activeTab, setActiveTab] = useState('macros')
  const [status, setStatus] = useState({ kind: 'idle', message: '' })

  const isFirstRender = useRef(true)
  const debounceTimer = useRef(null)
  const latestCfg = useRef(cfg)
  const latestActiveTab = useRef(activeTab)
  const latestRawText = useRef(rawText)

  latestCfg.current = cfg
  latestActiveTab.current = activeTab
  latestRawText.current = rawText

  // Reload on revision bump.
  useEffect(() => {
    const fresh = loadConfig()
    setCfg(fresh)
    setRawText(pretty(fresh))
    setStatus({ kind: 'idle', message: '' })
    setActiveTab('macros')
    isFirstRender.current = true
  }, [revision])

  const validation = useMemo(() => {
    if (activeTab === 'json') {
      try {
        const value = JSON.parse(rawText)
        const bad = findForbiddenUrls(value)
        return { ok: bad.length === 0, value, bad, parseError: null }
      } catch (err) {
        return { ok: false, value: null, bad: [], parseError: err.message }
      }
    }
    const bad = findForbiddenUrls(cfg)
    return { ok: bad.length === 0, value: cfg, bad, parseError: null }
  }, [activeTab, rawText, cfg])

  const validationRef = useRef(validation)
  validationRef.current = validation

  const flushSave = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }
    const v = validationRef.current
    if (!v.ok) return
    const payload = latestActiveTab.current === 'json' ? v.value : latestCfg.current
    const result = saveConfig(payload)
    if (result.ok) {
      setStatus({ kind: 'success', message: 'Auto-saved.' })
      onSaved?.(payload)
    }
  }, [onSaved])

  const setSlice = useCallback((key) => (next) => {
    setCfg((prev) => {
      const out = { ...prev, [key]: next }
      setRawText(pretty(out))
      return out
    })
  }, [])

  const handleSave = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }
    if (!validation.ok) return
    const payload = activeTab === 'json' ? validation.value : cfg
    const result = saveConfig(payload)
    if (result.ok) {
      if (activeTab === 'json') setCfg(payload)
      else setRawText(pretty(payload))
      setStatus({ kind: 'success', message: 'Saved. Changes apply on the next query — no reload needed.' })
      onSaved?.(payload)
    } else {
      setStatus({ kind: 'error', message: result.reason })
    }
  }, [validation, activeTab, cfg, onSaved])

  // Debounced auto-save: triggers ~800ms after cfg changes.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (!validationRef.current.ok) return

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null
      const v = validationRef.current
      if (!v.ok) return
      const payload = latestActiveTab.current === 'json' ? v.value : latestCfg.current
      const result = saveConfig(payload)
      if (result.ok) {
        setStatus({ kind: 'success', message: 'Auto-saved.' })
        onSaved?.(payload)
      }
    }, AUTOSAVE_DELAY)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
        debounceTimer.current = null
      }
    }
  }, [cfg, onSaved])

  // Flush pending auto-save on page unload.
  useEffect(() => {
    const flush = () => flushSave()
    window.addEventListener('beforeunload', flush)
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('beforeunload', flush)
      window.removeEventListener('pagehide', flush)
    }
  }, [flushSave])

  const handleReset = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }
    const bundled = resetConfig()
    setCfg(bundled)
    setRawText(pretty(bundled))
    setStatus({ kind: 'success', message: 'Reverted to the bundled config.js.' })
    isFirstRender.current = true
  }, [])

  const handleLoadBundled = useCallback(() => {
    const bundled = readBundledConfig()
    setCfg(bundled)
    setRawText(pretty(bundled))
    setStatus({ kind: 'idle', message: 'Loaded bundled config into the editor (not saved yet).' })
  }, [])

  const handleExport = useCallback(() => {
    if (!validation.ok) return
    const payload = activeTab === 'json' ? validation.value : cfg
    const blob = new Blob([pretty({ version: CONFIG_SCHEMA_VERSION, ...payload })], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'chevron-config.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setStatus({ kind: 'success', message: 'Exported to chevron-config.json.' })
  }, [validation, activeTab, cfg])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImportFile = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result))
        const { version: _v, ...inner } = obj
        const candidate = {
          macros: Array.isArray(inner.macros) ? inner.macros : [],
          commands: Array.isArray(inner.commands) ? inner.commands : [],
          engines: (inner.engines && typeof inner.engines === 'object') ? inner.engines : {}
        }
        setCfg(candidate)
        setRawText(pretty(candidate))
        setStatus({ kind: 'idle', message: `Loaded ${file.name}. Click Save to persist.` })
      } catch (err) {
        setStatus({ kind: 'error', message: 'Could not parse file: ' + err.message })
      }
    }
    reader.onerror = () => setStatus({ kind: 'error', message: 'File read failed.' })
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  // Cmd/Ctrl+S to save immediately (bypasses debounce).
  const wrapRef = useRef(null)
  useEffect(() => {
    const node = wrapRef.current
    if (!node) return
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    node.addEventListener('keydown', onKey)
    return () => node.removeEventListener('keydown', onKey)
  }, [handleSave])

  const handleRawChange = useCallback((next) => {
    setRawText(next)
    try {
      const parsed = JSON.parse(next)
      if (parsed && typeof parsed === 'object') {
        setCfg({
          macros: Array.isArray(parsed.macros) ? parsed.macros : [],
          commands: Array.isArray(parsed.commands) ? parsed.commands : [],
          engines: (parsed.engines && typeof parsed.engines === 'object') ? parsed.engines : {}
        })
      }
    } catch { /* ignore */ }
  }, [])

  const errorMsg = validation.parseError
    ? 'Invalid JSON: ' + validation.parseError
    : validation.bad.length > 0
      ? 'Forbidden URL scheme(s) at: ' + validation.bad.join(', ')
      : null

  const summary = (() => {
    const m = Array.isArray(cfg.macros) ? cfg.macros.length : 0
    const c = Array.isArray(cfg.commands) ? cfg.commands.length : 0
    const e = cfg.engines && typeof cfg.engines === 'object' ? Object.keys(cfg.engines).length : 0
    return `${m} macro${m === 1 ? '' : 's'}, ${c} command${c === 1 ? '' : 's'}, ${e} engine${e === 1 ? '' : 's'}.`
  })()

  return (
    <div ref={wrapRef} className={classes['embedded']}>
      <div className={classes['toolbar']}>
        <button type="button" className={`${classes['btn']} ${classes['primary']}`}
                onClick={handleSave} disabled={!validation.ok}>
          Save now
        </button>
        <button type="button" className={classes['btn']} onClick={handleExport} disabled={!validation.ok}>
          Export JSON
        </button>
        <button type="button" className={classes['btn']} onClick={handleImportClick}>
          Import JSON…
        </button>
        <button type="button" className={classes['btn']} onClick={handleLoadBundled}>
          Load bundled
        </button>
        <button type="button" className={`${classes['btn']} ${classes['danger']}`} onClick={handleReset}>
          Reset to bundled
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />
      </div>

      <div className={classes['tabs']} role="tablist">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className={`${classes['tab']}${activeTab === t.id ? ' ' + classes['active'] : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={classes['scroll']}>
        {activeTab === 'macros' && (
          <MacrosTab
            macros={cfg.macros || []}
            onChange={setSlice('macros')}
          />
        )}
        {activeTab === 'commands' && (
          <CommandsTab
            commands={cfg.commands || []}
            onChange={setSlice('commands')}
          />
        )}
        {activeTab === 'engines' && (
          <EnginesTab
            engines={cfg.engines || {}}
            onChange={setSlice('engines')}
          />
        )}
        {activeTab === 'json' && (
          <textarea
            className={`${classes['editor']}${validation.ok ? '' : ' ' + classes['invalid']}`}
            value={rawText}
            onChange={(e) => handleRawChange(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            aria-label="Config JSON"
            aria-invalid={!validation.ok}
          />
        )}
      </div>

      <p className={classes['summary']}>{summary}</p>
      <div className={`${classes['status']}${
        status.kind === 'error' ? ' ' + classes['error'] :
        status.kind === 'success' ? ' ' + classes['success'] : ''
      }`}>
        {errorMsg || status.message || '\u00a0'}
      </div>

      <p className={classes['help']}>
        Edits are saved to <code>localStorage[&quot;chevron.config&quot;]</code>.
        They override <code>/public/config.js</code> until you click
        &quot;Reset to bundled&quot;. No network requests are made — works fully
        offline.
      </p>
    </div>
  )
}

export default memo(MacrosEditorBody)
