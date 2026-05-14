import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import classes from './IconPicker.module.css'

const ALL_ICON_NAMES = typeof window !== 'undefined' && window.ICONS
  ? Object.keys(window.ICONS)
  : []

function IconPicker({ value, onChange }) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const triggerRef        = useRef(null)
  const popoverRef        = useRef(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_ICON_NAMES
    return ALL_ICON_NAMES.filter(n => n.toLowerCase().includes(q))
  }, [query])

  const openPicker = useCallback(() => {
    setQuery('')
    setOpen(true)
  }, [])

  const select = useCallback((name) => {
    onChange(name)
    setOpen(false)
  }, [onChange])

  const handleBackdropPointerDown = useCallback((e) => {
    if (popoverRef.current && !popoverRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)) {
      setOpen(false)
    }
  }, [])

  const [popoverStyle, setPopoverStyle] = useState({})
  const handleTriggerClick = useCallback(() => {
    if (open) { setOpen(false); return }
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPopoverStyle({
        position: 'fixed',
        top: r.bottom + 6,
        left: Math.max(8, r.left),
      })
    }
    openPicker()
  }, [open, openPicker])

  const currentSvg = value && window.ICONS?.[value]

  return (
    <div className={classes['root']}>
      <label className={classes['label']}>Icon</label>
      <button
        ref={triggerRef}
        type="button"
        className={classes['trigger']}
        onClick={handleTriggerClick}
        title={value || 'Pick an icon'}
        aria-label={value ? `Icon: ${value}. Click to change.` : 'Pick an icon'}>
        {currentSvg
          ? <span className={classes['svg-wrap']} dangerouslySetInnerHTML={{ __html: currentSvg }} />
          : <span className={classes['placeholder']}>?</span>
        }
        <span className={classes['trigger-name']}>
          {value || <em>none</em>}
        </span>
      </button>

      {open && createPortal(
        <>
          <div
            className={classes['backdrop']}
            onPointerDown={handleBackdropPointerDown}
          />
          <div
            ref={popoverRef}
            className={classes['popover']}
            style={popoverStyle}
            data-keep-focus="true">
            <input
              className={classes['search']}
              type="text"
              placeholder="Search icons…"
              value={query}
              autoFocus
              onChange={e => setQuery(e.target.value)}
            />
            <div className={classes['grid']}>
              {filtered.length === 0 && (
                <div className={classes['no-results']}>No icons match "{query}"</div>
              )}
              {filtered.map(name => (
                <button
                  key={name}
                  type="button"
                  className={`${classes['swatch']} ${name === value ? classes['selected'] : ''}`}
                  title={name}
                  aria-label={name}
                  onClick={() => select(name)}>
                  <span dangerouslySetInnerHTML={{ __html: window.ICONS[name] }} />
                </button>
              ))}
            </div>
            <div className={classes['hint']}>
              Add custom icons: <code>node scripts/add-icon.mjs domain.com --write</code>
            </div>
          </div>
        </>,
        document.getElementById('root')
      )}
    </div>
  )
}

export default memo(IconPicker)
