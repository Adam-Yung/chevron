import { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react'
import {
  loadConfig, saveConfig, resetConfig, readBundledConfig, findForbiddenUrls,
  CONFIG_SCHEMA_VERSION
} from '../../classes/localStorage/config'
import classes from './MacrosEditor.module.css'

/**
 * Macros / Commands / Engines editor (Phase 4 MVP).
 *
 * Approach: a JSON editor for the whole config blob. This is the
 * smallest UI that:
 *   - covers every existing field (color objects, triggers arrays,
 *     commands maps, engine templates) without needing a per-type
 *     widget;
 *   - round-trips cleanly with the existing /public/config.js shape;
 *   - works fully offline (no network calls anywhere in this flow).
 *
 * Per-field UI (color picker, chip input for triggers, commands
 * template builder) is queued for Phase 4.5 once the data flow here
 * has settled.
 */

function pretty(obj) {
  return JSON.stringify(obj, null, 2)
}

function MacrosEditor({ open, onClose }) {
  const dialogRef = useRef(null)
  const lastFocusedRef = useRef(null)
  const fileInputRef = useRef(null)

  // Initial value: whatever loadConfig() resolves (persisted override
  // wins; falls back to bundled). Re-resolved every time the dialog
  // opens, so editing -> closing -> reopening shows the latest saved
  // state.
  const [text, setText] = useState(() => pretty(loadConfig()))
  const [status, setStatus] = useState({ kind: 'idle', message: '' })

  useEffect(() => {
    if (!open) return
    setText(pretty(loadConfig()))
    setStatus({ kind: 'idle', message: '' })
    lastFocusedRef.current = document.activeElement
    const id = window.requestAnimationFrame(() => dialogRef.current?.focus())
    return () => {
      window.cancelAnimationFrame(id)
      if (lastFocusedRef.current?.focus)
        try { lastFocusedRef.current.focus() } catch { /* ignore */ }
    }
  }, [open])

  // Live parse so we can give immediate feedback / disable Save when
  // JSON is malformed or contains forbidden URL schemes.
  const parsed = useMemo(() => {
    try {
      const value = JSON.parse(text)
      const bad = findForbiddenUrls(value)
      return { ok: bad.length === 0, value, bad, parseError: null }
    } catch (err) {
      return { ok: false, value: null, bad: [], parseError: err.message }
    }
  }, [text])

  const summary = useMemo(() => {
    if (!parsed.ok || !parsed.value) return null
    const m = Array.isArray(parsed.value.macros) ? parsed.value.macros.length : 0
    const c = Array.isArray(parsed.value.commands) ? parsed.value.commands.length : 0
    const e = parsed.value.engines && typeof parsed.value.engines === 'object'
      ? Object.keys(parsed.value.engines).length : 0
    return { m, c, e }
  }, [parsed])

  const handleSave = useCallback(() => {
    if (!parsed.ok) return
    const result = saveConfig(parsed.value)
    if (result.ok)
      setStatus({ kind: 'success', message: 'Saved. Changes apply on the next query — no reload needed.' })
    else
      setStatus({ kind: 'error', message: result.reason })
  }, [parsed])

  const handleReset = useCallback(() => {
    const bundled = resetConfig()
    setText(pretty(bundled))
    setStatus({ kind: 'success', message: 'Reverted to the bundled config.js.' })
  }, [])

  const handleLoadBundled = useCallback(() => {
    setText(pretty(readBundledConfig()))
    setStatus({ kind: 'idle', message: 'Loaded bundled config into the editor (not saved yet).' })
  }, [])

  const handleExport = useCallback(() => {
    if (!parsed.ok) return
    const blob = new Blob([pretty({ version: CONFIG_SCHEMA_VERSION, ...parsed.value })], {
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
  }, [parsed])

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
        setText(pretty(inner))
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
    // Ctrl/Cmd+S → save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handleSave()
    }
  }, [onClose, handleSave])

  if (!open) return null

  const errorMsg = parsed.parseError
    ? 'Invalid JSON: ' + parsed.parseError
    : parsed.bad.length > 0
      ? 'Forbidden URL scheme(s) at: ' + parsed.bad.join(', ')
      : null

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
                  onClick={handleSave} disabled={!parsed.ok}>
            Save (⌘/Ctrl+S)
          </button>
          <button type="button" className={classes['btn']} onClick={handleExport} disabled={!parsed.ok}>
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

        <textarea
          className={`${classes['editor']}${parsed.ok ? '' : ' ' + classes['invalid']}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="Config JSON"
          aria-invalid={!parsed.ok}
        />

        <p className={classes['summary']}>
          {summary
            ? `${summary.m} macro${summary.m === 1 ? '' : 's'}, ${summary.c} command${summary.c === 1 ? '' : 's'}, ${summary.e} engine${summary.e === 1 ? '' : 's'}.`
            : '\u00a0'}
        </p>
        <div className={`${classes['status']}${
          status.kind === 'error' ? ' ' + classes['error'] :
          status.kind === 'success' ? ' ' + classes['success'] : ''
        }`}>
          {errorMsg || status.message || '\u00a0'}
        </div>

        <p className={classes['help']}>
          Edits are saved to <code>localStorage["chevron.config"]</code>.
          They override <code>/public/config.js</code> until you click
          "Reset to bundled". No network requests are made — works fully
          offline.
        </p>
      </div>
    </div>
  )
}

export default memo(MacrosEditor)
