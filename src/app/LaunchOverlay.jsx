import { useContext, useLayoutEffect, useState } from 'react'
import { SettingsContext } from '../settings/SettingsProvider'
import { useUi } from '../state/UiStore'
import useDestination from '../search/useDestination'
import { usePinnedMacros } from '../search/useConfig'
import { feltColor } from '../lib/getCssGradient'
import MacroIcon from '../features/macros/MacroIcon'
import classes from './LaunchOverlay.module.css'

function originRect(macroName) {
  const el = macroName && document.querySelector(`[data-macro="${CSS.escape(macroName)}"]`)
  const rect = el?.getBoundingClientRect()
  if (rect?.width) return rect
  const side = Math.min(window.innerWidth, window.innerHeight) * 0.5
  return { left: -side / 2, top: (window.innerHeight - side) / 2, width: side, height: side }
}

function coverScale(rect) {
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const far = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy))
  return (far * 2) / Math.max(rect.width, 1) + 0.2
}

/**
 * While a same-tab navigation loads, a disc of the destination's colour grows from where it was launched until it covers the
 * screen. Purely decorative: the navigation started before this rendered, so it adds no delay.
 */
export default function LaunchOverlay() {
  const leaving = useUi(s => s.leaving)
  const settings = useContext(SettingsContext)
  const destination = useDestination()
  const pinned = usePinnedMacros()
  const [frame, setFrame] = useState(null)

  useLayoutEffect(() => {
    if (!leaving) {
      setFrame(null)
      return undefined
    }
    const rect = originRect(leaving.macro)
    setFrame({ rect, scale: coverScale(rect), grown: false })
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setFrame(f => f && { ...f, grown: true })))
    return () => cancelAnimationFrame(id)
  }, [leaving])

  if (!leaving || !frame) return null
  const macro = leaving.macro ? pinned.find(m => m.name === leaving.macro) : null
  const look = macro ?? destination ?? {}
  const t = Math.max(0, Number(settings.general.animationSpeed) || 0)
  const { rect } = frame
  return (
    <div className={classes.overlay} aria-hidden='true' style={{ '--t': t + 'ms' }}>
      <div className={`felt ${classes.disc}`} style={{
        left: rect.left, top: rect.top, width: rect.width, height: rect.width,
        '--felt': feltColor(look.bgColor), transform: frame.grown ? `scale(${frame.scale})` : 'none'
      }} />
      {macro && <MacroIcon icon={macro.icon} color='currentColor' className={classes.icon} />}
    </div>
  )
}
