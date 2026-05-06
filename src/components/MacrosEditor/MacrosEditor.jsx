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
 * Macros / Commands / Engines editor.
 *
 * Phase 4 shipped a JSON-only editor as the MVP.
 * Phase 4.5 adds per-field UIs:
 *   - Macros tab: name, category, url, triggers (chip input),
 *     bgColor (solid + gradient picker), textColor, pinned, hotkey,
 *     icon (datalist of bundled icon names), commands.
 *   - Commands tab: type + trigger.
 *   - Engines tab: name + bgColor + textColor + per-type templates.
 *   - Raw JSON tab: the original JSON editor, kept for power users so
 *     no advanced field is unreachable.
 *
 * Design constraints kept from Phase 4:
 *   - Fully offline. No network calls anywhere in this flow.
 *   - No heavy deps (no MUI Joy, no react-colorful, no colorjs.io).
 *     Native form controls only.
 *   - Saves go through `saveConfig`, which validates URL schemes
 *     before persisting.
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

function MacrosEditor({ open, onClose }) {
  const dialogRef = useRef(null)
  const lastFocusedRef = useRef(null)
  const fileInputRef = useRef(null)

  // Source of truth while editing: the parsed object. The Raw JSON
  // tab serializes from this; on edit there it parses back. Keeping
  // a single source means switching tabs never loses pending edits.
  const [cfg, setCfg] = useState(() => loadConfig())
  // Mirror string used by the Raw JSON tab. Kept in state so an
  // invalid keystroke doesn't get re-serialized over.
  const [rawText, setRawText] = useState(() => pretty(loadConfig()))
  const [activeTab, setActiveTab] = useState('macros')
  const [status, setStatus] = useState({ kind: 'idle', message: '' })

  // Re-resolve from storage whenever the dialog reopens, and reset
  // status / focus.
  useEffect(() => {
    if (!open) return
    const fresh = loadConfig()
    setCfg(fresh)
    setRawText(pretty(fresh))
    setStatus({ kind: 'idle', message: '' })
    setActiveTab('macros')
    lastFocusedRef.current = document.activeElement
    const id = window.requestAnimationFrame(() => dialogRef.current?.focus())
    return () => {
      window.cancelAnimationFrame(id)
      if (lastFocusedRef.current?.focus)
        try { lastFocusedRef.current.focus() } catch { /* ignore */ }
    }
  }, [open])

  // Validation against the *current* edit surface. When in Raw JSON
  // mode, validate the text. Otherwise, validate cfg.
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

  // Available icon names for the icon-name datalist on each macro row.
  const iconNames = useMemo(() => {
    if (typeof window === 'undefined' || !window.ICONS) return []
    return Object.keys(window.ICONS)
  }, [])

  // Update the parsed cfg slice. Also re-serializes rawText so when
  // the user toggles to JSON view they see the latest.
  const setSlice = useCallback((key) => (next) => {
    setCfg((prev) => {
      const out = { ...prev, [key]: next }
      setRawText(pretty(out))
      return out
    })
  }, [])

  const handleSave = useCallback(() => {
    if (!validation.ok) return
    const payload = activeTab === 'json' ? validation.value : cfg
    const result = saveConfig(payload)
    if (result.ok) {
      // After saving from Raw JSON, reflect the parsed value into cfg
      // so other tabs see it.
      if (activeTab === 'json') setCfg(payload)
      else setRawText(pretty(payload))
      setStatus({ kind: 'success', message: 'Saved. Changes apply on the next query — no reload needed.' })
    } else {
      setStatus({ kind: 'error', message: result.reason })
    }
  }, [validation, activeTab, cfg])

  const handleReset = useCallback(() => {
    const bundled = resetConfig()
    setCfg(bundled)
    setRawText(pretty(bundled))
    setStatus({ kind: 'success', message: 'Reverted to the bundled config.js.' })
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
        // Strip the version wrapper if present.
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
    e.target.value = '' // allow re-importing the same file
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      e.preventDefault()
      onClose()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
  }, [onClose, handleSave])

  // When the user edits the raw JSON, push a parsed value into cfg
  // (best-effort) so toggling back to a form tab shows their work.
  const handleRawChange = useCallback((next) => {
    setRawText(next)
    try {
      const parsed = JSON.parse(next)
      // Only adopt into cfg if shape is sensible (don't trample on
      // the form tabs with `null` while user is mid-keystroke).
      if (parsed && typeof parsed === 'object') {
        setCfg({
          macros: Array.isArray(parsed.macros) ? parsed.macros : [],
          commands: Array.isArray(parsed.commands) ? parsed.commands : [],
          engines: (parsed.engines && typeof parsed.engines === 'object') ? parsed.engines : {}
        })
      }
    } catch { /* ignore — parse error is surfaced in errorMsg */ }
  }, [])

  if (!open) return null

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
    <div
      className={classes['backdrop']}
      onClick={onClose}
      data-keep-focus="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Macros and engines editor"
        tabIndex={-1}
        className={classes['dialog']}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={classes['header']}>
          <h2>Macros / commands / engines</h2>
          <button
            type="button"
            className={classes['closeBtn']}
            onClick={onClose}
            aria-label="Close editor"
          >
            Close (Esc)
          </button>
        </div>

        <div className={classes['toolbar']}>
          <button type="button" className={`${classes['btn']} ${classes['primary']}`}
                  onClick={handleSave} disabled={!validation.ok}>
            Save (⌘/Ctrl+S)
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
              iconNames={iconNames}
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
    </div>
  )
}

export default memo(MacrosEditor)
