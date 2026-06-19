import { memo, useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HexColorPicker } from 'react-colorful'
import classes from './ColorPicker.module.css'

function ColorPicker({ label, value, onChange }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)
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
    setOpen(true)
  }, [open])

  const handleBackdropPointerDown = useCallback((e) => {
    if (popoverRef.current && !popoverRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)) {
      setOpen(false)
    }
  }, [])

  const handleColorChange = useCallback((color) => {
    onChange(color)
  }, [onChange])

  const handleInputChange = useCallback((e) => {
    const v = e.target.value
    onChange(v.startsWith('#') ? v : `#${v}`)
  }, [onChange])

  const display = value || '#000000'

  return (
    <div className={classes['root']}>
      {label && <label className={classes['label']}>{label}</label>}
      <button
        ref={triggerRef}
        type="button"
        className={classes['trigger']}
        onClick={handleTriggerClick}
        aria-label={`${label || 'Color'}: ${display}. Click to change.`}
      >
        <span className={classes['swatch']} style={{ background: display }} />
        <span className={classes['hexText']}>{display}</span>
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
            data-keep-focus="true"
          >
            <HexColorPicker
              style={{ width: '100%' }}
              color={display}
              onChange={handleColorChange}
            />
            <input
              className={classes['hexInput']}
              type="text"
              value={display}
              onChange={handleInputChange}
              placeholder="#000000"
              autoFocus
            />
          </div>
        </>,
        document.getElementById('root')
      )}
    </div>
  )
}

export default memo(ColorPicker)
