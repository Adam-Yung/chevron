import { useContext, useMemo } from 'react'
import { SettingsContext } from '../../settings/SettingsProvider'
import getCssGradient from '../../lib/getCssGradient'
import classes from './InteractiveBackground.module.css'

const ROWS = 6
const LINES_PER_ROW = 15
// px/s in the old JS marquee; mapped to a CSS duration so the speed looks the same.
const SPEED = 25

function buildRows(keyPrefix, count, lines) {
  return Array.from({ length: count }, (_, i) => (
    <div key={keyPrefix + i} className={classes['row']}>
      {lines}
    </div>
  ))
}

// Two identical halves, so the CSS animation can loop without a seam.
function buildMarquee(text) {
  const lines = Array.from({ length: LINES_PER_ROW }, (_, i) => <div key={i}>{text}</div>)
  const totalRows = (text.length < 5) ? ROWS * 2 : ROWS
  const duration = Math.max(8, (totalRows * 60) / SPEED)
  return (
    <div
      className={classes['marquee']}
      style={{ '--marquee-duration': duration + 's' }}
      aria-hidden="true">
      <div className={classes['marquee-track']}>
        {buildRows('a-', totalRows, lines)}
        {buildRows('b-', totalRows, lines)}
      </div>
    </div>
  )
}

function InteractiveBackground({
  width,
  height,
  color, // a colour string or a gradient description, as getCssGradient takes
  marqueeText='',
  textColor='#d2d2d2',
  paused=false
}) {
  const settings = useContext(SettingsContext)
  const enableMarquee = settings.chevron.quickLook.marquee

  // The text grid is rebuilt only when its inputs change; it scrolls by a CSS transform animation, never by JS.
  const marquee = useMemo(() => (marqueeText && enableMarquee ? buildMarquee(marqueeText) : null), [marqueeText, enableMarquee])

  // The rotated square must be at least the window's diagonal to cover it at any angle.
  const diagonal = useMemo(() => Math.sqrt(width * width + height * height), [width, height])

  const variables = useMemo(() => ({
    '--diagonal': diagonal + 'px',
    '--rotation-angle': '330deg',
    '--text-color': textColor,
    '--text-size': '5vmin',
    '--text-opacity': .2,
    '--secondary': getCssGradient(color)
  }), [diagonal, textColor, color])

  return (
    <div
      className={paused ? `${classes['viewport']} ${classes['paused']}` : classes['viewport']}
      style={variables}>
      <div className={classes['container']}>
        { marquee }
      </div>
    </div>
  )
}

export default InteractiveBackground
