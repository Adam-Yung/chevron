import { useContext, useLayoutEffect, useState } from 'react'
import { SettingsContext } from '../settings/SettingsProvider'
import { useUi } from '../state/UiStore'
import useDestination from '../search/useDestination'
import useConfig from '../search/useConfig'
import { feltColor } from '../lib/getCssGradient'
import MacroIcon from '../features/macros/MacroIcon'
import InteractiveBackground from '../features/search/InteractiveBackground'
import classes from './LaunchOverlay.module.css'

function originRect(macroName) {
  const el = macroName && document.querySelector(`[data-macro="${CSS.escape(macroName)}"]`)
  const rect = el?.getBoundingClientRect()
  if (rect?.width) return rect
  const side = Math.min(window.innerWidth, window.innerHeight) * 0.5
  return { left: -side / 2, top: (window.innerHeight - side) / 2, width: side, height: side }
}

function circles(rect) {
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const far = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  return { start: `circle(${rect.width / 2}px at ${x}px ${y}px)`, covering: `circle(${far + 1}px at ${x}px ${y}px)` }
}

function useGrowingCircle(leaving, fromSearch) {
  const [frame, setFrame] = useState(null)
  useLayoutEffect(() => {
    if (!leaving) {
      setFrame(null)
      return undefined
    }
    // From search the disc starts at the blob: the site's dock badge is still in the page, but faded out.
    setFrame({ ...circles(originRect(fromSearch ? null : leaving.macro)), grown: false })
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setFrame(f => f && { ...f, grown: true })))
    return () => cancelAnimationFrame(id)
  }, [leaving, fromSearch])
  return frame
}

function Badge({ macro, named }) {
  return (
    <div className={classes.badge}>
      <MacroIcon icon={macro.icon} color='currentColor' className={classes.icon} />
      {named && <div className={classes.name} data-launch-name>{macro.name}</div>}
    </div>
  )
}

// While a same-tab navigation loads, a disc of the destination's colour grows from where it was launched until it covers the
// screen. Purely decorative: the navigation started before this rendered.
export default function LaunchOverlay() {
  const leaving = useUi(s => s.leaving)
  const fromSearch = useUi(s => s.view === 'search')
  const settings = useContext(SettingsContext)
  const destination = useDestination()
  const { macros } = useConfig()
  const frame = useGrowingCircle(leaving, fromSearch)

  if (!leaving || !frame) return null
  const macro = leaving.macro ? macros.find(m => m.name === leaving.macro) : null
  const look = macro ?? destination ?? {}
  const t = Math.max(0, Number(settings.general.animationSpeed) || 0)
  return (
    <div className={classes.overlay} aria-hidden='true' data-launch style={{ '--t': t + 'ms' }}>
      <div className={`felt ${classes.disc}`} style={{ '--felt': feltColor(look.bgColor), clipPath: frame.grown ? frame.covering : frame.start }}>
        {fromSearch && (
          <InteractiveBackground width={window.innerWidth} height={window.innerHeight} color='var(--felt-mixed)'
            textColor='var(--thread)' marqueeText={destination?.marquee ?? ''} />
        )}
      </div>
      {macro && <Badge macro={macro} named={fromSearch} />}
    </div>
  )
}
