import { useCallback, useLayoutEffect, useRef, useState } from 'react'

const GAP = 6
const EDGE = 8

// Below the trigger by default, flipped above it when there is no room, and kept inside the viewport on narrow screens.
function placePopover(trigger, popover) {
  const t = trigger.getBoundingClientRect()
  const { width, height } = popover.getBoundingClientRect()
  const fitsBelow = t.bottom + GAP + height <= window.innerHeight - EDGE
  const top = fitsBelow ? t.bottom + GAP : Math.max(EDGE, t.top - GAP - height)
  const left = Math.max(EDGE, Math.min(t.left, window.innerWidth - width - EDGE))
  return { position: 'fixed', top, left }
}

/**
 * Open/close state and positioning for the colour and icon popovers. They are portaled out of the settings dialog, so the
 * backdrop closes them on an outside press and Escape closes only the popover (not the whole Settings modal).
 */
export function usePopover() {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState({ position: 'fixed', top: 0, left: 0 })
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)

  useLayoutEffect(() => {
    if (open && triggerRef.current && popoverRef.current) setStyle(placePopover(triggerRef.current, popoverRef.current))
  }, [open])

  const toggle = useCallback(() => setOpen(isOpen => !isOpen), [])
  const close = useCallback(() => setOpen(false), [])

  const onBackdropPointerDown = useCallback(e => {
    const inside = popoverRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)
    if (!inside) setOpen(false)
  }, [])

  const onKeyDown = useCallback(e => {
    if (e.key !== 'Escape') return
    e.stopPropagation()
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  return { open, style, triggerRef, popoverRef, toggle, close, onBackdropPointerDown, onKeyDown }
}
