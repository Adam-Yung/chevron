import { useContext, useMemo } from 'react'
import { SettingsContext } from '../../contexts/Settings'
import getCssGradient from '../../functions/generationUtils/getCssGradient'
import classes from './InteractiveBackground.module.css'

function InteractiveBackground({
  width,
  height,
  color, // background color (can be a single string or an array of 2 strings for gradient)
  marqueeText='',
  marqueeSpeed=25,
  marqueeAngle=330,
  lineDensity=15, // space between lines
  rowDensity=6, // space between rows
  textColor='#d2d2d2',
  textSize='5vmin',
  textOpacity=.2,
  style={}
}) {
  // settings
  const settings = useContext(SettingsContext)
  const enableMarquee = settings.chevron.quickLook.marquee

  // Memoize the row/line tree (~90 elements) so it isn't reallocated on
  // every render (e.g. on every resize-driven re-render of the parent).
  // Phase 6 swap: previously this used `react-fast-marquee` (~5 KB +
  // JS-driven layout). The replacement is a pure CSS keyframe scroller
  // that animates `transform: translateX(-50%)` on a duplicated track,
  // so the entire scroll runs on the compositor without main-thread
  // work each frame.
  const marquee = useMemo(() => {
    if (!marqueeText || !enableMarquee) return null
    /*
      Marquee system consists of {rowDensity} of rows
      and each row consists of {lineDensity} of lines
    */
    const lines = []
    for (let i = 0; i < lineDensity; i++) {
      lines.push(<div key={i}>{marqueeText}</div>)
    }
    const totalRows = (marqueeText.length < 5) ? rowDensity * 2 : rowDensity
    const buildRows = (keyPrefix) => {
      const rows = []
      for (let i = 0; i < totalRows; i++) {
        rows.push(
          <div key={keyPrefix + i} className={classes['row']}>
            {lines}
          </div>
        )
      }
      return rows
    }
    // Map the legacy `marqueeSpeed` (px/sec from react-fast-marquee) to a
    // CSS animation duration. The original lib measured content width to
    // derive an exact duration; we approximate with a heuristic based on
    // row count and the configured speed. Result is "slow / medium / fast"
    // visually equivalent and never zero.
    const duration = Math.max(8, (totalRows * 60) / Math.max(1, marqueeSpeed))
    return (
      <div
        className={classes['marquee']}
        style={{ '--marquee-duration': duration + 's' }}
        aria-hidden="true">
        <div className={classes['marquee-track']}>
          {buildRows('a-')}
          {buildRows('b-')}
        </div>
      </div>
    )
  }, [marqueeText, enableMarquee, lineDensity, rowDensity, marqueeSpeed])
  
  /*
    find the diagonal of the window for propper scale of .container
    .container element must be a square with sides >= diagonal of the window
    to be bigger than .viewport at any angle of rotation
  */
  const diagonal = useMemo(() => Math.sqrt(width * width + height * height), [width, height])
  
  const variables = useMemo(() => ({
    '--diagonal': diagonal + 'px',
    '--rotation-angle': marqueeAngle + 'deg',
    '--text-color': textColor,
    '--text-size': textSize,
    '--text-opacity': textOpacity,
    '--secondary': getCssGradient(color)
  }), [diagonal, marqueeAngle, textColor, textSize, textOpacity, color])
  

  return (
    <div 
      className={classes['viewport']} 
      style={{...variables, ...style}}>
      <div className={classes['container']}>
        { marquee }
      </div>
    </div>
  )
}

export default InteractiveBackground